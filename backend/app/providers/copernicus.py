# backend/app/providers/copernicus.py
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import get_settings
from app.core.exceptions import ProviderException, ProviderTimeoutException
from app.utils import get_http_client

logger = logging.getLogger("weatherly.providers.copernicus")


class CopernicusProvider:
    PROVIDER_NAME = "copernicus"

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.COPERNICUS_API_KEY
        self._base_url = settings.COPERNICUS_BASE_URL

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key)

    def _check_configured(self) -> None:
        if not self.is_configured:
            raise ProviderException(self.PROVIDER_NAME, "API key not configured")

    async def get_air_quality(self, lat: float, lon: float) -> dict[str, Any]:
        self._check_configured()
        params = {
            "latitude": lat,
            "longitude": lon,
            "token": self._api_key,
        }
        data = await self._request("/air-quality/forecast", params)
        return self._normalize_air_quality(data, lat, lon)

    async def get_environmental_data(self, lat: float, lon: float) -> dict[str, Any]:
        self._check_configured()
        params = {
            "latitude": lat,
            "longitude": lon,
            "token": self._api_key,
        }
        data = await self._request("/environment/current", params)
        return self._normalize_environmental(data, lat, lon)

    async def get_agriculture_data(self, lat: float, lon: float) -> dict[str, Any]:
        self._check_configured()
        params = {
            "latitude": lat,
            "longitude": lon,
            "token": self._api_key,
        }
        try:
            data = await self._request("/agriculture/indices", params)
            return self._normalize_agriculture(data, lat, lon)
        except ProviderException:
            return {"provider": self.PROVIDER_NAME, "data": {}}

    async def health_check(self) -> bool:
        if not self.is_configured:
            return False
        try:
            await self._request("/status", {})
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

    def _normalize_air_quality(self, data: dict[str, Any], lat: float, lon: float) -> dict[str, Any]:
        forecast = data.get("data", {}).get("forecast", {})
        current = data.get("data", {}).get("current", {})
        pollution = current.get("pollution", forecast.get("pollution", {}))

        aqi_val = pollution.get("aqius", pollution.get("aqi", 0))
        return {
            "provider": self.PROVIDER_NAME,
            "observed_at": data.get("data", {}).get("time", {}).get("iso", datetime.now(timezone.utc).isoformat()),
            "aqi": aqi_val,
            "aqi_category": self._aqi_category(aqi_val),
            "dominant_pollutant": pollution.get("mainus", pollution.get("main_pollutant")),
            "pm2_5": pollution.get("pm25", pollution.get("pm2_5")),
            "pm10": pollution.get("pm10"),
            "o3": pollution.get("o3"),
            "no2": pollution.get("no2"),
            "so2": pollution.get("so2"),
            "co": pollution.get("co"),
        }

    def _normalize_environmental(self, data: dict[str, Any], lat: float, lon: float) -> dict[str, Any]:
        d = data.get("data", {})
        return {
            "provider": self.PROVIDER_NAME,
            "soil_moisture": d.get("soil_moisture"),
            "soil_temperature_c": d.get("soil_temperature"),
            "vegetation_index": d.get("ndvi"),
            "evapotranspiration_mm": d.get("evapotranspiration"),
            "snow_depth_cm": d.get("snow_depth"),
            "sea_surface_temp_c": d.get("sst"),
        }

    def _normalize_agriculture(self, data: dict[str, Any], lat: float, lon: float) -> dict[str, Any]:
        d = data.get("data", {})
        return {
            "provider": self.PROVIDER_NAME,
            "ndvi": d.get("ndvi"),
            "evi": d.get("evi"),
            "soil_moisture_index": d.get("smi"),
            "growing_degree_days": d.get("gdd"),
            "frost_risk": d.get("frost_risk"),
            "drought_index": d.get("drought_index"),
        }

    @staticmethod
    def _aqi_category(aqi: int) -> str:
        if aqi <= 50:
            return "Good"
        if aqi <= 100:
            return "Moderate"
        if aqi <= 150:
            return "Unhealthy for Sensitive Groups"
        if aqi <= 200:
            return "Unhealthy"
        if aqi <= 300:
            return "Very Unhealthy"
        return "Hazardous"