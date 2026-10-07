# backend/app/providers/open_meteo.py
from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.core.exceptions import ProviderException, ProviderTimeoutException
from app.utils import get_http_client

logger = logging.getLogger("weatherly.providers.open_meteo")

_WMO_CODES: dict[int, tuple[str, str, str]] = {
    0: ("Clear sky", "Clear", "01d"),
    1: ("Mainly clear", "Clear", "01d"),
    2: ("Partly cloudy", "Clouds", "02d"),
    3: ("Overcast", "Clouds", "04d"),
    45: ("Fog", "Fog", "50d"),
    48: ("Depositing rime fog", "Fog", "50d"),
    51: ("Light drizzle", "Drizzle", "09d"),
    53: ("Moderate drizzle", "Drizzle", "09d"),
    55: ("Dense drizzle", "Drizzle", "09d"),
    56: ("Light freezing drizzle", "Drizzle", "09d"),
    57: ("Dense freezing drizzle", "Drizzle", "09d"),
    61: ("Slight rain", "Rain", "10d"),
    63: ("Moderate rain", "Rain", "10d"),
    65: ("Heavy rain", "Rain", "10d"),
    66: ("Light freezing rain", "Rain", "13d"),
    67: ("Heavy freezing rain", "Rain", "13d"),
    71: ("Slight snowfall", "Snow", "13d"),
    73: ("Moderate snowfall", "Snow", "13d"),
    75: ("Heavy snowfall", "Snow", "13d"),
    77: ("Snow grains", "Snow", "13d"),
    80: ("Slight rain showers", "Rain", "09d"),
    81: ("Moderate rain showers", "Rain", "09d"),
    82: ("Violent rain showers", "Rain", "09d"),
    85: ("Slight snow showers", "Snow", "13d"),
    86: ("Heavy snow showers", "Snow", "13d"),
    95: ("Thunderstorm", "Thunderstorm", "11d"),
    96: ("Thunderstorm with slight hail", "Thunderstorm", "11d"),
    99: ("Thunderstorm with heavy hail", "Thunderstorm", "11d"),
}


