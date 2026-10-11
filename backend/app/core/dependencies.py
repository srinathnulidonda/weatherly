# backend/app/core/dependencies.py
import hmac
import logging
from typing import AsyncGenerator

from fastapi import HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.exceptions import RateLimitExceededException
from app.database import DatabaseManager, RedisManager
from app.utils.rate_limit import check_rate_limit, get_client_identifier

logger = logging.getLogger("weatherly.dependencies")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with DatabaseManager.session() as session:
        yield session


class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        size: int = Query(20, ge=1, le=100, description="Items per page"),
    ) -> None:
        self.page = page
        self.size = size
        self.offset = (page - 1) * size
        self.limit = size


class LocationParams:
    def __init__(
        self,
        lat: float = Query(..., ge=-90, le=90, description="Latitude"),
        lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    ) -> None:
        self.lat = lat
        self.lon = lon


async def get_api_key(request: Request) -> str | None:
    settings = get_settings()
    if not settings.API_KEY:
        return None

    api_key = request.headers.get("X-API-KEY")
    if not api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing API key")
    if not hmac.compare_digest(api_key, settings.API_KEY):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key")
    return api_key


async def app_update_rate_limit(request: Request) -> None:
    settings = get_settings()
    limit = settings.APP_UPDATE_RATE_LIMIT_PER_MINUTE
    if limit <= 0:
        return
    try:
        redis = RedisManager.get_client()
    except RuntimeError:
        return
    identifier = await get_client_identifier(request)
    try:
        allowed, _, ttl = await check_rate_limit(
            redis_client=redis,
            identifier=identifier,
            key_suffix="app_update",
            limit=limit,
            window_seconds=60,
        )
    except Exception as exc:
        logger.warning("App update rate limit skipped: %s", exc)
        return
    if not allowed:
        raise RateLimitExceededException(retry_after=max(ttl, 1))