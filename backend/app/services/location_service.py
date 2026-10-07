# backend/app/services/location_service.py
import logging
from typing import Any
from uuid import UUID

import httpx
from sqlalchemy import func as sa_func
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.exceptions import BadRequestException, GeocodingException, NotFoundException
from app.models.location import Location
from app.schemas.common import LocationSource, PrecisionLevel
from app.schemas.location import (
    AutoDetectRequest, AutoDetectResponse, GeocodingResult,
    IPLocationResponse, LocationResponse, LocationSummary,
)
from app.services.cache_service import CacheKeyBuilder, cache_service
from app.utils import bounding_box, haversine_distance, is_private_ip, validate_coordinate_pair, validate_query_string

logger = logging.getLogger("weatherly.location_service")


def _format_address(city: str | None, state: str | None, country: str | None) -> str:
    parts = [p for p in (city, state, country) if p]
    return ", ".join(parts) if parts else "Unknown Location"


def _parse_ipapi(data: dict) -> dict | None:
    if data.get("status") != "success":
        return None
    return {
        "latitude": data.get("lat"), "longitude": data.get("lon"), "city": data.get("city"),
        "region": data.get("regionName"), "country": data.get("country"),
        "country_code": data.get("countryCode"), "timezone": data.get("timezone"), "isp": data.get("isp"),
    }


def _parse_ipwhois(data: dict) -> dict | None:
    if not data.get("success", True):
        return None
    lat, lon = data.get("latitude"), data.get("longitude")
    if lat is None or lon is None:
        return None
    tz = data.get("timezone")
    if isinstance(tz, dict):
        tz = tz.get("id")
    return {
        "latitude": float(lat), "longitude": float(lon), "city": data.get("city"),
        "region": data.get("region"), "country": data.get("country"),
        "country_code": data.get("country_code"), "timezone": tz, "isp": data.get("isp"),
    }


def _parse_ipinfo(data: dict) -> dict | None:
    loc = data.get("loc", "")
    if not loc or "," not in loc:
        return None
    try:
        lat, lon = (float(p) for p in loc.split(",")[:2])
    except ValueError:
        return None
    return {
        "latitude": lat, "longitude": lon, "city": data.get("city"), "region": data.get("region"),
        "country": data.get("country"), "country_code": data.get("country"),
        "timezone": data.get("timezone"), "isp": data.get("org"),
    }


