# backend/app/providers/tomorrow_io.py
from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import get_settings
from app.core.exceptions import ProviderException, ProviderTimeoutException

logger = logging.getLogger("weatherly.providers.tomorrow_io")


class TomorrowIOProvider:
    PROVIDER_NAME = "tomorrow_io"

    _WEATHER_CODES = {
        0: "Unknown", 1000: "Clear", 1100: "Mostly Clear", 1101: "Partly Cloudy",
        1102: "Mostly Cloudy", 1001: "Cloudy", 2000: "Fog", 2100: "Light Fog",
        3000: "Light Wind", 3001: "Wind", 3002: "Strong Wind",
        4000: "Drizzle", 4001: "Rain", 4200: "Light Rain", 4201: "Heavy Rain",
        5000: "Snow", 5001: "Flurries", 5100: "Light Snow", 5101: "Heavy Snow",
        6000: "Freezing Drizzle", 6001: "Freezing Rain", 6200: "Light Freezing Rain",
        6201: "Heavy Freezing Rain", 7000: "Ice Pellets", 7101: "Heavy Ice Pellets",
        7102: "Light Ice Pellets", 8000: "Thunderstorm",
    }

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.TOMORROW_IO_API_KEY
        self._base_url = settings.TOMORROW_IO_BASE_URL
        self._timeout = httpx.Timeout(10.0, connect=5.0)

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key)

    def _check_configured(self) -> None:
        if not self.is_configured:
            raise ProviderException(self.PROVIDER_NAME, "API key not configured")

    async def get_current(self, lat: float, lon: float, units: str = "metric") -> dict[str, Any]:
        self._check_configured()
        params = {"location": f"{lat},{lon}", "apikey": self._api_key, "units": "metric"}
        data = await self._request("/v4/weather/realtime", params)
        return self._normalize_current(data, lat, lon)

    async def get_forecast(
        self, lat: float, lon: float, days: int = 7, units: str = "metric", hourly: bool = False
    ) -> dict[str, Any]:
        self._check_configured()
        if hourly:
            params = {
                "location": f"{lat},{lon}", "apikey": self._api_key,
                "units": "metric", "timesteps": "1h",
            }
            data = await self._request("/v4/weather/forecast", params)
            return self._normalize_hourly_forecast(data, days)

        params = {
            "location": f"{lat},{lon}", "apikey": self._api_key,
            "units": "metric", "timesteps": "1d",
        }
        data = await self._request("/v4/weather/forecast", params)
        return self._normalize_daily_forecast(data, days)

    async def get_history(
        self, lat: float, lon: float, start_date: str, end_date: str, units: str = "metric"
    ) -> dict[str, Any]:
        self._check_configured()
        params = {
            "location": f"{lat},{lon}", "apikey": self._api_key,
            "units": "metric", "timesteps": "1d",
            "startTime": f"{start_date}T00:00:00Z", "endTime": f"{end_date}T23:59:59Z",
        }
        data = await self._request("/v4/weather/history/recent", params)
        return self._normalize_history(data)

    async def health_check(self) -> bool:
        if not self.is_configured:
            return False
        params = {"location": "0,0", "apikey": self._api_key, "units": "metric"}
        await self._request("/v4/weather/realtime", params)
        return True

    async def _request(self, endpoint: str, params: dict[str, Any]) -> Any:
        url = f"{self._base_url}{endpoint}"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.get(url, params=params)
                if response.status_code in (401, 403):
                    raise ProviderException(self.PROVIDER_NAME, "Invalid API key")
                if response.status_code == 429:
                    raise ProviderException(self.PROVIDER_NAME, "Rate limit exceeded")
                if response.status_code >= 400:
                    raise ProviderException(self.PROVIDER_NAME, f"HTTP {response.status_code}: {response.text[:200]}")
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
        d = data.get("data", {}).get("values", {})
        code = d.get("weatherCode", 0)
        return {
            "provider": self.PROVIDER_NAME,
            "observed_at": data.get("data", {}).get("time", datetime.now(timezone.utc).isoformat()),
            "temperature_c": d.get("temperature"),
            "feels_like_c": d.get("temperatureApparent"),
            "humidity": d.get("humidity"),
            "pressure_hpa": d.get("pressureSurfaceLevel"),
            "wind_speed_ms": d.get("windSpeed"),
            "wind_deg": d.get("windDirection"),
            "wind_gust_ms": d.get("windGust"),
            "clouds_pct": d.get("cloudCover"),
            "visibility_m": d["visibility"] * 1000 if d.get("visibility") is not None else None,
            "uv_index": d.get("uvIndex"),
            "dew_point_c": d.get("dewPoint"),
            "precipitation_probability": d.get("precipitationProbability"),
            "rain_1h_mm": d.get("rainIntensity"),
            "snow_1h_mm": d.get("snowIntensity"),
            "condition_code": code,
            "condition_main": self._WEATHER_CODES.get(code, "Unknown"),
            "condition_description": self._WEATHER_CODES.get(code, "Unknown"),
            "raw_data": data,
            "data_quality": {"source": self.PROVIDER_NAME, "completeness": 0.92},
        }

    def _normalize_daily_forecast(self, data: dict[str, Any], days: int) -> dict[str, Any]:
        timelines = data.get("timelines", {}).get("daily", [])[:days]
        forecast_days = []
        for item in timelines:
            v = item.get("values", {})
            code = v.get("weatherCodeMax", v.get("weatherCode", 0))
            forecast_days.append({
                "date": item.get("time", "")[:10],
                "temp_min_c": v.get("temperatureMin"),
                "temp_max_c": v.get("temperatureMax"),
                "temp_avg_c": v.get("temperatureAvg"),
                "feels_like_day_c": v.get("temperatureApparentMax"),
                "feels_like_night_c": v.get("temperatureApparentMin"),
                "humidity_avg": v.get("humidityAvg"),
                "pressure_hpa": v.get("pressureSurfaceLevelAvg"),
                "wind": {
                    "speed_ms": v.get("windSpeedAvg"),
                    "direction_deg": v.get("windDirectionAvg"),
                    "gust_ms": v.get("windGustMax"),
                },
                "precipitation": {
                    "rain_1h_mm": v.get("rainAccumulationAvg"),
                    "probability": v.get("precipitationProbabilityMax"),
                },
                "condition": {
                    "code": code,
                    "main": self._WEATHER_CODES.get(code, "Unknown"),
                    "description": self._WEATHER_CODES.get(code, "Unknown"),
                },
                "clouds_pct": v.get("cloudCoverAvg"),
                "uv_index": v.get("uvIndexMax"),
                "astronomy": {
                    "sunrise": v.get("sunriseTime"),
                    "sunset": v.get("sunsetTime"),
                },
            })
        return {"provider": self.PROVIDER_NAME, "days": forecast_days}

    def _normalize_hourly_forecast(self, data: dict[str, Any], days: int) -> dict[str, Any]:
        timelines = data.get("timelines", {}).get("hourly", [])
        max_items = days * 24
        daily_map: dict[str, list] = defaultdict(list)
        for item in timelines[:max_items]:
            date_str = item.get("time", "")[:10]
            v = item.get("values", {})
            code = v.get("weatherCode", 0)
            daily_map[date_str].append({
                "datetime_utc": item.get("time"),
                "temperature_c": v.get("temperature"),
                "feels_like_c": v.get("temperatureApparent"),
                "humidity": v.get("humidity"),
                "pressure_hpa": v.get("pressureSurfaceLevel"),
                "wind": {
                    "speed_ms": v.get("windSpeed"),
                    "direction_deg": v.get("windDirection"),
                    "gust_ms": v.get("windGust"),
                },
                "precipitation": {
                    "rain_1h_mm": v.get("rainIntensity"),
                    "probability": v.get("precipitationProbability"),
                },
                "condition": {
                    "code": code,
                    "main": self._WEATHER_CODES.get(code, "Unknown"),
                    "description": self._WEATHER_CODES.get(code, "Unknown"),
                },
                "clouds_pct": v.get("cloudCover"),
                "visibility_m": v["visibility"] * 1000 if v.get("visibility") is not None else None,
                "uv_index": v.get("uvIndex"),
            })

        forecast_days = []
        for date_str in sorted(daily_map.keys()):
            hours = daily_map[date_str]
            temps = [h["temperature_c"] for h in hours if h.get("temperature_c") is not None]
            forecast_days.append({
                "date": date_str,
                "temp_min_c": min(temps) if temps else None,
                "temp_max_c": max(temps) if temps else None,
                "temp_avg_c": round(sum(temps) / len(temps), 2) if temps else None,
                "hourly": hours,
            })
        return {"provider": self.PROVIDER_NAME, "days": forecast_days}

    def _normalize_history(self, data: dict[str, Any]) -> dict[str, Any]:
        timelines = data.get("timelines", {}).get("daily", [])
        days_data = []
        for item in timelines:
            v = item.get("values", {})
            days_data.append({
                "date": item.get("time", "")[:10],
                "temp_min_c": v.get("temperatureMin"),
                "temp_max_c": v.get("temperatureMax"),
                "temp_avg_c": v.get("temperatureAvg"),
                "humidity_avg": v.get("humidityAvg"),
                "pressure_avg_hpa": v.get("pressureSurfaceLevelAvg"),
                "wind_speed_avg_ms": v.get("windSpeedAvg"),
                "precipitation_total_mm": v.get("rainAccumulationSum"),
            })
        return {"provider": self.PROVIDER_NAME, "data": days_data}