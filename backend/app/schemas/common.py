# backend/app/schemas/common.py
from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class LocationSource(StrEnum):
    GPS = "gps"
    BROWSER = "browser"
    IP = "ip"
    MANUAL = "manual"
    SAVED = "saved"


class PrecisionLevel(StrEnum):
    EXACT = "exact"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    APPROXIMATE = "approximate"


class BaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool = True
    message: str | None = None
    timestamp: datetime = Field(default_factory=_utcnow)


class DataResponse(BaseResponse, Generic[T]):
    data: T


class PaginationMeta(BaseModel):
    page: int = Field(ge=1)
    size: int = Field(ge=1)
    total_items: int = Field(ge=0)
    total_pages: int = Field(ge=0)
    has_next: bool = False
    has_previous: bool = False

    @classmethod
    def create(cls, page: int, size: int, total_items: int) -> PaginationMeta:
        total_pages = max((total_items + size - 1) // size, 1)
        return cls(
            page=page,
            size=size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        )


class CoordinatesSchema(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class LocationContext(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    source: LocationSource = LocationSource.MANUAL
    precision: PrecisionLevel = PrecisionLevel.MEDIUM
    city: str | None = None
    state: str | None = None
    country: str | None = None
    country_code: str | None = None
    timezone: str | None = None