async def _fetch_ip_location(ip: str) -> dict[str, Any] | None:
    sources = [
        ("ip-api", f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone,isp", _parse_ipapi),
        ("ipwhois", f"https://ipwho.is/{ip}", _parse_ipwhois),
        ("ipinfo", f"https://ipinfo.io/{ip}/json", _parse_ipinfo),
    ]
    async with httpx.AsyncClient(timeout=5.0) as client:
        for name, url, parser in sources:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    parsed = parser(resp.json())
                    if parsed and parsed.get("latitude") is not None:
                        parsed["provider"] = name
                        return parsed
            except Exception as exc:
                logger.debug("IP geo %s failed for %s: %s", name, ip, exc)
    return None


class CityGeocoder:
    def __init__(self) -> None:
        self._cache = cache_service

    async def geocode_city(self, city: str, region: str | None = None, country_code: str | None = None) -> dict[str, Any] | None:
        if not city or len(city.strip()) < 2:
            return None
        city = city.strip()
        cache_key = CacheKeyBuilder.geocode_city(city, region, country_code)
        cached = await self._cache.get(cache_key)
        if cached:
            return cached

        query = f"{city}, {region}" if region else city
        result = await self._geocode_via_providers(query, city, country_code) or await self._geocode_via_nominatim(query, country_code)
        if not result and region:
            result = await self._geocode_via_providers(city, city, country_code) or await self._geocode_via_nominatim(city, country_code)

        if result:
            await self._cache.set(cache_key, result, ttl=86400)
        return result

    async def _geocode_via_providers(self, query: str, target_city: str, country_code: str | None) -> dict[str, Any] | None:
        from app.providers.provider_aggregator import ProviderAggregator

        try:
            results = await ProviderAggregator().geocode(query, limit=5, country_code=country_code)
        except Exception as exc:
            logger.debug("Provider geocode failed for '%s': %s", query, exc)
            return None
        if not results:
            return None
        match = self._best_match(results, target_city)
        if not match:
            return None
        return {
            "latitude": match["latitude"], "longitude": match["longitude"],
            "city": match.get("city") or match.get("name") or target_city,
            "state": match.get("state"), "country": match.get("country"),
            "country_code": match.get("country_code"), "source": "provider_geocoding",
        }

    async def _geocode_via_nominatim(self, query: str, country_code: str | None) -> dict[str, Any] | None:
        params: dict[str, Any] = {"q": query, "format": "json", "limit": 1, "addressdetails": 1}
        if country_code:
            params["countrycodes"] = country_code.lower()
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get("https://nominatim.openstreetmap.org/search", params=params, headers={"User-Agent": "Weatherly/1.0"})
                if resp.status_code == 200 and resp.json():
                    item = resp.json()[0]
                    addr = item.get("address", {})
                    city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality")
                    return {
                        "latitude": float(item["lat"]), "longitude": float(item["lon"]), "city": city,
                        "state": addr.get("state") or addr.get("province"), "country": addr.get("country"),
                        "country_code": (addr.get("country_code") or "").upper() or None, "source": "nominatim",
                    }
        except Exception as exc:
            logger.debug("Nominatim geocode failed for '%s': %s", query, exc)
        return None

    @staticmethod
    def _best_match(results: list[dict[str, Any]], target_city: str) -> dict[str, Any] | None:
        target = target_city.lower().strip()
        for r in results:
            if (r.get("city") or r.get("name") or "").lower().strip() == target:
                return r
        return results[0] if results else None


class LocationResolver:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._cache = cache_service
        self._settings = get_settings()
        self._city_geocoder = CityGeocoder()

    async def auto_detect(self, request_data: AutoDetectRequest, client_ip: str, require_precise: bool = False) -> AutoDetectResponse:
        if request_data.fallback_city:
            return await self._resolve_fallback_city(request_data.fallback_city, request_data.fallback_country_code)

        if request_data.gps_latitude is not None and request_data.gps_longitude is not None:
            return await self._resolve_precise(
                request_data.gps_latitude, request_data.gps_longitude, request_data.gps_accuracy_m,
                LocationSource.GPS, "gps", request_data.gps_altitude_m,
            )

        if request_data.browser_latitude is not None and request_data.browser_longitude is not None:
            return await self._resolve_precise(
                request_data.browser_latitude, request_data.browser_longitude, request_data.browser_accuracy_m,
                LocationSource.BROWSER, "browser_geolocation",
            )

        if require_precise:
            raise BadRequestException("Precise location required. Send GPS/browser coordinates or fallback_city.")

        return await self._resolve_ip(request_data.ip_address or client_ip)

    async def _resolve_precise(
        self, lat: float, lon: float, accuracy_m: float | None,
        source: LocationSource, method: str, altitude_m: float | None = None,
    ) -> AutoDetectResponse:
        lat, lon = validate_coordinate_pair(lat, lon)
        reverse = await self._reverse_geocode_enriched(lat, lon)
        return AutoDetectResponse(
            latitude=lat, longitude=lon, accuracy_m=accuracy_m, altitude_m=altitude_m,
            source=source, precision=self._accuracy_to_precision(accuracy_m),
            confidence=self._confidence(accuracy_m), is_precise=True,
            city=reverse.get("city"), state=reverse.get("state"), country=reverse.get("country"),
            country_code=reverse.get("country_code"), formatted_address=reverse.get("formatted_address"),
            neighborhood=reverse.get("neighborhood"), postal_code=reverse.get("postal_code"),
            reverse_geocode_provider=reverse.get("provider"),
            detection_method=method, detection_details={"accuracy_m": accuracy_m},
        )

    async def _resolve_ip(self, ip: str) -> AutoDetectResponse:
        if is_private_ip(ip):
            raise GeocodingException(f"Cannot geolocate private/local IP address: {ip}.")

        ip_result = await _fetch_ip_location(ip)
        if not ip_result:
            raise GeocodingException(f"IP geolocation failed for {ip}. Provide GPS coordinates instead.")

        geocoded = None
        if ip_result.get("city"):
            geocoded = await self._city_geocoder.geocode_city(ip_result["city"], ip_result.get("region"), ip_result.get("country_code"))

        lat = geocoded["latitude"] if geocoded else ip_result["latitude"]
        lon = geocoded["longitude"] if geocoded else ip_result["longitude"]
        city = (geocoded or {}).get("city") or ip_result.get("city")
        state = (geocoded or {}).get("state") or ip_result.get("region")
        country = (geocoded or {}).get("country") or ip_result.get("country")
        country_code = (geocoded or {}).get("country_code") or ip_result.get("country_code")

        reverse = await self._reverse_geocode_enriched(lat, lon)

        return AutoDetectResponse(
            latitude=lat, longitude=lon, accuracy_m=5000.0 if geocoded else 50000.0,
            source=LocationSource.IP, precision=PrecisionLevel.LOW if geocoded else PrecisionLevel.APPROXIMATE,
            confidence=0.55 if geocoded else 0.3, is_precise=False,
            city=city, state=state, country=country, country_code=country_code,
            formatted_address=_format_address(city, state, country), timezone=ip_result.get("timezone"),
            reverse_geocode_provider=reverse.get("provider"), ip_address=ip, isp=ip_result.get("isp"),
            detection_method="ip_geolocation",
            detection_details={
                "ip_address": ip, "ip_provider": ip_result.get("provider"),
                "warning": "IP-based location is approximate and may not match your actual city.",
                "how_to_fix": "Send gps_latitude/gps_longitude, browser_latitude/browser_longitude, or fallback_city.",
            },
        )

    async def _resolve_fallback_city(self, city_name: str, country_code: str | None) -> AutoDetectResponse:
        geocoded = await self._city_geocoder.geocode_city(city_name, country_code=country_code)
        if not geocoded:
            raise BadRequestException(f"Could not find coordinates for city '{city_name}'.")

        lat, lon = geocoded["latitude"], geocoded["longitude"]
        reverse = await self._reverse_geocode_enriched(lat, lon)
        city = geocoded.get("city") or city_name
        state = geocoded.get("state") or reverse.get("state")
        country = geocoded.get("country") or reverse.get("country")

        return AutoDetectResponse(
            latitude=lat, longitude=lon, accuracy_m=2000.0, source=LocationSource.MANUAL,
            precision=PrecisionLevel.LOW, confidence=0.85, is_precise=False,
            city=city, state=state, country=country, country_code=geocoded.get("country_code") or reverse.get("country_code"),
            formatted_address=_format_address(city, state, country),
            timezone=reverse.get("timezone"), reverse_geocode_provider=reverse.get("provider"),
            detection_method="manual_city", detection_details={"user_provided_city": city_name},
        )

    async def _reverse_geocode_enriched(self, lat: float, lon: float) -> dict[str, Any]:
        cache_key = CacheKeyBuilder.reverse_geocode(lat, lon)
        cached = await self._cache.get(cache_key)
        if cached and cached.get("city"):
            return cached

        result = await self._reverse_owm(lat, lon) or await self._reverse_nominatim(lat, lon) or {"formatted_address": f"{lat},{lon}", "provider": "none"}
        if result.get("city"):
            await self._cache.set(cache_key, result, self._settings.CACHE_TTL_LOCATION)
        return result

    async def _reverse_nominatim(self, lat: float, lon: float) -> dict[str, Any] | None:
        params = {"lat": lat, "lon": lon, "format": "json", "addressdetails": 1, "zoom": 14}
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get("https://nominatim.openstreetmap.org/reverse", params=params, headers={"User-Agent": "Weatherly/1.0"})
                if resp.status_code == 200:
                    body = resp.json()
                    address = body.get("address", {})
                    city = address.get("city") or address.get("town") or address.get("village") or address.get("suburb")
                    return {
                        "city": city, "state": address.get("state") or address.get("province"),
                        "country": address.get("country"), "country_code": (address.get("country_code") or "").upper(),
                        "formatted_address": body.get("display_name"),
                        "neighborhood": address.get("suburb") or address.get("neighbourhood"),
                        "postal_code": address.get("postcode"), "provider": "nominatim",
                    }
        except Exception as exc:
            logger.debug("Nominatim reverse geocode failed: %s", exc)
        return None

    async def _reverse_owm(self, lat: float, lon: float) -> dict[str, Any] | None:
        from app.providers.provider_aggregator import ProviderAggregator

        try:
            result = await ProviderAggregator().reverse_geocode(lat, lon)
            if result and result.get("name"):
                return {
                    "city": result.get("name"), "state": result.get("state"),
                    "country": result.get("country"), "country_code": result.get("country_code"),
                    "formatted_address": result.get("name"), "provider": "openweathermap",
                }
        except Exception as exc:
            logger.debug("OWM reverse geocode failed: %s", exc)
        return None

    @staticmethod
    def _accuracy_to_precision(accuracy_m: float | None) -> PrecisionLevel:
        if accuracy_m is None:
            return PrecisionLevel.MEDIUM
        if accuracy_m <= 10:
            return PrecisionLevel.EXACT
        if accuracy_m <= 100:
            return PrecisionLevel.HIGH
        if accuracy_m <= 1000:
            return PrecisionLevel.MEDIUM
        if accuracy_m <= 10000:
            return PrecisionLevel.LOW
        return PrecisionLevel.APPROXIMATE

    @staticmethod
    def _confidence(accuracy_m: float | None) -> float:
        if accuracy_m is None:
            return 0.85
        if accuracy_m <= 20:
            return 0.97
        if accuracy_m <= 100:
            return 0.9
        if accuracy_m <= 1000:
            return 0.75
        return 0.6


class LocationService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._cache = cache_service
        self._settings = get_settings()
        self._resolver = LocationResolver(db)

    async def auto_detect_location(self, request_data: AutoDetectRequest, client_ip: str, require_precise: bool = False) -> AutoDetectResponse:
        return await self._resolver.auto_detect(request_data, client_ip, require_precise)

    async def detect_location_from_ip(self, ip_address: str) -> IPLocationResponse:
        result = await self._resolver._resolve_ip(ip_address)
        return IPLocationResponse(
            latitude=result.latitude, longitude=result.longitude, city=result.city,
            region=result.state, country=result.country, country_code=result.country_code,
            timezone=result.timezone, source=LocationSource.IP, precision=result.precision,
            accuracy_km=(result.accuracy_m or 50000) / 1000, confidence=result.confidence,
        )

    async def search_locations(self, query: str, limit: int = 5, country_code: str | None = None) -> list[GeocodingResult]:
        query = validate_query_string(query)
        cache_key = CacheKeyBuilder.location_search(query, country_code)
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return [GeocodingResult(**r) for r in cached]

        stmt = select(Location).where(
            or_(Location.name.ilike(f"%{query}%"), Location.city.ilike(f"%{query}%"), Location.state.ilike(f"%{query}%")),
        )
        if country_code:
            stmt = stmt.where(Location.country_code == country_code.upper())
        stmt = stmt.order_by(Location.search_count.desc()).limit(limit)
        result = await self._db.execute(stmt)
        locations = result.scalars().all()

        results: list[GeocodingResult] = []
        for loc in locations:
            try:
                precision = PrecisionLevel(loc.precision_level) if loc.precision_level else PrecisionLevel.MEDIUM
            except ValueError:
                precision = PrecisionLevel.MEDIUM
            results.append(GeocodingResult(
                name=loc.name, latitude=loc.latitude, longitude=loc.longitude,
                country=loc.country, country_code=loc.country_code, state=loc.state, city=loc.city,
                formatted_address=_format_address(loc.city, loc.state, loc.country) if (loc.city or loc.state or loc.country) else loc.name,
                source=LocationSource.MANUAL, precision=precision, confidence=0.9,
            ))
            loc.search_count += 1

        if len(results) < limit:
            provider_results = await self._geocode_via_provider(query, limit - len(results), country_code)
            for pr in provider_results:
                if not any(abs(r.latitude - pr.latitude) < 0.01 and abs(r.longitude - pr.longitude) < 0.01 for r in results):
                    results.append(pr)
                    await self._upsert_location_from_geocode(pr)

        await self._cache.set(cache_key, [r.model_dump(mode="json") for r in results], self._settings.CACHE_TTL_LOCATION)
        await self._db.flush()
        return results[:limit]

    async def reverse_geocode(self, lat: float, lon: float) -> GeocodingResult:
        lat, lon = validate_coordinate_pair(lat, lon)
        enriched = await self._resolver._reverse_geocode_enriched(lat, lon)
        return GeocodingResult(
            name=enriched.get("city") or enriched.get("formatted_address") or f"{lat},{lon}",
            latitude=lat, longitude=lon, country=enriched.get("country"), country_code=enriched.get("country_code"),
            state=enriched.get("state"), city=enriched.get("city"), formatted_address=enriched.get("formatted_address"),
            source=LocationSource.MANUAL, precision=PrecisionLevel.HIGH, confidence=0.8 if enriched.get("city") else 0.3,
        )

    async def get_location_by_id(self, location_id: UUID) -> LocationResponse:
        result = await self._db.execute(select(Location).where(Location.id == location_id))
        loc = result.scalar_one_or_none()
        if loc is None:
            raise NotFoundException("Location", str(location_id))
        return LocationResponse.model_validate(loc)

    async def find_nearby(self, lat: float, lon: float, radius_km: float = 50.0, limit: int = 10) -> list[LocationSummary]:
        lat, lon = validate_coordinate_pair(lat, lon)
        bbox = bounding_box(lat, lon, radius_km)
        stmt = select(Location).where(
            Location.latitude.between(bbox.min_lat, bbox.max_lat),
            Location.longitude.between(bbox.min_lon, bbox.max_lon),
        ).limit(limit * 3)
        result = await self._db.execute(stmt)
        nearby = sorted(
            ((haversine_distance(lat, lon, loc.latitude, loc.longitude), loc) for loc in result.scalars().all()),
            key=lambda x: x[0],
        )
        return [LocationSummary.model_validate(loc) for dist, loc in nearby if dist <= radius_km][:limit]

    async def _geocode_via_provider(self, query: str, limit: int, country_code: str | None) -> list[GeocodingResult]:
        from app.providers.provider_aggregator import ProviderAggregator

        try:
            results = await ProviderAggregator().geocode(query, limit, country_code)
            return [
                GeocodingResult(
                    name=r.get("name", query), latitude=r["latitude"], longitude=r["longitude"],
                    country=r.get("country"), country_code=r.get("country_code"), state=r.get("state"),
                    city=r.get("city"), formatted_address=r.get("formatted_address"),
                    source=LocationSource.MANUAL, precision=PrecisionLevel.HIGH, confidence=r.get("confidence", 0.8),
                )
                for r in results
            ]
        except Exception as exc:
            logger.warning("Provider geocoding failed for '%s': %s", query, exc)
            return []

    async def _upsert_location_from_geocode(self, geo: GeocodingResult) -> None:
        try:
            existing = await self._db.execute(select(Location).where(
                sa_func.abs(Location.latitude - round(geo.latitude, 6)) < 0.00005,
                sa_func.abs(Location.longitude - round(geo.longitude, 6)) < 0.00005,
            ))
            if existing.scalar_one_or_none() is None:
                loc = Location(
                    name=geo.name, latitude=round(geo.latitude, 6), longitude=round(geo.longitude, 6),
                    country=geo.country, country_code=geo.country_code.upper() if geo.country_code else None,
                    state=geo.state, city=geo.city, source="geocoding",
                    precision_level=geo.precision.value if geo.precision else "medium",
                )
                async with self._db.begin_nested():
                    self._db.add(loc)
        except Exception as exc:
            logger.debug("Upsert location from geocode failed: %s", exc)