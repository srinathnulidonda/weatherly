# backend/app/api/weather.py
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import LocationParams, PaginationParams, get_db
from app.schemas.alert import AlertListData
from app.schemas.common import DataResponse, LocationSource, PrecisionLevel
from app.schemas.weather import (
    AirQualityResponse,
    CurrentWeatherResponse,
    ForecastResponse,
    HistoryResponse,
    WeatherMapResponse,
)
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current", response_model=DataResponse[CurrentWeatherResponse])
async def get_current_weather(
    loc: LocationParams = Depends(),
    units: str = Query("metric", pattern=r"^(metric|imperial|standard)$"),
    source: LocationSource = Query(LocationSource.MANUAL),
    precision: PrecisionLevel = Query(PrecisionLevel.MEDIUM),
    db: AsyncSession = Depends(get_db),
):
    service = WeatherService(db)
    result = await service.get_current_weather(loc.lat, loc.lon, units, source, precision)
    return DataResponse(data=result, message="Current weather retrieved")


@router.get("/forecast", response_model=DataResponse[ForecastResponse])
async def get_forecast(
    loc: LocationParams = Depends(),
    days: int = Query(7, ge=1, le=16),
    units: str = Query("metric", pattern=r"^(metric|imperial|standard)$"),
    hourly: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    service = WeatherService(db)
    result = await service.get_forecast(loc.lat, loc.lon, days, units, hourly)
    return DataResponse(data=result, message="Forecast retrieved")


@router.get("/history", response_model=DataResponse[HistoryResponse])
async def get_history(
    loc: LocationParams = Depends(),
    start_date: date = Query(...),
    end_date: date = Query(...),
    units: str = Query("metric", pattern=r"^(metric|imperial|standard)$"),
    db: AsyncSession = Depends(get_db),
):
    service = WeatherService(db)
    result = await service.get_history(loc.lat, loc.lon, start_date, end_date, units)
    return DataResponse(data=result, message="Historical weather retrieved")


@router.get("/alerts", response_model=DataResponse[AlertListData])
async def get_alerts(
    loc: LocationParams = Depends(),
    radius_km: float = Query(50.0, gt=0, le=500),
    severity: str | None = Query(None),
    active_only: bool = Query(True),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
):
    from app.services.alert_service import AlertService

    severity_list = [s.strip() for s in severity.split(",")] if severity else None
    service = AlertService(db)
    alerts, meta = await service.get_alerts_for_location(
        loc.lat, loc.lon, radius_km, severity_list, active_only, pagination.page, pagination.size,
    )
    return DataResponse(data=AlertListData(alerts=alerts, pagination=meta), message="Weather alerts retrieved")


@router.get("/air-quality", response_model=DataResponse[AirQualityResponse])
async def get_air_quality(
    loc: LocationParams = Depends(),
    db: AsyncSession = Depends(get_db),
):
    service = WeatherService(db)
    result = await service.get_air_quality(loc.lat, loc.lon)
    return DataResponse(data=result, message="Air quality data retrieved")


@router.get("/maps", response_model=DataResponse[WeatherMapResponse])
async def get_weather_map(
    loc: LocationParams = Depends(),
    layer: str = Query("temp", pattern=r"^(temp|precipitation|clouds|wind|pressure)$"),
    zoom: int = Query(5, ge=1, le=18),
    db: AsyncSession = Depends(get_db),
):
    service = WeatherService(db)
    result = await service.get_weather_map(loc.lat, loc.lon, layer, zoom)
    return DataResponse(data=result, message="Weather map tile URL generated")


@router.get("/astronomy", response_model=DataResponse[dict])
async def get_astronomy(
    loc: LocationParams = Depends(),
    dt: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    from app.providers.provider_aggregator import get_provider_aggregator

    target_date = dt or date.today()
    result = await get_provider_aggregator().fetch("astronomy", loc.lat, loc.lon, date_str=target_date.isoformat())
    return DataResponse(data=result, message="Astronomy data retrieved")