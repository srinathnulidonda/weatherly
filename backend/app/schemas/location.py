# backend/app/schemas/location.py
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import LocationSource, PrecisionLevel


class AutoDetectRequest(BaseModel):
    gps_latitude: float | None = Field(None, ge=-90, le=90)
    gps_longitude: float | None = Field(None, ge=-180, le=180)
    gps_accuracy_m: float | None = Field(None, ge=0)
    gps_altitude_m: float | None = Field(None)

    browser_latitude: float | None = Field(None, ge=-90, le=90)
    browser_longitude: float | None = Field(None, ge=-180, le=180)
    browser_accuracy_m: float | None = Field(None, ge=0)

    ip_address: str | None = Field(None)

    timezone_hint: str | None = Field(
        None,
        description=(
            "Browser timezone from Intl.DateTimeFormat().resolvedOptions().timeZone. "
            "Helps validate and correct IP-based detection."
        ),
    )

    fallback_city: str | None = Field(
        None,
        max_length=200,
        description=(
            "If the user rejects the auto-detected city, they can type their "
            "actual city name here. The backend will geocode it for accurate results."
        ),
    )
    fallback_country_code: str | None = Field(None, max_length=3)


class AutoDetectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    latitude: float
    longitude: float
    accuracy_m: float | None = None
    altitude_m: float | None = None

    source: LocationSource
    precision: PrecisionLevel
    confidence: float = Field(ge=0, le=1)
    is_precise: bool = Field(
        default=False,
        description=(
            "True only when location was obtained via GPS or browser geolocation. "
            "False for IP-based detection — weather data may not match your exact location."
        ),
    )
    detection_method: str
    detection_details: dict | None = None

    city: str | None = None
    state: str | None = None
    country: str | None = None
    country_code: str | None = None
    formatted_address: str | None = None
    neighborhood: str | None = None
    postal_code: str | None = None
    timezone: str | None = None
    elevation_m: float | None = None
    reverse_geocode_provider: str | None = None

    ip_address: str | None = None
    isp: str | None = None


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    latitude: float
    longitude: float
    country: str | None
    country_code: str | None
    state: str | None
    city: str | None
    timezone: str | None
    source: str
    precision_level: str | None
    search_count: int
    created_at: datetime
    updated_at: datetime


class LocationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    latitude: float
    longitude: float
    country: str | None
    country_code: str | None
    state: str | None
    city: str | None


class GeocodingResult(BaseModel):
    name: str
    latitude: float
    longitude: float
    country: str | None = None
    country_code: str | None = None
    state: str | None = None
    city: str | None = None
    formatted_address: str | None = None
    source: LocationSource = LocationSource.MANUAL
    precision: PrecisionLevel = PrecisionLevel.MEDIUM
    confidence: float | None = None


class IPLocationResponse(BaseModel):
    latitude: float
    longitude: float
    city: str | None = None
    region: str | None = None
    country: str | None = None
    country_code: str | None = None
    timezone: str | None = None
    source: LocationSource = LocationSource.IP
    precision: PrecisionLevel = PrecisionLevel.APPROXIMATE
    accuracy_km: float | None = None
    confidence: float | None = None
    cross_validated: bool = False
    providers_queried: int | None = None
    providers_agreed: int | None = None