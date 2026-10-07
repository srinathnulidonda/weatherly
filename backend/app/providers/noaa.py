# backend/app/providers/noaa.py
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import get_settings
from app.core.exceptions import ProviderException, ProviderTimeoutException

logger = logging.getLogger("weatherly.providers.noaa")


class NOAAProvider:
    PROVIDER_NAME = "noaa"

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.NOAA_API_KEY
        self._base_url = settings.NOAA_BASE_URL
        self._timeout = httpx.Timeout(15.0, connect=5.0)

    @property
    def is_configured(self) -> bool:
        return True

    async def get_alerts(self, lat: float, lon: float, radius_km: float = 100.0) -> list[dict[str, Any]]:
        point_data = await self._get_point(lat, lon)
        if not point_data:
            return []

        zone_id = point_data.get("forecastZone", "").split("/")[-1]
        if not zone_id:
            params = {"point": f"{lat},{lon}", "status": "actual", "message_type": "alert"}
            data = await self._request("/alerts/active", params)
        else:
            data = await self._request(f"/alerts/active/zone/{zone_id}", {})

        features = data.get("features", [])
        result = []
        for feature in features:
            props = feature.get("properties", {})
            result.append({
                "provider": self.PROVIDER_NAME,
                "source_alert_id": props.get("id"),
                "event_type": props.get("event", "Unknown"),
                "severity": (props.get("severity", "moderate") or "moderate").lower(),
                "urgency": props.get("urgency"),
                "certainty": props.get("certainty"),
                "headline": props.get("headline", "Weather Alert"),
                "description": props.get("description"),
                "instruction": props.get("instruction"),
                "sender": props.get("senderName"),
                "effective_at": props.get("effective"),
                "onset_at": props.get("onset"),
                "expires_at": props.get("expires"),
                "latitude": lat, "longitude": lon,
                "location_name": props.get("areaDesc"),
                "affected_zones": props.get("affectedZones"),
                "category": props.get("category"),
                "response_type": props.get("response"),
                "raw_data": props,
            })
        return result

    async def health_check(self) -> bool:
        try:
            await self._request("/", {})
            return True
        except Exception:
            return False

    async def _get_point(self, lat: float, lon: float) -> dict[str, Any]:
        try:
            data = await self._request(f"/points/{round(lat, 4)},{round(lon, 4)}", {})
            return data.get("properties", {})
        except ProviderException:
            logger.warning("NOAA point lookup failed for (%s,%s)", lat, lon)
            return {}

    async def _request(self, endpoint: str, params: dict[str, Any]) -> Any:
        url = f"{self._base_url}{endpoint}" if not endpoint.startswith("http") else endpoint
        headers = {"User-Agent": "Weatherly/1.0", "Accept": "application/geo+json"}
        if self._api_key:
            headers["token"] = self._api_key
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.get(url, params=params, headers=headers)
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