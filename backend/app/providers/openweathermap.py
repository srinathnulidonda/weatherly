# backend/app/providers/openweathermap.py
from __future__ import annotations

import hashlib
import logging
import math
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import get_settings
from app.core.exceptions import ProviderException, ProviderTimeoutException
from app.utils import get_http_client

logger = logging.getLogger("weatherly.providers.openweathermap")


class OpenWeatherMapProvider:
    PROVIDER_NAME = "openweathermap"

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.OPENWEATHERMAP_API_KEY
        self._base_url = settings.OPENWEATHERMAP_BASE_URL
        self._onecall_available: bool | None = None

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key)

    def _check_configured(self) -> None:
        if not self.is_configured:
            raise ProviderException(self.PROVIDER_NAME, "API key not configured")

    async def get_current(self, lat: float, lon: float, units: str = "metric") -> dict[str, Any]:
        self._check_configured()
        params = {"lat": lat, "lon": lon, "appid": self._api_key, "units": "metric"}
        data = await self._request("/data/2.5/weather", params)
        return self._normalize_current(data, lat, lon)

    async def get_forecast(
        self, lat: float, lon: float, days: int = 7, units: str = "metric", hourly: bool = False
    ) -> dict[str, Any]:
        self._check_configured()

        if self._onecall_available is not False and not hourly:
            try:
                result = await self._try_onecall_forecast(lat, lon, days)
                if result:
                    self._onecall_available = True
                    return result
            except ProviderException as exc:
                if "401" in str(exc) or "Invalid API key" in str(exc) or "unauthorized" in str(exc).lower():
                    self._onecall_available = False
                logger.info(
                    "OpenWeatherMap OneCall 3.0 unavailable (%s), falling back to 5-day/3-hour forecast", exc.message
                )

        params = {
            "lat": lat, "lon": lon, "appid": self._api_key,
            "units": "metric", "cnt": 40,
        }
        data = await self._request("/data/2.5/forecast", params)
        return self._normalize_5day_forecast(data, lat, lon, days)

    async def _try_onecall_forecast(self, lat: float, lon: float, days: int) -> dict[str, Any] | None:
        params = {
            "lat": lat, "lon": lon, "appid": self._api_key,
            "units": "metric", "exclude": "minutely",
        }
        data = await self._request("/data/3.0/onecall", params)
        return self._normalize_onecall_forecast(data, lat, lon, days)

    async def get_air_quality(self, lat: float, lon: float) -> dict[str, Any]:
        self._check_configured()
        params = {"lat": lat, "lon": lon, "appid": self._api_key}
        data = await self._request("/data/2.5/air_pollution", params)
        return self._normalize_air_quality(data, lat, lon)

    async def get_history(
        self, lat: float, lon: float, start_date: str, end_date: str, units: str = "metric"
    ) -> dict[str, Any]:
        self._check_configured()

        if self._onecall_available is False:
            return {
                "provider": self.PROVIDER_NAME, "data": [],
                "start_date": start_date, "end_date": end_date,
            }

        start_dt = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
        end_dt = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
        params = {
            "lat": lat, "lon": lon, "appid": self._api_key,
            "type": "hour", "start": int(start_dt.timestamp()),
            "end": int(end_dt.timestamp()), "units": "metric",
        }
        try:
            data = await self._request("/data/3.0/onecall/timemachine", params)
            return self._normalize_history(data, lat, lon, start_date, end_date)
        except ProviderException as exc:
            if "401" in str(exc) or "Invalid API key" in str(exc):
                self._onecall_available = False
            return {
                "provider": self.PROVIDER_NAME, "data": [],
                "start_date": start_date, "end_date": end_date,
            }

    async def geocode(self, query: str, limit: int = 5, country_code: str | None = None) -> list[dict[str, Any]]:
        self._check_configured()
        q = f"{query},{country_code}" if country_code else query
        params = {"q": q, "limit": limit, "appid": self._api_key}
        data = await self._request("/geo/1.0/direct", params)
        return [
            {
                "name": item.get("name", ""), "latitude": item.get("lat"),
                "longitude": item.get("lon"), "country": item.get("country"),
                "country_code": item.get("country"), "state": item.get("state"),
                "city": item.get("name"), "confidence": 0.85,
            }
            for item in (data if isinstance(data, list) else [])
        ]

    async def reverse_geocode(self, lat: float, lon: float) -> dict[str, Any]:
        self._check_configured()
        params = {"lat": lat, "lon": lon, "limit": 1, "appid": self._api_key}
        data = await self._request("/geo/1.0/reverse", params)
        if isinstance(data, list) and data:
            item = data[0]
            return {
                "name": item.get("name", f"{lat},{lon}"),
                "country": item.get("country"), "country_code": item.get("country"),
                "state": item.get("state"), "city": item.get("name"), "confidence": 0.9,
            }
        return {"name": f"{lat},{lon}", "confidence": 0.1}

    async def get_weather_map_tile(self, layer: str, zoom: int, lat: float, lon: float) -> dict[str, Any]:
        self._check_configured()
        layer_map = {
            "temp": "temp_new", "precipitation": "precipitation_new",
            "clouds": "clouds_new", "wind": "wind_new", "pressure": "pressure_new",
        }
        owm_layer = layer_map.get(layer, "temp_new")
        x = int((lon + 180.0) / 360.0 * (2 ** zoom))
        lat_rad = math.radians(lat)
        y = int(
            (1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi)
            / 2.0 * (2 ** zoom)
        )
        tile_url = f"{self._base_url}/map/2.0/weather/{owm_layer}/{zoom}/{x}/{y}?appid={self._api_key}"
        return {"tile_url": tile_url, "layer": layer, "attribution": "© OpenWeatherMap"}

    async def get_alerts(self, lat: float, lon: float) -> list[dict[str, Any]]:
        self._check_configured()
        if self._onecall_available is False:
            return []

        params = {
            "lat": lat, "lon": lon, "appid": self._api_key,
            "exclude": "minutely,hourly,daily,current",
        }
        try:
            data = await self._request("/data/3.0/onecall", params)
        except ProviderException as exc:
            if "401" in str(exc) or "Invalid API key" in str(exc):
                self._onecall_available = False
            return []

        alerts_raw = data.get("alerts", [])
        result = []
        for a in alerts_raw:
            event_start = a.get('event', '') + str(a.get('start', ''))
            source_id = f"owm_{hashlib.sha256(event_start.encode()).hexdigest()[:16]}"
            result.append({
                "provider": self.PROVIDER_NAME,
                "source_alert_id": source_id,
                "event_type": a.get("event", "Unknown"),
                "severity": self._infer_severity(a.get("event", "")),
                "headline": a.get("event", "Weather Alert"),
                "description": a.get("description"),
                "sender": a.get("sender_name"),
                "effective_at": datetime.fromtimestamp(a.get("start", 0), tz=timezone.utc).isoformat(),
                "expires_at": datetime.fromtimestamp(a.get("end", 0), tz=timezone.utc).isoformat(),
                "latitude": lat, "longitude": lon, "raw_data": a,
            })
        return result

    async def health_check(self) -> bool:
        if not self.is_configured:
            return False
        try:
            params = {"lat": 0, "lon": 0, "appid": self._api_key, "units": "metric"}
            await self._request("/data/2.5/weather", params)
            return True
        except Exception:
            return False

    async def _request(self, endpoint: str, params: dict[str, Any]) -> Any:
        url = f"{self._base_url}{endpoint}"
        try:
            client = await get_http_client()
            response = await client.get(url, params=params)
            if response.status_code == 401:
                raise ProviderException(self.PROVIDER_NAME, "Invalid API key")
            if response.status_code == 429:
                raise ProviderException(self.PROVIDER_NAME, "Rate limit exceeded")
            if response.status_code >= 400:
                raise ProviderException(
                    self.PROVIDER_NAME, f"HTTP {response.status_code}: {response.text[:200]}"
                )
            return response.json()
        except httpx.TimeoutException:
            raise ProviderTimeoutException(self.PROVIDER_NAME)
        except httpx.RequestError as exc:
            raise ProviderException(self.PROVIDER_NAME, "Connection error", exc)
        except ProviderException:
            raise
        except Exception as exc:
            raise ProviderException(self.PROVIDER_NAME, str(exc), exc)

    def _normalize_current(self, data: dict[str, Any], lat: float, lon: float) -> dict[str, Any]:
        main = data.get("main", {})
        wind = data.get("wind", {})
        clouds = data.get("clouds", {})
        weather = data.get("weather", [{}])[0] if data.get("weather") else {}
        rain = data.get("rain", {})
        snow = data.get("snow", {})
        sys = data.get("sys", {})
        sunrise_ts = sys.get("sunrise")
        sunset_ts = sys.get("sunset")

        return {
            "provider": self.PROVIDER_NAME,
            "observed_at": datetime.fromtimestamp(data.get("dt", 0), tz=timezone.utc).isoformat(),
            "temperature_c": main.get("temp"),
            "feels_like_c": main.get("feels_like"),
            "temp_min_c": main.get("temp_min"),
            "temp_max_c": main.get("temp_max"),
            "humidity": main.get("humidity"),
            "pressure_hpa": main.get("pressure"),
            "sea_level_pressure_hpa": main.get("sea_level"),
            "ground_level_pressure_hpa": main.get("grnd_level"),
            "wind_speed_ms": wind.get("speed"),
            "wind_deg": wind.get("deg"),
            "wind_gust_ms": wind.get("gust"),
            "clouds_pct": clouds.get("all"),
            "visibility_m": data.get("visibility"),
            "rain_1h_mm": rain.get("1h"),
            "rain_3h_mm": rain.get("3h"),
            "snow_1h_mm": snow.get("1h"),
            "snow_3h_mm": snow.get("3h"),
            "condition_code": weather.get("id"),
            "condition_main": weather.get("main"),
            "condition_description": weather.get("description"),
            "condition_icon": weather.get("icon"),
            "sunrise": datetime.fromtimestamp(sunrise_ts, tz=timezone.utc).isoformat() if sunrise_ts else None,
            "sunset": datetime.fromtimestamp(sunset_ts, tz=timezone.utc).isoformat() if sunset_ts else None,
            "raw_data": data,
            "data_quality": {"source": self.PROVIDER_NAME, "completeness": 0.95},
        }

    def _normalize_5day_forecast(self, data: dict[str, Any], lat: float, lon: float, days: int) -> dict[str, Any]:
        daily_map: dict[str, list[dict]] = defaultdict(list)
        for item in data.get("list", []):
            dt = datetime.fromtimestamp(item.get("dt", 0), tz=timezone.utc)
            date_key = dt.date().isoformat()
            daily_map[date_key].append(item)

        forecast_days = []
        for date_str in sorted(daily_map.keys())[:days]:
            items = daily_map[date_str]
            temps = [i["main"]["temp"] for i in items if "main" in i and "temp" in i["main"]]
            humids = [i["main"]["humidity"] for i in items if "main" in i and "humidity" in i["main"]]

            hourly_items = []
            for item in items:
                m = item.get("main", {})
                w = item.get("wind", {})
                weather = item.get("weather", [{}])[0] if item.get("weather") else {}
                hourly_items.append({
                    "datetime_utc": datetime.fromtimestamp(item.get("dt", 0), tz=timezone.utc).isoformat(),
                    "temperature_c": m.get("temp"),
                    "feels_like_c": m.get("feels_like"),
                    "humidity": m.get("humidity"),
                    "pressure_hpa": m.get("pressure"),
                    "wind": {
                        "speed_ms": w.get("speed"),
                        "direction_deg": w.get("deg"),
                        "gust_ms": w.get("gust"),
                    },
                    "precipitation": {
                        "rain_1h_mm": item.get("rain", {}).get("3h"),
                        "probability": round(item["pop"] * 100, 1) if item.get("pop") is not None else None,
                    },
                    "condition": {
                        "code": weather.get("id"), "main": weather.get("main"),
                        "description": weather.get("description"), "icon": weather.get("icon"),
                    },
                    "clouds_pct": item.get("clouds", {}).get("all"),
                    "visibility_m": item.get("visibility"),
                })

            mid = items[len(items) // 2] if items else {}
            mid_weather = mid.get("weather", [{}])[0] if mid.get("weather") else {}

            forecast_days.append({
                "date": date_str,
                "temp_min_c": min(temps) if temps else None,
                "temp_max_c": max(temps) if temps else None,
                "temp_avg_c": round(sum(temps) / len(temps), 2) if temps else None,
                "humidity_avg": round(sum(humids) / len(humids), 1) if humids else None,
                "condition": {
                    "code": mid_weather.get("id"), "main": mid_weather.get("main"),
                    "description": mid_weather.get("description"), "icon": mid_weather.get("icon"),
                },
                "hourly": hourly_items,
                "_interval_hours": 3,
            })

        return {
            "provider": self.PROVIDER_NAME, "days": forecast_days,
            "_free_tier": True, "_max_days": 5, "_interval_hours": 3,
        }

    def _normalize_onecall_forecast(self, data: dict[str, Any], lat: float, lon: float, days: int) -> dict[str, Any]:
        daily_raw = data.get("daily", [])[:days]
        hourly_raw = data.get("hourly", [])

        hourly_by_date: dict[str, list[dict]] = defaultdict(list)
        for h in hourly_raw:
            dt = datetime.fromtimestamp(h.get("dt", 0), tz=timezone.utc)
            date_key = dt.date().isoformat()
            h_weather = h.get("weather", [{}])[0] if h.get("weather") else {}
            hourly_by_date[date_key].append({
                "datetime_utc": dt.isoformat(),
                "temperature_c": h.get("temp"),
                "feels_like_c": h.get("feels_like"),
                "humidity": h.get("humidity"),
                "pressure_hpa": h.get("pressure"),
                "wind": {
                    "speed_ms": h.get("wind_speed"),
                    "direction_deg": h.get("wind_deg"),
                    "gust_ms": h.get("wind_gust"),
                },
                "precipitation": {
                    "rain_1h_mm": h.get("rain", {}).get("1h") if isinstance(h.get("rain"), dict) else h.get("rain"),
                    "probability": round(h["pop"] * 100, 1) if h.get("pop") is not None else None,
                },
                "condition": {
                    "code": h_weather.get("id"), "main": h_weather.get("main"),
                    "description": h_weather.get("description"), "icon": h_weather.get("icon"),
                },
                "clouds_pct": h.get("clouds"),
                "visibility_m": h.get("visibility"),
                "uv_index": h.get("uvi"),
            })

        forecast_days = []
        for d in daily_raw:
            temp = d.get("temp", {})
            feels = d.get("feels_like", {})
            weather = d.get("weather", [{}])[0] if d.get("weather") else {}
            date_str = datetime.fromtimestamp(d.get("dt", 0), tz=timezone.utc).date().isoformat()
            day_hourly = hourly_by_date.get(date_str, [])

            forecast_days.append({
                "date": date_str,
                "temp_min_c": temp.get("min"),
                "temp_max_c": temp.get("max"),
                "temp_avg_c": round((temp.get("min", 0) + temp.get("max", 0)) / 2, 2) if temp.get("min") is not None else None,
                "feels_like_day_c": feels.get("day"),
                "feels_like_night_c": feels.get("night"),
                "humidity_avg": d.get("humidity"),
                "pressure_hpa": d.get("pressure"),
                "wind": {
                    "speed_ms": d.get("wind_speed"),
                    "direction_deg": d.get("wind_deg"),
                    "gust_ms": d.get("wind_gust"),
                },
                "precipitation": {
                    "probability": round(d["pop"] * 100, 1) if d.get("pop") is not None else None,
                    "rain_1h_mm": d.get("rain"),
                },
                "condition": {
                    "code": weather.get("id"), "main": weather.get("main"),
                    "description": weather.get("description"), "icon": weather.get("icon"),
                },
                "clouds_pct": d.get("clouds"),
                "uv_index": d.get("uvi"),
                "astronomy": {
                    "sunrise": datetime.fromtimestamp(d["sunrise"], tz=timezone.utc).isoformat() if d.get("sunrise") else None,
                    "sunset": datetime.fromtimestamp(d["sunset"], tz=timezone.utc).isoformat() if d.get("sunset") else None,
                    "moonrise": datetime.fromtimestamp(d["moonrise"], tz=timezone.utc).isoformat() if d.get("moonrise") else None,
                    "moonset": datetime.fromtimestamp(d["moonset"], tz=timezone.utc).isoformat() if d.get("moonset") else None,
                    "moon_phase": d.get("moon_phase"),
                },
                "hourly": day_hourly if day_hourly else None,
            })
        return {"provider": self.PROVIDER_NAME, "days": forecast_days}

    def _normalize_air_quality(self, data: dict[str, Any], lat: float, lon: float) -> dict[str, Any]:
        from app.utils.units import aqi_category_us, calculate_us_aqi_from_pm25

        item = data.get("list", [{}])[0] if data.get("list") else {}
        main = item.get("main", {})
        components = item.get("components", {})

        pm25 = components.get("pm2_5")
        if pm25 is not None:
            us_aqi = calculate_us_aqi_from_pm25(pm25)
        else:
            owm_aqi = main.get("aqi", 1)
            _approx = {1: 25, 2: 75, 3: 125, 4: 175, 5: 300}
            us_aqi = _approx.get(owm_aqi, 50)

        return {
            "provider": self.PROVIDER_NAME,
            "observed_at": datetime.fromtimestamp(item.get("dt", 0), tz=timezone.utc).isoformat(),
            "aqi": us_aqi,
            "aqi_category": aqi_category_us(us_aqi),
            "dominant_pollutant": self._find_dominant_pollutant(components),
            "pm2_5": components.get("pm2_5"),
            "pm10": components.get("pm10"),
            "o3": components.get("o3"),
            "no2": components.get("no2"),
            "so2": components.get("so2"),
            "co": components.get("co"),
            "nh3": components.get("nh3"),
        }

    @staticmethod
    def _find_dominant_pollutant(components: dict) -> str | None:
        if not components:
            return None
        pollutants = {
            "pm2_5": components.get("pm2_5", 0),
            "pm10": components.get("pm10", 0),
            "o3": components.get("o3", 0),
            "no2": components.get("no2", 0),
        }
        return max(pollutants, key=pollutants.get) if any(pollutants.values()) else None

    def _normalize_history(self, data: dict[str, Any], lat: float, lon: float, start_date: str, end_date: str) -> dict[str, Any]:
        hourly = data.get("data", data.get("hourly", []))
        daily_map: dict[str, list] = defaultdict(list)
        for h in hourly:
            dt = datetime.fromtimestamp(h.get("dt", 0), tz=timezone.utc)
            daily_map[dt.date().isoformat()].append(h)

        days_data = []
        for date_str in sorted(daily_map.keys()):
            items = daily_map[date_str]
            temps = [
                i.get("temp", i.get("main", {}).get("temp"))
                for i in items
                if i.get("temp") is not None or i.get("main", {}).get("temp") is not None
            ]
            temps = [t for t in temps if t is not None]
            days_data.append({
                "date": date_str,
                "temp_min_c": min(temps) if temps else None,
                "temp_max_c": max(temps) if temps else None,
                "temp_avg_c": round(sum(temps) / len(temps), 2) if temps else None,
            })

        return {"provider": self.PROVIDER_NAME, "data": days_data}

    @staticmethod
    def _infer_severity(event: str) -> str:
        event_lower = event.lower()
        if any(w in event_lower for w in ["hurricane", "tornado", "tsunami", "extreme"]):
            return "extreme"
        if any(w in event_lower for w in ["severe", "blizzard", "ice storm", "flood"]):
            return "severe"
        if any(w in event_lower for w in ["warning", "storm", "heavy"]):
            return "moderate"
        return "minor"