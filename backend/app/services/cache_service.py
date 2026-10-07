# backend/app/services/cache_service.py
import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any

import redis.asyncio as aioredis

from app.config import get_settings
from app.database import RedisManager

logger = logging.getLogger("weatherly.cache")


class CacheKeyBuilder:
    PREFIX = "weatherly"

    @classmethod
    def current_weather(cls, lat: float, lon: float, units: str) -> str:
        return f"{cls.PREFIX}:weather:current:{cls._normalize_coords(lat, lon)}:{units}"

    @classmethod
    def forecast(cls, lat: float, lon: float, days: int, units: str, hourly: bool) -> str:
        return f"{cls.PREFIX}:weather:forecast:{cls._normalize_coords(lat, lon)}:{days}:{units}:{'h1' if hourly else 'h0'}"

    @classmethod
    def history(cls, lat: float, lon: float, start: str, end: str, units: str) -> str:
        return f"{cls.PREFIX}:weather:history:{cls._normalize_coords(lat, lon)}:{start}:{end}:{units}"

    @classmethod
    def air_quality(cls, lat: float, lon: float) -> str:
        return f"{cls.PREFIX}:aqi:{cls._normalize_coords(lat, lon)}"

    @classmethod
    def alerts(cls, lat: float, lon: float, radius_km: float, severity: list[str] | None = None, active_only: bool = True) -> str:
        severity_part = f":{','.join(sorted(severity))}" if severity else ""
        return f"{cls.PREFIX}:alerts:{cls._normalize_coords(lat, lon)}:{radius_km}{severity_part}:{active_only}"

    @classmethod
    def location_search(cls, query: str, country_code: str | None) -> str:
        q_hash = hashlib.md5(query.lower().strip().encode()).hexdigest()[:12]
        return f"{cls.PREFIX}:location:search:{q_hash}:{country_code or 'all'}"

    @classmethod
    def reverse_geocode(cls, lat: float, lon: float) -> str:
        return f"{cls.PREFIX}:location:reverse:{cls._normalize_coords(lat, lon)}"

    @classmethod
    def geocode_city(cls, city: str, region: str | None, country_code: str | None) -> str:
        key = f"{city.lower().strip()}:{(region or '').lower().strip()}:{(country_code or '').lower().strip()}"
        h = hashlib.md5(key.encode()).hexdigest()[:16]
        return f"{cls.PREFIX}:geocity:{h}"

    @classmethod
    def marine(cls, lat: float, lon: float, days: int) -> str:
        return f"{cls.PREFIX}:marine:{cls._normalize_coords(lat, lon)}:{days}"

    @classmethod
    def astronomy(cls, lat: float, lon: float, date_str: str) -> str:
        return f"{cls.PREFIX}:astronomy:{cls._normalize_coords(lat, lon)}:{date_str}"

    @classmethod
    def weather_map(cls, lat: float, lon: float, layer: str, zoom: int) -> str:
        return f"{cls.PREFIX}:map:{layer}:{zoom}:{cls._normalize_coords(lat, lon)}"

    @classmethod
    def provider_health(cls, provider: str) -> str:
        return f"{cls.PREFIX}:provider:health:{provider}"

    @classmethod
    def indices(cls, lat: float, lon: float) -> str:
        return f"{cls.PREFIX}:indices:{cls._normalize_coords(lat, lon)}"

    @classmethod
    def trends(cls, lat: float, lon: float, hours: int) -> str:
        return f"{cls.PREFIX}:trends:{cls._normalize_coords(lat, lon)}:{hours}"

    @classmethod
    def compare(cls, coords_hash: str, units: str) -> str:
        return f"{cls.PREFIX}:compare:{coords_hash}:{units}"

    @classmethod
    def _normalize_coords(cls, lat: float, lon: float) -> str:
        return f"{round(lat, 4)}:{round(lon, 4)}"


