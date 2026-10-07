# backend/app/api/marine.py
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import LocationParams, get_db
from app.core.exceptions import ServiceUnavailableException
from app.schemas.common import DataResponse
from app.services.cache_service import CacheKeyBuilder, cache_service

router = APIRouter(prefix="/marine", tags=["Marine & Environmental"])


@router.get("/ocean", response_model=DataResponse[dict])
async def get_ocean_data(
    loc: LocationParams = Depends(),
    days: int = Query(3, ge=1, le=7),
    db=Depends(get_db),
):
    cache_key = CacheKeyBuilder.marine(loc.lat, loc.lon, days)
    cached = await cache_service.get(cache_key)
    if cached:
        return DataResponse(data=cached, message="Ocean data retrieved (cached)")

    from app.providers.provider_aggregator import ProviderAggregator
    result = await ProviderAggregator().fetch("marine", loc.lat, loc.lon, days=days)

    from app.config import get_settings
    await cache_service.set(cache_key, result, get_settings().CACHE_TTL_CURRENT)
    return DataResponse(data=result, message="Ocean data retrieved")


@router.get("/tides", response_model=DataResponse[dict])
async def get_tides(
    loc: LocationParams = Depends(),
    dt: date | None = Query(None),
    db=Depends(get_db),
):
    target_date = dt or date.today()
    from app.providers.provider_aggregator import ProviderAggregator
    marine_data = await ProviderAggregator().fetch("marine", loc.lat, loc.lon, days=1)

    tides = [
        {"datetime_utc": entry.get("datetime_utc"), "height_m": entry.get("tide_height_m"), "type": entry.get("tide_type")}
        for entry in marine_data.get("data", [])
        if entry.get("tide_type")
    ]

    return DataResponse(
        data={
            "latitude": loc.lat, "longitude": loc.lon, "date": target_date.isoformat(),
            "tides": tides, "provider": marine_data.get("provider", "aggregated"),
        },
        message="Tide data retrieved",
    )


@router.get("/agriculture", response_model=DataResponse[dict])
async def get_agriculture_data(
    loc: LocationParams = Depends(),
    db=Depends(get_db),
):
    from app.providers.copernicus import CopernicusProvider

    copernicus = CopernicusProvider()
    if not copernicus.is_configured:
        raise ServiceUnavailableException("copernicus", "Agriculture data requires COPERNICUS_API_KEY")

    agri_data = await copernicus.get_agriculture_data(loc.lat, loc.lon)

    from app.services.weather_service import WeatherService
    service = WeatherService(db)
    try:
        current = await service.get_current_weather(loc.lat, loc.lon)
        agri_data["current_conditions"] = {
            "temperature_c": current.temperature_c, "humidity": current.humidity,
            "wind_speed_ms": current.wind.speed_ms if current.wind else None,
            "precipitation_probability": current.precipitation.probability if current.precipitation else None,
        }
    except Exception:
        agri_data["current_conditions"] = None

    return DataResponse(data=agri_data, message="Agriculture data retrieved")


@router.get("/environmental", response_model=DataResponse[dict])
async def get_environmental_data(
    loc: LocationParams = Depends(),
    db=Depends(get_db),
):
    from app.providers.copernicus import CopernicusProvider

    copernicus = CopernicusProvider()
    if not copernicus.is_configured:
        raise ServiceUnavailableException("copernicus", "Environmental data requires COPERNICUS_API_KEY")

    env_data = await copernicus.get_environmental_data(loc.lat, loc.lon)

    from app.services.weather_service import WeatherService
    service = WeatherService(db)
    try:
        aqi = await service.get_air_quality(loc.lat, loc.lon)
        env_data["air_quality"] = {"aqi": aqi.aqi, "category": aqi.aqi_category, "dominant_pollutant": aqi.dominant_pollutant}
    except Exception:
        env_data["air_quality"] = None

    return DataResponse(data=env_data, message="Environmental data retrieved")