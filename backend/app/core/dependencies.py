# backend/app/core/dependencies.py
from typing import AsyncGenerator

from fastapi import HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import DatabaseManager


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
    if api_key != settings.API_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key")
    return api_key