class CacheSerializer:
    @staticmethod
    def serialize(data: Any) -> str:
        return json.dumps(data, default=CacheSerializer._json_default, ensure_ascii=False)

    @staticmethod
    def deserialize(data: str | None) -> Any:
        return None if data is None else json.loads(data)

    @staticmethod
    def _json_default(obj: Any) -> Any:
        if isinstance(obj, datetime):
            return obj.isoformat()
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        if hasattr(obj, "__dict__"):
            return obj.__dict__
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


class CacheService:
    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def _client(self) -> aioredis.Redis:
        return RedisManager.get_client()

    async def get(self, key: str) -> Any:
        try:
            raw = await self._client.get(key)
            return CacheSerializer.deserialize(raw) if raw is not None else None
        except Exception as exc:
            logger.warning("Cache GET error for key=%s: %s", key, exc)
            return None

    async def set(self, key: str, value: Any, ttl: int | None = None) -> bool:
        try:
            serialized = CacheSerializer.serialize(value)
            if ttl is not None:
                await self._client.setex(key, ttl, serialized)
            else:
                await self._client.set(key, serialized)
            return True
        except Exception as exc:
            logger.warning("Cache SET error for key=%s: %s", key, exc)
            return False

    async def delete(self, key: str) -> bool:
        try:
            return bool(await self._client.delete(key))
        except Exception as exc:
            logger.warning("Cache DELETE error for key=%s: %s", key, exc)
            return False

    async def delete_pattern(self, pattern: str) -> int:
        try:
            count = 0
            async for key in self._client.scan_iter(match=pattern, count=100):
                await self._client.delete(key)
                count += 1
            return count
        except Exception as exc:
            logger.warning("Cache DELETE_PATTERN error for pattern=%s: %s", pattern, exc)
            return 0

    async def get_or_set(self, key: str, factory: Any, ttl: int | None = None) -> Any:
        cached = await self.get(key)
        if cached is not None:
            return cached
        value = factory() if callable(factory) else factory
        if asyncio.iscoroutine(value):
            value = await value
        if value is not None:
            await self.set(key, value, ttl)
        return value

    async def invalidate_weather(self, lat: float, lon: float) -> int:
        coord = CacheKeyBuilder._normalize_coords(lat, lon)
        return await self.delete_pattern(f"{CacheKeyBuilder.PREFIX}:weather:*:{coord}:*")

    async def invalidate_location(self, lat: float, lon: float) -> int:
        coord = CacheKeyBuilder._normalize_coords(lat, lon)
        count = await self.delete_pattern(f"{CacheKeyBuilder.PREFIX}:location:*:{coord}*")
        count += await self.delete_pattern(f"{CacheKeyBuilder.PREFIX}:weather:*:{coord}:*")
        return count

    async def invalidate_alerts(self, lat: float, lon: float) -> int:
        coord = CacheKeyBuilder._normalize_coords(lat, lon)
        return await self.delete_pattern(f"{CacheKeyBuilder.PREFIX}:alerts:{coord}:*")

    async def set_provider_health(self, provider: str, healthy: bool, ttl: int = 300) -> None:
        await self.set(CacheKeyBuilder.provider_health(provider), {"healthy": healthy, "checked_at": datetime.now(timezone.utc).isoformat()}, ttl)

    async def get_provider_health(self, provider: str) -> bool:
        data = await self.get(CacheKeyBuilder.provider_health(provider))
        return True if data is None else data.get("healthy", True)

    async def cache_stats(self) -> dict[str, Any]:
        try:
            info = await self._client.info("memory")
            keyspace = await self._client.info("keyspace")
            clients = await self._client.info("clients")
            return {
                "used_memory": info.get("used_memory_human", "unknown"),
                "used_memory_peak": info.get("used_memory_peak_human", "unknown"),
                "connected_clients": clients.get("connected_clients", 0),
                "keyspace": keyspace,
            }
        except Exception as exc:
            logger.warning("Cache stats error: %s", exc)
            return {"error": str(exc)}


cache_service = CacheService()