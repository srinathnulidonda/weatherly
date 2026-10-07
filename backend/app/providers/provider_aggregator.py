# backend/app/providers/provider_aggregator.py
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from app.config import get_settings
from app.core.exceptions import ProviderException, ServiceUnavailableException
from app.providers.copernicus import CopernicusProvider
from app.providers.noaa import NOAAProvider
from app.providers.open_meteo import OpenMeteoProvider
from app.providers.openweathermap import OpenWeatherMapProvider
from app.providers.tomorrow_io import TomorrowIOProvider
from app.providers.weatherapi import WeatherAPIProvider
from app.services.cache_service import cache_service

logger = logging.getLogger("weatherly.provider_aggregator")


class ProviderAggregator:
    def __init__(self) -> None:
        settings = get_settings()
        active_provider_names = set(settings.active_providers)

        self._open_meteo = OpenMeteoProvider() if "open_meteo" in active_provider_names else None
        self._owm = OpenWeatherMapProvider() if "openweathermap" in active_provider_names else None
        self._wapi = WeatherAPIProvider() if "weatherapi" in active_provider_names else None
        self._tomorrow = TomorrowIOProvider() if "tomorrow_io" in active_provider_names else None
        self._noaa = NOAAProvider() if "noaa" in active_provider_names else None
        self._copernicus = CopernicusProvider() if "copernicus" in active_provider_names else None

        self._primary_providers: list = [p for p in [
            self._open_meteo,
            self._owm,
            self._wapi,
            self._tomorrow,
            self._noaa,
            self._copernicus,
        ] if p is not None]

        configured_names = [p.PROVIDER_NAME for p in self._primary_providers]
        logger.info("Weather providers active: %s", ", ".join(configured_names))

    async def fetch(self, data_type: str, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        method_map = {
            "current": self._fetch_current,
            "forecast": self._fetch_forecast,
            "history": self._fetch_history,
            "air_quality": self._fetch_air_quality,
            "map": self._fetch_map,
            "alerts": self._fetch_alerts_data,
            "trends": self._fetch_trends,
            "marine": self._fetch_marine,
            "astronomy": self._fetch_astronomy,
        }
        handler = method_map.get(data_type)
        if handler is None:
            raise ServiceUnavailableException("provider_aggregator", f"Unknown data type: {data_type}")
        return await handler(lat, lon, **kwargs)

    @staticmethod
    def _health_ttl_for(exc: ProviderException) -> int:
        if exc.status_code == 429:
            msg = exc.message.lower()
            if any(k in msg for k in ("daily", "per day", "quota", "tomorrow")):
                now = datetime.now(timezone.utc)
                reset_at = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                seconds_left = int((reset_at - now).total_seconds())
                return max(min(seconds_left, 12 * 3600), 30 * 60)
            return 300
        return 120

    async def _try_providers(
        self, method_name: str, providers: list, lat: float, lon: float,
        partial_key: str | None = None, min_partial: int | None = None, **kwargs: Any,
    ) -> dict[str, Any]:
        if not providers:
            raise ServiceUnavailableException("weather_providers", "No providers available")

        errors: list[str] = []
        best_partial: dict[str, Any] | None = None

        for provider in providers:
            provider_name = provider.PROVIDER_NAME
            if not await cache_service.get_provider_health(provider_name):
                logger.debug("Skipping unhealthy provider: %s", provider_name)
                continue

            method = getattr(provider, method_name, None)
            if method is None:
                continue

            try:
                result = await method(lat, lon, **kwargs)
            except ProviderException as exc:
                errors.append(f"{provider_name}: {exc.message}")
                ttl = self._health_ttl_for(exc)
                logger.warning(
                    "Provider %s failed for %s: %s (cooling down %ss)",
                    provider_name, method_name, exc.message, ttl,
                )
                await cache_service.set_provider_health(provider_name, False, ttl=ttl)
                continue
            except Exception as exc:
                errors.append(f"{provider_name}: {exc}")
                logger.error("Provider %s unexpected error for %s: %s", provider_name, method_name, exc, exc_info=True)
                await cache_service.set_provider_health(provider_name, False, ttl=60)
                continue

            if not result:
                continue

            if partial_key and min_partial:
                returned = len(result.get(partial_key, []))
                if returned < min_partial:
                    errors.append(f"{provider_name}: only {returned}/{min_partial}")
                    if best_partial is None or returned > len(best_partial.get(partial_key, [])):
                        best_partial = result
                    continue

            return result

        if best_partial is not None:
            logger.info(
                "Returning partial result (%d/%s %s) — no provider had full data",
                len(best_partial.get(partial_key, [])), min_partial, partial_key,
            )
            return best_partial

        raise ServiceUnavailableException(
            "weather_providers", f"All providers failed for {method_name}: {'; '.join(errors)}",
        )

    async def _fetch_current(self, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        return await self._try_providers("get_current", self._primary_providers, lat, lon, **kwargs)

    async def _fetch_forecast(self, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        days = kwargs.get("days", 7)
        hourly = kwargs.get("hourly", False)
        providers = self._get_forecast_providers(days, hourly)
        return await self._try_providers(
            "get_forecast", providers, lat, lon, partial_key="days", min_partial=min(days, 5), **kwargs,
        )

    def _get_forecast_providers(self, days: int, hourly: bool) -> list:
        providers = [self._open_meteo]

        if hourly or days > 5:
            if self._wapi is not None and self._wapi.is_configured:
                providers.append(self._wapi)
            if self._tomorrow is not None and self._tomorrow.is_configured:
                providers.append(self._tomorrow)
            if self._owm is not None and self._owm.is_configured:
                providers.append(self._owm)
        else:
            if self._owm is not None and self._owm.is_configured:
                providers.append(self._owm)
            if self._wapi is not None and self._wapi.is_configured:
                providers.append(self._wapi)
            if self._tomorrow is not None and self._tomorrow.is_configured:
                providers.append(self._tomorrow)

        return providers

    async def _fetch_history(self, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        providers = [self._open_meteo]
        if self._wapi is not None and self._wapi.is_configured:
            providers.append(self._wapi)
        if self._tomorrow is not None and self._tomorrow.is_configured:
            providers.append(self._tomorrow)
        if self._owm is not None and self._owm.is_configured:
            providers.append(self._owm)
        return await self._try_providers("get_history", providers, lat, lon, **kwargs)

    async def _fetch_marine(self, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        days = kwargs.get("days", 3)
        providers = []
        if self._open_meteo is not None and self._open_meteo.is_configured:
            providers.append(self._open_meteo)
        if self._wapi is not None and self._wapi.is_configured:
            providers.append(self._wapi)

        if not providers:
            raise ServiceUnavailableException("marine", "No marine data providers configured")

        return await self._try_providers(
            "get_marine", providers, lat, lon, partial_key="data", min_partial=days, days=days,
        )

    async def _fetch_air_quality(self, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        tasks: dict[str, Any] = {
            "open_meteo": self._safe_call(self._open_meteo.get_air_quality, lat, lon),
        }
        if self._owm is not None and self._owm.is_configured:
            tasks["owm"] = self._safe_call(self._owm.get_air_quality, lat, lon)
        if self._copernicus is not None and self._copernicus.is_configured:
            tasks["copernicus"] = self._safe_call(self._copernicus.get_air_quality, lat, lon)

        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        named = dict(zip(tasks.keys(), results))

        for name in ["open_meteo", "owm", "copernicus"]:
            result = named.get(name)
            if isinstance(result, dict) and result.get("aqi"):
                return result

        om_result = named.get("open_meteo")
        if isinstance(om_result, dict):
            return om_result

        raise ServiceUnavailableException("air_quality", "All air quality providers failed")

    async def _fetch_map(self, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        if not self._owm or not self._owm.is_configured:
            raise ServiceUnavailableException("weather_maps", "OPENWEATHERMAP_API_KEY required for map tiles")
        layer = kwargs.get("layer", "temp")
        zoom = kwargs.get("zoom", 5)
        return await self._owm.get_weather_map_tile(layer, zoom, lat, lon)

    async def _fetch_alerts_data(self, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        return {"provider": "aggregated", "alerts": await self.fetch_alerts(lat, lon)}

    async def _fetch_trends(self, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        hours = kwargs.get("hours", 24)
        try:
            forecast = await self._fetch_forecast(lat, lon, days=min((hours // 24) + 1, 3), hourly=True)
            points = []
            for day in forecast.get("days", []):
                for h in day.get("hourly") or []:
                    wind_data = h.get("wind") or {}
                    points.append({
                        "datetime_utc": h.get("datetime_utc"),
                        "temperature_c": h.get("temperature_c"),
                        "humidity": h.get("humidity"),
                        "pressure_hpa": h.get("pressure_hpa"),
                        "wind_speed_ms": wind_data.get("speed_ms") if isinstance(wind_data, dict) else None,
                    })
                    if len(points) >= hours:
                        break
                if len(points) >= hours:
                    break
            return {"provider": forecast.get("provider", "aggregated"), "points": points[:hours]}
        except Exception as exc:
            logger.warning("Trends fetch failed: %s", exc)
            return {"provider": "aggregated", "points": []}

    async def _fetch_astronomy(self, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        if self._wapi is not None and self._wapi.is_configured:
            date_str = kwargs.get("date_str", "")
            return await self._wapi.get_astronomy(lat, lon, date_str)
        return {"provider": "aggregated"}

    async def fetch_alerts(self, lat: float, lon: float, radius_km: float = 100.0) -> list[dict[str, Any]]:
        tasks: dict[str, Any] = {}
        if self._owm and self._owm.is_configured:
            tasks["owm"] = self._safe_call(self._owm.get_alerts, lat, lon)
        if self._wapi and self._wapi.is_configured:
            tasks["wapi"] = self._safe_call(self._wapi.get_alerts, lat, lon)
        if self._noaa and self._noaa.is_configured and 17 < lat < 72 and -180 < lon < -60:
            tasks["noaa"] = self._safe_call(self._noaa.get_alerts, lat, lon, radius_km)

        if not tasks:
            return []

        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        named = dict(zip(tasks.keys(), results))

        all_alerts: list[dict[str, Any]] = []
        seen_ids: set[str] = set()

        for name, result in named.items():
            if isinstance(result, list):
                for alert in result:
                    src_id = alert.get("source_alert_id", "")
                    if src_id and src_id in seen_ids:
                        continue
                    if src_id:
                        seen_ids.add(src_id)
                    all_alerts.append(alert)
            elif isinstance(result, Exception):
                logger.warning("Alert fetch from %s failed: %s", name, result)

        return all_alerts

    async def geocode(self, query: str, limit: int = 5, country_code: str | None = None) -> list[dict[str, Any]]:
        if self._owm and self._owm.is_configured:
            results = await self._owm.geocode(query, limit, country_code)
            if results:
                return results

        if self._wapi and self._wapi.is_configured:
            results = await self._wapi.geocode(query, limit, country_code)
            if results:
                return results

        if self._open_meteo:
            return await self._open_meteo.geocode(query, limit, country_code)

        return []

    async def reverse_geocode(self, lat: float, lon: float) -> dict[str, Any]:
        if self._owm and self._owm.is_configured:
            try:
                return await self._owm.reverse_geocode(lat, lon)
            except ProviderException:
                pass
        return {"name": f"{lat},{lon}", "confidence": 0.1}

    async def health_check_all(self) -> dict[str, bool]:
        tasks = {
            "open_meteo": self._safe_call(self._open_meteo.health_check) if self._open_meteo else None,
            "openweathermap": self._safe_call(self._owm.health_check) if self._owm else None,
            "weatherapi": self._safe_call(self._wapi.health_check) if self._wapi else None,
            "tomorrow_io": self._safe_call(self._tomorrow.health_check) if self._tomorrow else None,
            "noaa": self._safe_call(self._noaa.health_check) if self._noaa else None,
            "copernicus": self._safe_call(self._copernicus.health_check) if self._copernicus else None,
        }
        tasks = {k: v for k, v in tasks.items() if v is not None}
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        named = dict(zip(tasks.keys(), results))

        health: dict[str, bool] = {}
        for name, result in named.items():
            healthy = isinstance(result, bool) and result
            health[name] = healthy
            await cache_service.set_provider_health(name, healthy)
        return health

    @staticmethod
    async def _safe_call(coro_func, *args, **kwargs) -> Any:
        try:
            return await coro_func(*args, **kwargs)
        except Exception as exc:
            return exc