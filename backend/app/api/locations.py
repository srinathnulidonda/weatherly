# backend/app/api/locations.py
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.core.dependencies import get_db
from app.schemas.common import DataResponse
from app.schemas.location import (
    AutoDetectRequest,
    AutoDetectResponse,
    GeocodingResult,
    IPLocationResponse,
    LocationResponse,
    LocationSummary,
)
from app.services.location_service import LocationService
from app.utils import get_client_identifier

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.post("/detect", response_model=DataResponse[AutoDetectResponse])
async def auto_detect_location(
    data: AutoDetectRequest,
    request: Request,
    require_precise: bool = Query(
        False,
        description=(
            "When true, reject IP-only detection and require GPS/browser "
            "coordinates or a fallback_city for accurate results."
        ),
    ),
    db=Depends(get_db),
):
    client_ip = await get_client_identifier(request)
    service = LocationService(db)
    result = await service.auto_detect_location(data, client_ip, require_precise)

    if result.is_precise:
        msg = (
            f"Location detected via {result.detection_method} — precise "
            f"({result.city or result.formatted_address})"
        )
    elif result.detection_method == "manual_city":
        msg = (
            f"Location set to {result.city or 'provided city'} "
            f"(city center coordinates). Confidence: {result.confidence:.0%}"
        )
    else:
        msg = (
            f"Location detected via {result.detection_method} — APPROXIMATE. "
            f"Showing weather for {result.city or 'unknown city'} "
            f"(confidence: {result.confidence:.0%}). "
            f"This may NOT be your actual city — IP geolocation resolves "
            f"to your ISP's regional hub. "
            f"For your exact location: send gps_latitude/gps_longitude, "
            f"or browser_latitude/browser_longitude, "
            f"or fallback_city='YourActualCity'."
        )

    return DataResponse(data=result, message=msg)


@router.get("/detect/ip", response_model=DataResponse[IPLocationResponse])
async def detect_location_ip_only(
    request: Request,
    ip: str | None = Query(None),
    db=Depends(get_db),
):
    ip_address = ip or await get_client_identifier(request)
    service = LocationService(db)
    result = await service.detect_location_from_ip(ip_address)
    return DataResponse(
        data=result,
        message=(
            f"IP-based location: {result.city or 'unknown'}. "
            f"APPROXIMATE (~{result.accuracy_km or '?'} km accuracy). "
            f"This city may differ from your physical location because "
            f"IP geolocation resolves to your ISP's hub. "
            f"Use GPS/browser geolocation or send fallback_city for "
            f"precise results."
        ),
    )


@router.get("/search", response_model=DataResponse[list[GeocodingResult]])
async def search_locations(
    q: str = Query(..., min_length=2, max_length=200),
    limit: int = Query(5, ge=1, le=20),
    country_code: str | None = Query(None, max_length=3),
    db=Depends(get_db),
):
    service = LocationService(db)
    results = await service.search_locations(q, limit, country_code)
    return DataResponse(data=results, message=f"Found {len(results)} locations")


@router.get("/reverse-geocode", response_model=DataResponse[GeocodingResult])
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    db=Depends(get_db),
):
    service = LocationService(db)
    result = await service.reverse_geocode(lat, lon)
    return DataResponse(data=result, message="Reverse geocoding complete")


@router.get("/nearby", response_model=DataResponse[list[LocationSummary]])
async def find_nearby_locations(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(50.0, gt=0, le=500),
    limit: int = Query(10, ge=1, le=50),
    db=Depends(get_db),
):
    service = LocationService(db)
    results = await service.find_nearby(lat, lon, radius_km, limit)
    return DataResponse(data=results, message=f"Found {len(results)} nearby locations")


@router.get("/{location_id}", response_model=DataResponse[LocationResponse])
async def get_location(
    location_id: UUID,
    db=Depends(get_db),
):
    service = LocationService(db)
    result = await service.get_location_by_id(location_id)
    return DataResponse(data=result, message="Location retrieved")