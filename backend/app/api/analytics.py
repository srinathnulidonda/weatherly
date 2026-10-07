# backend/app/api/analytics.py
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import LocationParams, get_db
from app.schemas.common import DataResponse
from app.schemas.weather import (
    WeatherCompareRequest,
    WeatherCompareResponse,
    WeatherIndexResponse,
    WeatherInsightsResponse,
    WeatherTrendResponse,
)
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/trends", response_model=DataResponse[WeatherTrendResponse])
async def get_weather_trends(
    loc: LocationParams = Depends(),
    hours: int = Query(24, ge=1, le=168),
    db=Depends(get_db),
):
    service = WeatherService(db)
    result = await service.get_trends(loc.lat, loc.lon, hours)
    return DataResponse(data=result, message="Weather trends retrieved")


@router.post("/compare", response_model=DataResponse[WeatherCompareResponse])
async def compare_weather(
    data: WeatherCompareRequest,
    db=Depends(get_db),
):
    service = WeatherService(db)
    locs = [{"latitude": loc.latitude, "longitude": loc.longitude} for loc in data.locations]
    result = await service.compare_weather(locs, data.units)
    return DataResponse(data=result, message="Weather comparison complete")


@router.get("/indices", response_model=DataResponse[WeatherIndexResponse])
async def get_weather_indices(
    loc: LocationParams = Depends(),
    db=Depends(get_db),
):
    service = WeatherService(db)
    result = await service.get_weather_indices(loc.lat, loc.lon)
    return DataResponse(data=result, message="Weather indices retrieved")


@router.get("/insights", response_model=DataResponse[WeatherInsightsResponse])
async def get_weather_insights(
    loc: LocationParams = Depends(),
    db=Depends(get_db),
):
    service = WeatherService(db)
    result = await service.get_insights(loc.lat, loc.lon)
    return DataResponse(data=result, message="Weather insights generated")


@router.get("/alert-stats", response_model=DataResponse[dict])
async def get_alert_statistics(
    loc: LocationParams = Depends(),
    radius_km: float = Query(100.0, gt=0, le=500),
    db=Depends(get_db),
):
    from app.services.alert_service import AlertService

    service = AlertService(db)
    stats = await service.get_alert_stats(loc.lat, loc.lon, radius_km)
    return DataResponse(data=stats.model_dump(), message="Alert statistics retrieved")