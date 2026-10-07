# backend/app/providers/weatherapi.py
from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import get_settings
from app.core.exceptions import ProviderException, ProviderTimeoutException
from app.utils import get_http_client

logger = logging.getLogger("weatherly.providers.weatherapi")


class WeatherAPIProvider:
    PROVIDER_NAME = "weatherapi"

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.WEATHERAPI_API_KEY
        self._base_url = settings.WEATHERAPI_BASE_URL

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key)

    def _check_configured(self) -> None:
        if not self.is_configured:
            raise ProviderException(self.PROVIDER_NAME, "API key not configured")

    async def get_current(self, lat: float, lon: float, units: str = "metric") -> dict[str, Any]:
        self._check_configured()
        params = {"key": self._api_key, "q": f"{lat},{lon}", "aqi": "yes"}
        data = await self._request("/v1/current.json", params)
        return self._normalize_current(data)

    async def get_forecast(
        self, lat: float, lon: float, days: int = 7, units: str = "metric", hourly: bool = False
    ) -> dict[str, Any]:
        self._check_configured()
        capped = min(days, 14)
        params = {
            "key": self._api_key, "q": f"{lat},{lon}",
            "days": capped, "aqi": "yes", "alerts": "yes",
        }
        data = await self._request("/v1/forecast.json", params)
        return self._normalize_forecast(data, hourly)

    async def get_history(
        self, lat: float, lon: float, start_date: str, end_date: str, units: str = "metric"
    ) -> dict[str, Any]:
        self._check_configured()
        params = {"key": self._api_key, "q": f"{lat},{lon}", "dt": start_date, "end_dt": end_date}
        data = await self._request("/v1/history.json", params)
        return self._normalize_history(data)

    async def get_marine(self, lat: float, lon: float, days: int = 3) -> dict[str, Any]:
        self._check_configured()
        params = {"key": self._api_key, "q": f"{lat},{lon}", "days": min(days, 7)}
        try:
            data = await self._request("/v1/marine.json", params)
            return self._normalize_marine(data)
        except ProviderException:
            return {"provider": self.PROVIDER_NAME, "data": []}

    async def get_astronomy(self, lat: float, lon: float, date_str: str) -> dict[str, Any]:
        self._check_configured()
        params = {"key": self._api_key, "q": f"{lat},{lon}", "dt": date_str}
        data = await self._request("/v1/astronomy.json", params)
        return self._normalize_astronomy(data, date_str)

    async def get_alerts(self, lat: float, lon: float) -> list[dict[str, Any]]:
        self._check_configured()
        params = {"key": self._api_key, "q": f"{lat},{lon}", "days": 1, "alerts": "yes"}
        try:
            data = await self._request("/v1/forecast.json", params)
        except ProviderException:
            return []
        raw_alerts = data.get("alerts", {}).get("alert", [])
        result = []
        for a in raw_alerts:
            headline_event = a.get('headline', '') + a.get('event', '')
            source_id = f"wapi_{hashlib.sha256(headline_event.encode()).hexdigest()[:16]}"
            result.append({
                "provider": self.PROVIDER_NAME,
                "source_alert_id": source_id,
                "event_type": a.get("event", "Unknown"),
                "severity": (a.get("severity") or "moderate").lower(),
                "urgency": a.get("urgency"),
                "certainty": a.get("certainty"),
                "headline": a.get("headline", "Weather Alert"),
                "description": a.get("desc"),
                "instruction": a.get("instruction"),
                "effective_at": a.get("effective"),
                "expires_at": a.get("expires"),
                "latitude": lat, "longitude": lon,
                "category": a.get("category"), "raw_data": a,
            })
        return result

    async def geocode(self, query: str, limit: int = 5, country_code: str | None = None) -> list[dict[str, Any]]:
        self._check_configured()
        params = {"key": self._api_key, "q": query}
        data = await self._request("/v1/search.json", params)
        results = []
        for item in (data if isinstance(data, list) else [])[:limit]:
            if country_code and item.get("country", "").upper() != country_code.upper():
                continue
            results.append({
                "name": item.get("name", ""), "latitude": item.get("lat"),
                "longitude": item.get("lon"), "country": item.get("country"),
                "country_code": item.get("country"), "state": item.get("region"),
                "city": item.get("name"), "confidence": 0.8,
            })
        return results

    async def health_check(self) -> bool:
        if not self.is_configured:
            return False
        try:
            params = {"key": self._api_key, "q": "0,0"}
            await self._request("/v1/current.json", params)
            return True
        except Exception:
            return False

    async def _request(self, endpoint: str, params: dict[str, Any]) -> Any:
        url = f"{self._base_url}{endpoint}"
        try:
            client = await get_http_client()
            response = await client.get(url, params=params)
            if response.status_code in (401, 403):
                raise ProviderException(self.PROVIDER_NAME, "Invalid API key")
            if response.status_code == 429:
                raise ProviderException(self.PROVIDER_NAME, "Rate limit exceeded")
            if response.status_code >= 400:
                body = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                msg = body.get("error", {}).get("message", response.text[:200])
                raise ProviderException(self.PROVIDER_NAME, f"HTTP {response.status_code}: {msg}")
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
    def _combine_date_time(date_str: str | None, time_str: str | None) -> str | None:
        if not date_str or not time_str:
            return None
        if time_str.lower().startswith("no "):
            return None
        try:
            dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %I:%M %p")
            return dt.isoformat()
        except (ValueError, TypeError):
            pass
        try:
            dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            return dt.isoformat()
        except (ValueError, TypeError):
            pass
        try:
            datetime.fromisoformat(time_str)
            return time_str
        except (ValueError, TypeError):
            pass
        return time_str

    def _normalize_current(self, data: dict[str, Any]) -> dict[str, Any]:
        current = data.get("current", {})
        condition = current.get("condition", {})
        aqi = current.get("air_quality", {})

        return {
            "provider": self.PROVIDER_NAME,
            "observed_at": current.get("last_updated"),
            "temperature_c": current.get("temp_c"),
            "feels_like_c": current.get("feelslike_c"),
            "humidity": current.get("humidity"),
            "pressure_hpa": current.get("pressure_mb"),
            "wind_speed_ms": round(current["wind_kph"] / 3.6, 2) if current.get("wind_kph") is not None else None,
            "wind_deg": current.get("wind_degree"),
            "wind_gust_ms": round(current["gust_kph"] / 3.6, 2) if current.get("gust_kph") is not None else None,
            "clouds_pct": current.get("cloud"),
            "visibility_m": round(current["vis_km"] * 1000, 0) if current.get("vis_km") is not None else None,
            "uv_index": current.get("uv"),
            "condition_code": condition.get("code"),
            "condition_main": condition.get("text"),
            "condition_description": condition.get("text"),
            "condition_icon": condition.get("icon"),
            "dew_point_c": current.get("dewpoint_c"),
            "precipitation_probability": None,
            "aqi": aqi.get("us-epa-index"),
            "raw_data": data,
            "data_quality": {"source": self.PROVIDER_NAME, "completeness": 0.9},
        }

    def _normalize_forecast(self, data: dict[str, Any], hourly: bool) -> dict[str, Any]:
        forecast_days = []

        for day in data.get("forecast", {}).get("forecastday", []):
            day_data = day.get("day", {})
            astro = day.get("astro", {})
            condition = day_data.get("condition", {})
            date_str = day.get("date")

            hourly_items = []
            raw_hours = day.get("hour", [])

            for h in raw_hours:
                h_cond = h.get("condition", {})
                hourly_items.append({
                    "datetime_utc": h.get("time"),
                    "temperature_c": h.get("temp_c"),
                    "feels_like_c": h.get("feelslike_c"),
                    "humidity": h.get("humidity"),
                    "pressure_hpa": h.get("pressure_mb"),
                    "wind": {
                        "speed_ms": round(h["wind_kph"] / 3.6, 2) if h.get("wind_kph") is not None else None,
                        "direction_deg": h.get("wind_degree"),
                        "gust_ms": round(h["gust_kph"] / 3.6, 2) if h.get("gust_kph") is not None else None,
                        "direction_label": h.get("wind_dir"),
                    },
                    "precipitation": {
                        "rain_1h_mm": h.get("precip_mm"),
                        "snow_1h_mm": h["snow_cm"] * 10 if h.get("snow_cm") is not None else None,
                        "probability": h.get("chance_of_rain"),
                    },
                    "condition": {
                        "code": h_cond.get("code"), "main": h_cond.get("text"),
                        "description": h_cond.get("text"), "icon": h_cond.get("icon"),
                    },
                    "clouds_pct": h.get("cloud"),
                    "visibility_m": round(h["vis_km"] * 1000, 0) if h.get("vis_km") is not None else None,
                    "uv_index": h.get("uv"),
                    "dew_point_c": h.get("dewpoint_c"),
                })

            forecast_days.append({
                "date": date_str,
                "temp_min_c": day_data.get("mintemp_c"),
                "temp_max_c": day_data.get("maxtemp_c"),
                "temp_avg_c": day_data.get("avgtemp_c"),
                "humidity_avg": day_data.get("avghumidity"),
                "wind": {
                    "speed_ms": round(day_data["maxwind_kph"] / 3.6, 2) if day_data.get("maxwind_kph") is not None else None,
                },
                "precipitation": {
                    "rain_1h_mm": day_data.get("totalprecip_mm"),
                    "probability": day_data.get("daily_chance_of_rain"),
                    "snow_cm": day_data.get("totalsnow_cm"),
                },
                "condition": {
                    "code": condition.get("code"), "main": condition.get("text"),
                    "description": condition.get("text"), "icon": condition.get("icon"),
                },
                "uv_index": day_data.get("uv"),
                "astronomy": {
                    "sunrise": self._combine_date_time(date_str, astro.get("sunrise")),
                    "sunset": self._combine_date_time(date_str, astro.get("sunset")),
                    "moonrise": self._combine_date_time(date_str, astro.get("moonrise")),
                    "moonset": self._combine_date_time(date_str, astro.get("moonset")),
                    "moon_phase": None,
                    "moon_illumination": astro.get("moon_illumination"),
                },
                "hourly": hourly_items if hourly else None,
                "_hourly_count": len(hourly_items),
            })

        return {"provider": self.PROVIDER_NAME, "days": forecast_days, "_total_days": len(forecast_days)}

    def _normalize_history(self, data: dict[str, Any]) -> dict[str, Any]:
        days_data = []
        for day in data.get("forecast", {}).get("forecastday", []):
            d = day.get("day", {})
            condition = d.get("condition", {})
            days_data.append({
                "date": day.get("date"),
                "temp_min_c": d.get("mintemp_c"),
                "temp_max_c": d.get("maxtemp_c"),
                "temp_avg_c": d.get("avgtemp_c"),
                "humidity_avg": d.get("avghumidity"),
                "wind_speed_avg_ms": round(d["maxwind_kph"] / 3.6, 2) if d.get("maxwind_kph") is not None else None,
                "precipitation_total_mm": d.get("totalprecip_mm"),
                "condition": {
                    "code": condition.get("code"), "main": condition.get("text"),
                    "description": condition.get("text"),
                },
            })
        return {"provider": self.PROVIDER_NAME, "data": days_data}

    def _normalize_marine(self, data: dict[str, Any]) -> dict[str, Any]:
        marine_days = []
        for day in data.get("forecast", {}).get("forecastday", []):
            for hour in day.get("hour", []):
                marine_days.append({
                    "datetime_utc": hour.get("time"),
                    "water_temp_c": hour.get("water_temp_c"),
                    "wave_height_m": hour.get("sig_ht_mt"),
                    "swell_height_m": hour.get("swell_ht_mt"),
                    "swell_period_s": hour.get("swell_period_secs"),
                    "swell_direction_deg": hour.get("swell_dir_16_point"),
                    "visibility_m": round(hour["vis_km"] * 1000) if hour.get("vis_km") is not None else None,
                    "wind_speed_ms": round(hour["wind_kph"] / 3.6, 2) if hour.get("wind_kph") is not None else None,
                    "wind_deg": hour.get("wind_degree"),
                    "tide_height_m": hour.get("tide_height_mt"),
                    "tide_type": hour.get("tide_type"),
                })
        return {"provider": self.PROVIDER_NAME, "data": marine_days}

    def _normalize_astronomy(self, data: dict[str, Any], date_str: str = "") -> dict[str, Any]:
        astro = data.get("astronomy", {}).get("astro", {})
        if not date_str:
            loc = data.get("location", {})
            date_str = loc.get("localtime", "")[:10]
        return {
            "provider": self.PROVIDER_NAME,
            "date": date_str,
            "sunrise": self._combine_date_time(date_str, astro.get("sunrise")) or astro.get("sunrise"),
            "sunset": self._combine_date_time(date_str, astro.get("sunset")) or astro.get("sunset"),
            "moonrise": self._combine_date_time(date_str, astro.get("moonrise")) or astro.get("moonrise"),
            "moonset": self._combine_date_time(date_str, astro.get("moonset")) or astro.get("moonset"),
            "moon_phase": astro.get("moon_phase"),
            "moon_illumination": astro.get("moon_illumination"),
            "is_moon_up": astro.get("is_moon_up"),
            "is_sun_up": astro.get("is_sun_up"),
        }