# backend/app/schemas/weather.py
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.common import CoordinatesSchema, LocationContext


class WeatherCondition(BaseModel):
    code: int | None = None
    main: str | None = None
    description: str | None = None
    icon: str | None = None


class WindData(BaseModel):
    speed_ms: float | None = None
    direction_deg: float | None = None
    gust_ms: float | None = None
    direction_label: str | None = None
    beaufort: int | None = None


class PrecipitationData(BaseModel):
    rain_1h_mm: float | None = None
    rain_3h_mm: float | None = None
    snow_1h_mm: float | None = None
    snow_3h_mm: float | None = None
    probability: float | None = None


class AstronomyData(BaseModel):
    sunrise: str | None = None
    sunset: str | None = None
    moonrise: str | None = None
    moonset: str | None = None
    moon_phase: float | None = None
    day_length_hours: float | None = None


class CurrentWeatherResponse(BaseModel):
    location: LocationContext
    provider: str
    observed_at: datetime

    temperature_c: float | None = None
    feels_like_c: float | None = None
    temp_min_c: float | None = None
    temp_max_c: float | None = None
    dew_point_c: float | None = None

    humidity: float | None = None
    humidity_comfort: str | None = None
    pressure_hpa: float | None = None

    wind: WindData | None = None
    precipitation: PrecipitationData | None = None
    condition: WeatherCondition | None = None
    astronomy: AstronomyData | None = None

    clouds_pct: float | None = None
    cloud_description: str | None = None
    visibility_m: float | None = None
    visibility_category: str | None = None
    uv_index: float | None = None
    uv_category: str | None = None

    data_quality: dict | None = None


class HourlyForecast(BaseModel):
    datetime_utc: datetime | str
    temperature_c: float | None = None
    feels_like_c: float | None = None
    humidity: float | None = None
    pressure_hpa: float | None = None
    wind: WindData | None = None
    precipitation: PrecipitationData | None = None
    condition: WeatherCondition | None = None
    clouds_pct: float | None = None
    visibility_m: float | None = None
    uv_index: float | None = None


class DailyForecast(BaseModel):
    date: date | str
    temp_min_c: float | None = None
    temp_max_c: float | None = None
    temp_avg_c: float | None = None
    feels_like_day_c: float | None = None
    feels_like_night_c: float | None = None
    humidity_avg: float | None = None
    pressure_hpa: float | None = None
    wind: WindData | None = None
    precipitation: PrecipitationData | None = None
    condition: WeatherCondition | None = None
    clouds_pct: float | None = None
    uv_index: float | None = None
    astronomy: AstronomyData | None = None
    hourly: list[HourlyForecast] | None = None


class ForecastResponse(BaseModel):
    location: LocationContext
    provider: str
    generated_at: datetime
    days: list[DailyForecast]


class HistoricalWeatherDay(BaseModel):
    date: date | str
    temp_min_c: float | None = None
    temp_max_c: float | None = None
    temp_avg_c: float | None = None
    humidity_avg: float | None = None
    pressure_avg_hpa: float | None = None
    wind_speed_avg_ms: float | None = None
    precipitation_total_mm: float | None = None
    condition: WeatherCondition | None = None


class HistoryResponse(BaseModel):
    location: LocationContext
    provider: str
    start_date: date
    end_date: date
    data: list[HistoricalWeatherDay]


class AirQualityResponse(BaseModel):
    location: LocationContext
    provider: str
    observed_at: datetime
    aqi: int
    aqi_category: str | None = None
    dominant_pollutant: str | None = None
    pm2_5: float | None = None
    pm10: float | None = None
    o3: float | None = None
    no2: float | None = None
    so2: float | None = None
    co: float | None = None
    nh3: float | None = None


class WeatherMapResponse(BaseModel):
    tile_url: str
    layer: str
    attribution: str | None = None


class WeatherCompareRequest(BaseModel):
    locations: list[CoordinatesSchema] = Field(min_length=2, max_length=5)
    units: str = Field(default="metric", pattern=r"^(metric|imperial|standard)$")


class WeatherCompareItem(BaseModel):
    location: LocationContext
    current: CurrentWeatherResponse | None = None


class WeatherCompareResponse(BaseModel):
    comparisons: list[WeatherCompareItem]
    generated_at: datetime


class WeatherIndexResponse(BaseModel):
    location: LocationContext
    observed_at: datetime
    comfort_index: float | None = None
    outdoor_activity_index: float | None = None
    running_index: float | None = None
    cycling_index: float | None = None
    gardening_index: float | None = None
    allergy_index: float | None = None
    driving_index: float | None = None
    uv_protection_needed: bool | None = None
    details: dict | None = None


class WeatherTrendPoint(BaseModel):
    datetime_utc: datetime | str
    temperature_c: float | None = None
    humidity: float | None = None
    pressure_hpa: float | None = None
    wind_speed_ms: float | None = None


class WeatherTrendResponse(BaseModel):
    location: LocationContext
    period_hours: int
    data_points: list[WeatherTrendPoint]
    trends: dict | None = None


class WeatherInsight(BaseModel):
    category: str
    title: str
    description: str
    severity: str | None = None
    recommendation: str | None = None


class WeatherInsightsResponse(BaseModel):
    location: LocationContext
    generated_at: datetime
    insights: list[WeatherInsight]