class OpenMeteoProvider:
    PROVIDER_NAME = "open_meteo"

    _BASE_URL = "https://api.open-meteo.com"
    _AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com"
    _MARINE_URL = "https://marine-api.open-meteo.com"
    _ARCHIVE_URL = "https://archive-api.open-meteo.com"
    _GEOCODING_URL = "https://geocoding-api.open-meteo.com"

    def __init__(self) -> None:
        pass

    @property
    def is_configured(self) -> bool:
        return True

    async def get_current(
        self, lat: float, lon: float, units: str = "metric", **kw: Any
    ) -> dict[str, Any]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": ",".join([
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "dew_point_2m",
                "is_day",
                "precipitation",
                "rain",
                "showers",
                "snowfall",
                "weather_code",
                "cloud_cover",
                "pressure_msl",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "wind_gusts_10m",
            ]),
            "daily": "sunrise,sunset,uv_index_max",
            "wind_speed_unit": "ms",
            "timezone": "auto",
            "forecast_days": 1,
        }
        data = await self._request(f"{self._BASE_URL}/v1/forecast", params)
        return self._normalize_current(data, lat, lon)

    async def get_forecast(
        self,
        lat: float,
        lon: float,
        days: int = 7,
        units: str = "metric",
        hourly: bool = False,
        **kw: Any,
    ) -> dict[str, Any]:
        capped = min(days, 16)
        params: dict[str, Any] = {
            "latitude": lat,
            "longitude": lon,
            "daily": ",".join([
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "apparent_temperature_max",
                "apparent_temperature_min",
                "sunrise",
                "sunset",
                "daylight_duration",
                "uv_index_max",
                "precipitation_sum",
                "rain_sum",
                "snowfall_sum",
                "precipitation_hours",
                "precipitation_probability_max",
                "wind_speed_10m_max",
                "wind_gusts_10m_max",
                "wind_direction_10m_dominant",
            ]),
            "wind_speed_unit": "ms",
            "timezone": "auto",
            "forecast_days": capped,
        }

        if hourly:
            params["hourly"] = ",".join([
                "temperature_2m",
                "relative_humidity_2m",
                "dew_point_2m",
                "apparent_temperature",
                "precipitation_probability",
                "precipitation",
                "rain",
                "showers",
                "snowfall",
                "weather_code",
                "cloud_cover",
                "visibility",
                "wind_speed_10m",
                "wind_direction_10m",
                "wind_gusts_10m",
                "uv_index",
                "is_day",
                "surface_pressure",
            ])

        data = await self._request(f"{self._BASE_URL}/v1/forecast", params)
        return self._normalize_forecast(data, capped, hourly)

    async def get_history(
        self,
        lat: float,
        lon: float,
        start_date: str,
        end_date: str,
        units: str = "metric",
        **kw: Any,
    ) -> dict[str, Any]:
        from datetime import date as date_type

        end_dt = date_type.fromisoformat(end_date)
        days_ago = (date_type.today() - end_dt).days

        if days_ago < 5:
            return await self._get_recent_history(lat, lon, start_date, end_date)

        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date,
            "end_date": end_date,
            "daily": ",".join([
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "temperature_2m_mean",
                "apparent_temperature_max",
                "apparent_temperature_min",
                "precipitation_sum",
                "rain_sum",
                "snowfall_sum",
                "wind_speed_10m_max",
                "wind_direction_10m_dominant",
            ]),
            "wind_speed_unit": "ms",
            "timezone": "auto",
        }
        data = await self._request(f"{self._ARCHIVE_URL}/v1/archive", params)
        return self._normalize_history(data)

    async def _get_recent_history(
        self, lat: float, lon: float, start_date: str, end_date: str
    ) -> dict[str, Any]:
        from datetime import date as date_type

        start_dt = date_type.fromisoformat(start_date)
        past_days = (date_type.today() - start_dt).days
        past_days = min(max(past_days, 1), 92)

        params = {
            "latitude": lat,
            "longitude": lon,
            "past_days": past_days,
            "forecast_days": 0,
            "daily": ",".join([
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "temperature_2m_mean",
                "precipitation_sum",
                "rain_sum",
                "snowfall_sum",
                "wind_speed_10m_max",
                "wind_direction_10m_dominant",
            ]),
            "wind_speed_unit": "ms",
            "timezone": "auto",
        }
        data = await self._request(f"{self._BASE_URL}/v1/forecast", params)
        result = self._normalize_history(data)
        filtered = [
            d for d in result.get("data", [])
            if start_date <= d.get("date", "") <= end_date
        ]
        result["data"] = filtered
        return result

    async def get_air_quality(self, lat: float, lon: float) -> dict[str, Any]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": ",".join([
                "us_aqi",
                "pm10",
                "pm2_5",
                "carbon_monoxide",
                "nitrogen_dioxide",
                "sulphur_dioxide",
                "ozone",
                "dust",
                "uv_index",
            ]),
            "timezone": "auto",
        }
        data = await self._request(f"{self._AIR_QUALITY_URL}/v1/air-quality", params)
        return self._normalize_air_quality(data, lat, lon)

    async def get_marine(self, lat: float, lon: float, days: int = 3) -> dict[str, Any]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": ",".join([
                "wave_height",
                "wave_direction",
                "wave_period",
                "wind_wave_height",
                "wind_wave_direction",
                "wind_wave_period",
                "swell_wave_height",
                "swell_wave_direction",
                "swell_wave_period",
            ]),
            "daily": ",".join([
                "wave_height_max",
                "wave_direction_dominant",
                "wave_period_max",
            ]),
            "timezone": "auto",
            "forecast_days": min(days, 8),
        }
        data = await self._request(f"{self._MARINE_URL}/v1/marine", params)
        return self._normalize_marine(data)

    async def geocode(
        self, query: str, limit: int = 5, country_code: str | None = None
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {
            "name": query,
            "count": limit,
            "language": "en",
            "format": "json",
        }
        data = await self._request(f"{self._GEOCODING_URL}/v1/search", params)

        results_raw = data.get("results", [])
        results = []
        for item in results_raw:
            cc = item.get("country_code", "")
            if country_code and cc.upper() != country_code.upper():
                continue
            results.append({
                "name": item.get("name", ""),
                "latitude": item.get("latitude"),
                "longitude": item.get("longitude"),
                "country": item.get("country"),
                "country_code": cc,
                "state": item.get("admin1"),
                "city": item.get("name"),
                "population": item.get("population"),
                "elevation_m": item.get("elevation"),
                "timezone": item.get("timezone"),
                "confidence": 0.9,
            })
        return results[:limit]

    async def health_check(self) -> bool:
        try:
            params = {
                "latitude": 0,
                "longitude": 0,
                "current": "temperature_2m",
            }
            await self._request(f"{self._BASE_URL}/v1/forecast", params)
            return True
        except Exception:
            return False

    async def _request(self, url: str, params: dict[str, Any]) -> Any:
        try:
            client = await get_http_client()
            response = await client.get(url, params=params)
            if response.status_code >= 400:
                body = {}
                try:
                    body = response.json()
                except Exception:
                    pass
                reason = body.get("reason", response.text[:200])
                raise ProviderException(
                    self.PROVIDER_NAME,
                    f"HTTP {response.status_code}: {reason}",
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

    @staticmethod
    def _at(data: dict, key: str, index: int) -> Any:
        arr = data.get(key)
        if arr is None or index >= len(arr):
            return None
        return arr[index]

    @staticmethod
    def _wmo(code: int | None, is_day: bool = True) -> dict[str, Any]:
        if code is None:
            return {"code": None, "main": None, "description": None, "icon": None}
        desc, main, icon = _WMO_CODES.get(code, ("Unknown", "Unknown", "01d"))
        if not is_day:
            icon = icon.replace("d", "n")
        return {"code": code, "main": main, "description": desc, "icon": icon}

    @staticmethod
    def _local_to_utc_iso(local_time_str: str | None, utc_offset_seconds: int) -> str | None:
        if not local_time_str:
            return None
        try:
            local_dt = datetime.fromisoformat(local_time_str)
            utc_dt = local_dt - timedelta(seconds=utc_offset_seconds)
            return utc_dt.replace(tzinfo=timezone.utc).isoformat()
        except (ValueError, TypeError):
            return local_time_str

    @staticmethod
    def _safe_avg(a: float | None, b: float | None) -> float | None:
        if a is not None and b is not None:
            return round((a + b) / 2, 2)
        return a or b

    @staticmethod
    def _safe_duration(seconds: float | None) -> float | None:
        if seconds is None:
            return None
        return round(seconds / 3600, 2)

    def _normalize_current(self, data: dict[str, Any], lat: float, lon: float) -> dict[str, Any]:
        c = data.get("current", {})
        daily = data.get("daily", {})
        utc_offset = data.get("utc_offset_seconds", 0)

        code = c.get("weather_code")
        is_day = bool(c.get("is_day", 1))
        sunrise_str = self._local_to_utc_iso(self._at(daily, "sunrise", 0), utc_offset)
        sunset_str = self._local_to_utc_iso(self._at(daily, "sunset", 0), utc_offset)
        observed_at = self._local_to_utc_iso(c.get("time"), utc_offset) or datetime.now(timezone.utc).isoformat()
        uv = self._at(daily, "uv_index_max", 0)

        return {
            "provider": self.PROVIDER_NAME,
            "observed_at": observed_at,
            "temperature_c": c.get("temperature_2m"),
            "feels_like_c": c.get("apparent_temperature"),
            "humidity": c.get("relative_humidity_2m"),
            "dew_point_c": c.get("dew_point_2m"),
            "pressure_hpa": c.get("pressure_msl"),
            "surface_pressure_hpa": c.get("surface_pressure"),
            "wind_speed_ms": c.get("wind_speed_10m"),
            "wind_deg": c.get("wind_direction_10m"),
            "wind_gust_ms": c.get("wind_gusts_10m"),
            "clouds_pct": c.get("cloud_cover"),
            "visibility_m": None,
            "rain_1h_mm": c.get("rain"),
            "snow_1h_mm": c["snowfall"] * 10 if c.get("snowfall") is not None else None,
            "uv_index": uv,
            "condition_code": code,
            "condition_main": self._wmo(code, is_day)["main"],
            "condition_description": self._wmo(code, is_day)["description"],
            "condition_icon": self._wmo(code, is_day)["icon"],
            "sunrise": sunrise_str,
            "sunset": sunset_str,
            "is_day": is_day,
            "raw_data": data,
            "data_quality": {
                "source": self.PROVIDER_NAME,
                "model": "ECMWF IFS",
                "completeness": 0.93,
            },
        }

    def _normalize_forecast(self, data: dict[str, Any], days: int, hourly: bool) -> dict[str, Any]:
        daily = data.get("daily", {})
        utc_offset = data.get("utc_offset_seconds", 0)
        times = daily.get("time", [])

        hourly_by_date: dict[str, list[dict]] = defaultdict(list)
        if hourly and data.get("hourly"):
            h_data = data["hourly"]
            h_times = h_data.get("time", [])
            for i, t in enumerate(h_times):
                date_key = t[:10]
                code = self._at(h_data, "weather_code", i)
                is_day_val = bool(self._at(h_data, "is_day", i))
                hourly_by_date[date_key].append({
                    "datetime_utc": self._local_to_utc_iso(t, utc_offset),
                    "temperature_c": self._at(h_data, "temperature_2m", i),
                    "feels_like_c": self._at(h_data, "apparent_temperature", i),
                    "humidity": self._at(h_data, "relative_humidity_2m", i),
                    "pressure_hpa": self._at(h_data, "surface_pressure", i),
                    "dew_point_c": self._at(h_data, "dew_point_2m", i),
                    "wind": {
                        "speed_ms": self._at(h_data, "wind_speed_10m", i),
                        "direction_deg": self._at(h_data, "wind_direction_10m", i),
                        "gust_ms": self._at(h_data, "wind_gusts_10m", i),
                    },
                    "precipitation": {
                        "rain_1h_mm": self._at(h_data, "rain", i),
                        "snow_1h_mm": (
                            self._at(h_data, "snowfall", i) * 10
                            if self._at(h_data, "snowfall", i) is not None
                            else None
                        ),
                        "probability": self._at(h_data, "precipitation_probability", i),
                    },
                    "condition": self._wmo(code, is_day_val),
                    "clouds_pct": self._at(h_data, "cloud_cover", i),
                    "visibility_m": self._at(h_data, "visibility", i),
                    "uv_index": self._at(h_data, "uv_index", i),
                    "is_day": is_day_val,
                })

        forecast_days = []
        for i, date_str in enumerate(times):
            if i >= days:
                break
            code = self._at(daily, "weather_code", i)
            day_hours = hourly_by_date.get(date_str) if hourly else None

            forecast_days.append({
                "date": date_str,
                "temp_min_c": self._at(daily, "temperature_2m_min", i),
                "temp_max_c": self._at(daily, "temperature_2m_max", i),
                "temp_avg_c": self._safe_avg(
                    self._at(daily, "temperature_2m_min", i),
                    self._at(daily, "temperature_2m_max", i),
                ),
                "feels_like_day_c": self._at(daily, "apparent_temperature_max", i),
                "feels_like_night_c": self._at(daily, "apparent_temperature_min", i),
                "humidity_avg": None,
                "pressure_hpa": None,
                "wind": {
                    "speed_ms": self._at(daily, "wind_speed_10m_max", i),
                    "direction_deg": self._at(daily, "wind_direction_10m_dominant", i),
                    "gust_ms": self._at(daily, "wind_gusts_10m_max", i),
                },
                "precipitation": {
                    "rain_1h_mm": self._at(daily, "rain_sum", i),
                    "snow_1h_mm": (
                        self._at(daily, "snowfall_sum", i) * 10
                        if self._at(daily, "snowfall_sum", i) is not None
                        else None
                    ),
                    "probability": self._at(daily, "precipitation_probability_max", i),
                },
                "condition": self._wmo(code),
                "clouds_pct": None,
                "uv_index": self._at(daily, "uv_index_max", i),
                "astronomy": {
                    "sunrise": self._local_to_utc_iso(self._at(daily, "sunrise", i), utc_offset),
                    "sunset": self._local_to_utc_iso(self._at(daily, "sunset", i), utc_offset),
                    "day_length_hours": self._safe_duration(self._at(daily, "daylight_duration", i)),
                },
                "hourly": day_hours,
                "_hourly_count": len(day_hours) if day_hours else 0,
            })

        return {
            "provider": self.PROVIDER_NAME,
            "days": forecast_days,
            "_model": "ECMWF IFS",
            "_total_days": len(forecast_days),
        }

    def _normalize_history(self, data: dict[str, Any]) -> dict[str, Any]:
        daily = data.get("daily", {})
        times = daily.get("time", [])

        days_data = []
        for i, date_str in enumerate(times):
            code = self._at(daily, "weather_code", i)
            days_data.append({
                "date": date_str,
                "temp_min_c": self._at(daily, "temperature_2m_min", i),
                "temp_max_c": self._at(daily, "temperature_2m_max", i),
                "temp_avg_c": self._at(daily, "temperature_2m_mean", i),
                "humidity_avg": None,
                "pressure_avg_hpa": None,
                "wind_speed_avg_ms": self._at(daily, "wind_speed_10m_max", i),
                "precipitation_total_mm": self._at(daily, "precipitation_sum", i),
                "condition": self._wmo(code),
            })

        return {"provider": self.PROVIDER_NAME, "data": days_data}

    def _normalize_air_quality(self, data: dict[str, Any], lat: float, lon: float) -> dict[str, Any]:
        from app.utils.units import aqi_category_us

        c = data.get("current", {})
        us_aqi = c.get("us_aqi", 0) or 0

        return {
            "provider": self.PROVIDER_NAME,
            "observed_at": c.get("time", datetime.now(timezone.utc).isoformat()),
            "aqi": us_aqi,
            "aqi_category": aqi_category_us(us_aqi),
            "dominant_pollutant": None,
            "pm2_5": c.get("pm2_5"),
            "pm10": c.get("pm10"),
            "o3": c.get("ozone"),
            "no2": c.get("nitrogen_dioxide"),
            "so2": c.get("sulphur_dioxide"),
            "co": c.get("carbon_monoxide"),
            "nh3": None,
            "dust": c.get("dust"),
            "uv_index": c.get("uv_index"),
        }

    def _normalize_marine(self, data: dict[str, Any]) -> dict[str, Any]:
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])

        marine_data = []
        for i, t in enumerate(times):
            marine_data.append({
                "datetime_utc": t,
                "wave_height_m": self._at(hourly, "wave_height", i),
                "wave_direction_deg": self._at(hourly, "wave_direction", i),
                "wave_period_s": self._at(hourly, "wave_period", i),
                "swell_height_m": self._at(hourly, "swell_wave_height", i),
                "swell_direction_deg": self._at(hourly, "swell_wave_direction", i),
                "swell_period_s": self._at(hourly, "swell_wave_period", i),
                "wind_wave_height_m": self._at(hourly, "wind_wave_height", i),
            })

        return {"provider": self.PROVIDER_NAME, "data": marine_data}