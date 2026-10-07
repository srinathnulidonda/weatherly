# backend/app/services/weather_service.py
import hashlib
import logging
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.exceptions import ProviderException, ServiceUnavailableException
from app.schemas.common import LocationContext, LocationSource, PrecisionLevel
from app.schemas.weather import (
    AirQualityResponse, AstronomyData, CurrentWeatherResponse, DailyForecast,
    ForecastResponse, HistoricalWeatherDay, HistoryResponse, HourlyForecast,
    PrecipitationData, WeatherCompareItem, WeatherCompareResponse, WeatherCondition,
    WeatherIndexResponse, WeatherInsight, WeatherInsightsResponse, WeatherMapResponse,
    WeatherTrendPoint, WeatherTrendResponse, WindData,
)
from app.services.cache_service import CacheKeyBuilder, cache_service
from app.utils import ensure_datetime, validate_coordinate_pair, validate_date_range, validate_unit_system
from app.utils.units import (
    DistanceUnit, PrecipitationUnit, PressureUnit, SpeedUnit, TemperatureUnit,
    aqi_category_us, beaufort_scale, calculate_us_aqi_from_pm25, cloud_cover_description,
    convert_distance, convert_precipitation, convert_pressure, convert_speed, convert_temperature,
    dew_point, feels_like, humidity_comfort, uv_index_category, visibility_category, wind_direction_label,
)

logger = logging.getLogger("weatherly.weather_service")


class WeatherService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._cache = cache_service
        self._settings = get_settings()

    @staticmethod
    def _safe_float(value: Any) -> float | None:
        try:
            return float(value) if value is not None else None
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _safe_int(value: Any) -> int | None:
        try:
            return int(value) if value is not None else None
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _safe_astronomy(raw: dict[str, Any] | None) -> AstronomyData | None:
        if not raw:
            return None
        try:
            return AstronomyData(**raw)
        except Exception:
            return None

    @staticmethod
    def _unit_targets(units: str):
        if units == "imperial":
            return TemperatureUnit.FAHRENHEIT, SpeedUnit.MPH, PressureUnit.INHG, DistanceUnit.MI, PrecipitationUnit.IN
        if units == "standard":
            return TemperatureUnit.KELVIN, SpeedUnit.MS, PressureUnit.HPA, DistanceUnit.M, PrecipitationUnit.MM
        return None, None, None, None, None

    @staticmethod
    def _conv_temp(v, to_unit):
        return convert_temperature(v, TemperatureUnit.CELSIUS, to_unit) if v is not None and to_unit else v

    @staticmethod
    def _conv_speed(v, to_unit):
        return convert_speed(v, SpeedUnit.MS, to_unit) if v is not None and to_unit else v

    @staticmethod
    def _conv_pressure(v, to_unit):
        return convert_pressure(v, PressureUnit.HPA, to_unit) if v is not None and to_unit else v

    @staticmethod
    def _conv_distance(v, to_unit):
        return convert_distance(v, DistanceUnit.M, to_unit) if v is not None and to_unit else v

    @staticmethod
    def _conv_precip(v, to_unit):
        return convert_precipitation(v, PrecipitationUnit.MM, to_unit) if v is not None and to_unit else v

    def _convert_response_units(self, response: CurrentWeatherResponse, units: str) -> CurrentWeatherResponse:
        to_temp, to_speed, to_pressure, to_distance, to_precip = self._unit_targets(units)
        if to_temp is None:
            return response

        response.temperature_c = self._conv_temp(response.temperature_c, to_temp)
        response.feels_like_c = self._conv_temp(response.feels_like_c, to_temp)
        response.temp_min_c = self._conv_temp(response.temp_min_c, to_temp)
        response.temp_max_c = self._conv_temp(response.temp_max_c, to_temp)
        response.dew_point_c = self._conv_temp(response.dew_point_c, to_temp)
        response.pressure_hpa = self._conv_pressure(response.pressure_hpa, to_pressure)
        response.visibility_m = self._conv_distance(response.visibility_m, to_distance)

        if response.wind:
            response.wind.speed_ms = self._conv_speed(response.wind.speed_ms, to_speed)
            response.wind.gust_ms = self._conv_speed(response.wind.gust_ms, to_speed)
        if response.precipitation:
            response.precipitation.rain_1h_mm = self._conv_precip(response.precipitation.rain_1h_mm, to_precip)
            response.precipitation.rain_3h_mm = self._conv_precip(response.precipitation.rain_3h_mm, to_precip)
            response.precipitation.snow_1h_mm = self._conv_precip(response.precipitation.snow_1h_mm, to_precip)
            response.precipitation.snow_3h_mm = self._conv_precip(response.precipitation.snow_3h_mm, to_precip)
        return response

    def _convert_forecast_units(self, response: ForecastResponse, units: str) -> ForecastResponse:
        to_temp, to_speed, _, _, to_precip = self._unit_targets(units)
        if to_temp is None:
            return response
        for day in response.days:
            day.temp_min_c = self._conv_temp(day.temp_min_c, to_temp)
            day.temp_max_c = self._conv_temp(day.temp_max_c, to_temp)
            day.temp_avg_c = self._conv_temp(day.temp_avg_c, to_temp)
            day.feels_like_day_c = self._conv_temp(day.feels_like_day_c, to_temp)
            day.feels_like_night_c = self._conv_temp(day.feels_like_night_c, to_temp)
            if day.wind:
                day.wind.speed_ms = self._conv_speed(day.wind.speed_ms, to_speed)
                day.wind.gust_ms = self._conv_speed(day.wind.gust_ms, to_speed)
            if day.precipitation:
                day.precipitation.rain_1h_mm = self._conv_precip(day.precipitation.rain_1h_mm, to_precip)
                day.precipitation.snow_1h_mm = self._conv_precip(day.precipitation.snow_1h_mm, to_precip)
            for h in day.hourly or []:
                h.temperature_c = self._conv_temp(h.temperature_c, to_temp)
                h.feels_like_c = self._conv_temp(h.feels_like_c, to_temp)
                if h.wind:
                    h.wind.speed_ms = self._conv_speed(h.wind.speed_ms, to_speed)
                    h.wind.gust_ms = self._conv_speed(h.wind.gust_ms, to_speed)
                if h.precipitation:
                    h.precipitation.rain_1h_mm = self._conv_precip(h.precipitation.rain_1h_mm, to_precip)
                    h.precipitation.snow_1h_mm = self._conv_precip(h.precipitation.snow_1h_mm, to_precip)
        return response

    def _convert_history_units(self, response: HistoryResponse, units: str) -> HistoryResponse:
        to_temp, to_speed, _, _, _ = self._unit_targets(units)
        if to_temp is None:
            return response
        for d in response.data:
            d.temp_min_c = self._conv_temp(d.temp_min_c, to_temp)
            d.temp_max_c = self._conv_temp(d.temp_max_c, to_temp)
            d.temp_avg_c = self._conv_temp(d.temp_avg_c, to_temp)
            d.wind_speed_avg_ms = self._conv_speed(d.wind_speed_avg_ms, to_speed)
        return response

    async def get_current_weather(
        self, lat: float, lon: float, units: str = "metric",
        source: LocationSource = LocationSource.MANUAL, precision: PrecisionLevel = PrecisionLevel.MEDIUM,
    ) -> CurrentWeatherResponse:
        lat, lon = validate_coordinate_pair(lat, lon)
        validate_unit_system(units)

        cache_key = CacheKeyBuilder.current_weather(lat, lon, "metric")
        cached_dict = await self._cache.get_or_set(
            cache_key, lambda: self._build_current_weather_response(lat, lon, source, precision),
            self._settings.CACHE_TTL_CURRENT,
        )
        if cached_dict is None:
            raise ServiceUnavailableException("weather_providers", "Failed to get current weather")

        result = CurrentWeatherResponse(**cached_dict)
        loc = result.location
        result.location = LocationContext(
            latitude=loc.latitude, longitude=loc.longitude, source=source, precision=precision,
            city=loc.city, state=loc.state, country=loc.country, country_code=loc.country_code, timezone=loc.timezone,
        )
        return self._convert_response_units(result, units) if units != "metric" else result

    async def _build_current_weather_response(self, lat: float, lon: float, source: LocationSource, precision: PrecisionLevel) -> dict[str, Any]:
        data = await self._fetch_from_aggregator("current", lat, lon, units="metric")
        location_ctx = await self._build_location_context(lat, lon, source, precision)

        wind_data = None
        if data.get("wind_speed_ms") is not None or data.get("wind_deg") is not None:
            wind_speed = self._safe_float(data.get("wind_speed_ms"))
            wind_data = WindData(
                speed_ms=wind_speed, direction_deg=self._safe_float(data.get("wind_deg")),
                gust_ms=self._safe_float(data.get("wind_gust_ms")),
                direction_label=wind_direction_label(data["wind_deg"]) if data.get("wind_deg") is not None else None,
                beaufort=beaufort_scale(wind_speed) if wind_speed is not None else None,
            )

        precip_data = PrecipitationData(
            rain_1h_mm=self._safe_float(data.get("rain_1h_mm")), rain_3h_mm=self._safe_float(data.get("rain_3h_mm")),
            snow_1h_mm=self._safe_float(data.get("snow_1h_mm")), snow_3h_mm=self._safe_float(data.get("snow_3h_mm")),
            probability=self._safe_float(data.get("precipitation_probability")),
        )

        condition = WeatherCondition(
            code=self._safe_int(data.get("condition_code")), main=data.get("condition_main"),
            description=data.get("condition_description"), icon=data.get("condition_icon"),
        )

        astronomy = AstronomyData(
            sunrise=data.get("sunrise"), sunset=data.get("sunset"),
            moonrise=data.get("moonrise"), moonset=data.get("moonset"), moon_phase=self._safe_float(data.get("moon_phase")),
        )

        temp_c = self._safe_float(data.get("temperature_c"))
        hum = self._safe_float(data.get("humidity"))
        vis_m = self._safe_float(data.get("visibility_m"))
        uv = self._safe_float(data.get("uv_index"))
        clouds = self._safe_float(data.get("clouds_pct"))

        computed_feels_like = self._safe_float(data.get("feels_like_c"))
        if computed_feels_like is None and temp_c is not None and hum is not None:
            computed_feels_like = feels_like(temp_c, hum, self._safe_float(data.get("wind_speed_ms")) or 0.0)

        computed_dew = self._safe_float(data.get("dew_point_c"))
        if computed_dew is None and temp_c is not None and hum is not None:
            computed_dew = dew_point(temp_c, hum)

        observed_at_dt = ensure_datetime(data.get("observed_at")) or datetime.now(timezone.utc)

        response = CurrentWeatherResponse(
            location=location_ctx, provider=data.get("provider", "aggregated"), observed_at=observed_at_dt,
            temperature_c=temp_c, feels_like_c=computed_feels_like,
            temp_min_c=self._safe_float(data.get("temp_min_c")), temp_max_c=self._safe_float(data.get("temp_max_c")),
            dew_point_c=computed_dew, humidity=hum, humidity_comfort=humidity_comfort(hum) if hum is not None else None,
            pressure_hpa=self._safe_float(data.get("pressure_hpa")), wind=wind_data, precipitation=precip_data,
            condition=condition, astronomy=astronomy, clouds_pct=clouds,
            cloud_description=cloud_cover_description(clouds) if clouds is not None else None,
            visibility_m=vis_m, visibility_category=visibility_category(vis_m / 1000.0) if vis_m is not None else None,
            uv_index=uv, uv_category=uv_index_category(uv) if uv is not None else None, data_quality=data.get("data_quality"),
        )
        return response.model_dump(mode="json")

    async def get_forecast(self, lat: float, lon: float, days: int = 7, units: str = "metric", hourly: bool = False) -> ForecastResponse:
        lat, lon = validate_coordinate_pair(lat, lon)
        validate_unit_system(units)

        cache_key = CacheKeyBuilder.forecast(lat, lon, days, units, hourly)
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return ForecastResponse(**cached)

        response_dict = await self._build_forecast_response(lat, lon, days, units, hourly)
        returned_days = len(response_dict.get("days", []))
        ttl = self._settings.CACHE_TTL_FORECAST if returned_days >= min(days, 3) else 120
        await self._cache.set(cache_key, response_dict, ttl)
        return ForecastResponse(**response_dict)

    async def _build_forecast_response(self, lat: float, lon: float, days: int, units: str, hourly: bool) -> dict[str, Any]:
        data = await self._fetch_from_aggregator("forecast", lat, lon, units=units, days=days, hourly=hourly)
        location_ctx = await self._build_location_context(lat, lon)
        daily_list: list[DailyForecast] = []

        for day_data in data.get("days", []):
            hourly_items = None
            if hourly and day_data.get("hourly"):
                hourly_items = [
                    HourlyForecast(
                        datetime_utc=h.get("datetime_utc"), temperature_c=self._safe_float(h.get("temperature_c")),
                        feels_like_c=self._safe_float(h.get("feels_like_c")), humidity=self._safe_float(h.get("humidity")),
                        pressure_hpa=self._safe_float(h.get("pressure_hpa")),
                        wind=WindData(**h["wind"]) if h.get("wind") else None,
                        precipitation=PrecipitationData(**h["precipitation"]) if h.get("precipitation") else None,
                        condition=WeatherCondition(**h["condition"]) if h.get("condition") else None,
                        clouds_pct=self._safe_float(h.get("clouds_pct")), visibility_m=self._safe_float(h.get("visibility_m")),
                        uv_index=self._safe_float(h.get("uv_index")),
                    )
                    for h in day_data["hourly"]
                ]

            daily_list.append(DailyForecast(
                date=day_data.get("date"), temp_min_c=self._safe_float(day_data.get("temp_min_c")),
                temp_max_c=self._safe_float(day_data.get("temp_max_c")), temp_avg_c=self._safe_float(day_data.get("temp_avg_c")),
                feels_like_day_c=self._safe_float(day_data.get("feels_like_day_c")),
                feels_like_night_c=self._safe_float(day_data.get("feels_like_night_c")),
                humidity_avg=self._safe_float(day_data.get("humidity_avg")), pressure_hpa=self._safe_float(day_data.get("pressure_hpa")),
                wind=WindData(**day_data["wind"]) if day_data.get("wind") else None,
                precipitation=PrecipitationData(**day_data["precipitation"]) if day_data.get("precipitation") else None,
                condition=WeatherCondition(**day_data["condition"]) if day_data.get("condition") else None,
                clouds_pct=self._safe_float(day_data.get("clouds_pct")), uv_index=self._safe_float(day_data.get("uv_index")),
                astronomy=self._safe_astronomy(day_data.get("astronomy")), hourly=hourly_items,
            ))

        if not daily_list:
            raise ServiceUnavailableException("forecast", f"No forecast data available for ({lat}, {lon}).")

        response = ForecastResponse(location=location_ctx, provider=data.get("provider", "aggregated"), generated_at=datetime.now(timezone.utc), days=daily_list)
        if units != "metric":
            response = self._convert_forecast_units(response, units)
        return response.model_dump(mode="json")

    async def get_history(self, lat: float, lon: float, start_date: date, end_date: date, units: str = "metric") -> HistoryResponse:
        lat, lon = validate_coordinate_pair(lat, lon)
        validate_date_range(start_date, end_date, max_days=30)
        validate_unit_system(units)

        cache_key = CacheKeyBuilder.history(lat, lon, start_date.isoformat(), end_date.isoformat(), units)
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return HistoryResponse(**cached)

        data = await self._fetch_from_aggregator("history", lat, lon, units=units, start_date=start_date.isoformat(), end_date=end_date.isoformat())
        location_ctx = await self._build_location_context(lat, lon)

        history_days = [
            HistoricalWeatherDay(
                date=d.get("date"), temp_min_c=self._safe_float(d.get("temp_min_c")), temp_max_c=self._safe_float(d.get("temp_max_c")),
                temp_avg_c=self._safe_float(d.get("temp_avg_c")), humidity_avg=self._safe_float(d.get("humidity_avg")),
                pressure_avg_hpa=self._safe_float(d.get("pressure_avg_hpa")), wind_speed_avg_ms=self._safe_float(d.get("wind_speed_avg_ms")),
                precipitation_total_mm=self._safe_float(d.get("precipitation_total_mm")),
                condition=WeatherCondition(**d["condition"]) if d.get("condition") else None,
            )
            for d in data.get("data", [])
        ]

        response = HistoryResponse(location=location_ctx, provider=data.get("provider", "aggregated"), start_date=start_date, end_date=end_date, data=history_days)
        if units != "metric":
            response = self._convert_history_units(response, units)
        await self._cache.set(cache_key, response.model_dump(mode="json"), 3600)
        return response

    async def get_air_quality(self, lat: float, lon: float) -> AirQualityResponse:
        lat, lon = validate_coordinate_pair(lat, lon)
        cache_key = CacheKeyBuilder.air_quality(lat, lon)
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return AirQualityResponse(**cached)

        data = await self._fetch_from_aggregator("air_quality", lat, lon)
        location_ctx = await self._build_location_context(lat, lon)
        observed_at_dt = ensure_datetime(data.get("observed_at")) or datetime.now(timezone.utc)

        pm2_5 = self._safe_float(data.get("pm2_5"))
        aqi = self._safe_int(data.get("aqi"))
        aqi_category = data.get("aqi_category")
        if aqi is None and pm2_5 is not None:
            aqi = calculate_us_aqi_from_pm25(pm2_5)
            aqi_category = aqi_category_us(aqi)
        elif aqi is not None and not aqi_category:
            aqi_category = aqi_category_us(aqi)

        response = AirQualityResponse(
            location=location_ctx, provider=data.get("provider", "aggregated"), observed_at=observed_at_dt,
            aqi=aqi or 0, aqi_category=aqi_category, dominant_pollutant=data.get("dominant_pollutant"),
            pm2_5=pm2_5, pm10=self._safe_float(data.get("pm10")), o3=self._safe_float(data.get("o3")),
            no2=self._safe_float(data.get("no2")), so2=self._safe_float(data.get("so2")), co=self._safe_float(data.get("co")),
            nh3=self._safe_float(data.get("nh3")),
        )
        await self._cache.set(cache_key, response.model_dump(mode="json"), self._settings.CACHE_TTL_CURRENT)
        return response

    async def get_weather_map(self, lat: float, lon: float, layer: str, zoom: int) -> WeatherMapResponse:
        lat, lon = validate_coordinate_pair(lat, lon)
        cache_key = CacheKeyBuilder.weather_map(lat, lon, layer, zoom)
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return WeatherMapResponse(**cached)

        data = await self._fetch_from_aggregator("map", lat, lon, layer=layer, zoom=zoom)
        response = WeatherMapResponse(tile_url=data.get("tile_url", ""), layer=layer, attribution=data.get("attribution"))
        await self._cache.set(cache_key, response.model_dump(mode="json"), self._settings.CACHE_TTL_CURRENT)
        return response

    async def compare_weather(self, locations: list[dict[str, float]], units: str = "metric") -> WeatherCompareResponse:
        coords_str = "|".join(f"{loc['latitude']}:{loc['longitude']}" for loc in locations)
        coords_hash = hashlib.md5(coords_str.encode()).hexdigest()[:16]

        cache_key = CacheKeyBuilder.compare(coords_hash, units)
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return WeatherCompareResponse(**cached)

        items: list[WeatherCompareItem] = []
        for loc in locations:
            try:
                current = await self.get_current_weather(loc["latitude"], loc["longitude"], units)
                items.append(WeatherCompareItem(location=current.location, current=current))
            except Exception as exc:
                logger.warning("Compare fetch failed for (%s,%s): %s", loc["latitude"], loc["longitude"], exc)
                items.append(WeatherCompareItem(location=LocationContext(latitude=loc["latitude"], longitude=loc["longitude"]), current=None))

        response = WeatherCompareResponse(comparisons=items, generated_at=datetime.now(timezone.utc))
        await self._cache.set(cache_key, response.model_dump(mode="json"), self._settings.CACHE_TTL_CURRENT)
        return response

    async def get_weather_indices(self, lat: float, lon: float) -> WeatherIndexResponse:
        lat, lon = validate_coordinate_pair(lat, lon)
        cache_key = CacheKeyBuilder.indices(lat, lon)
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return WeatherIndexResponse(**cached)

        current = await self.get_current_weather(lat, lon)
        temp = current.temperature_c if current.temperature_c is not None else 20.0
        hum = current.humidity if current.humidity is not None else 50.0
        wind = current.wind.speed_ms if current.wind and current.wind.speed_ms is not None else 0.0
        uv = current.uv_index if current.uv_index is not None else 0.0
        precip_prob = current.precipitation.probability if current.precipitation and current.precipitation.probability is not None else 0.0

        comfort = self._compute_comfort_index(temp, hum, wind)
        outdoor = self._compute_outdoor_index(temp, hum, wind, precip_prob, uv)

        response = WeatherIndexResponse(
            location=current.location, observed_at=current.observed_at, comfort_index=comfort, outdoor_activity_index=outdoor,
            running_index=max(0, min(10, outdoor - (0.5 if wind > 10 else 0))),
            cycling_index=max(0, min(10, outdoor - (1.0 if wind > 8 else 0))),
            gardening_index=max(0, min(10, outdoor + (0.5 if hum > 40 else -0.5))),
            allergy_index=round(min(10, max(0, (hum / 20.0) + (temp / 10.0))), 1),
            driving_index=round(max(0, 10 - precip_prob / 10 - (1 if wind > 15 else 0)), 1),
            uv_protection_needed=uv >= 3,
            details={"temperature_c": temp, "humidity": hum, "wind_speed_ms": wind, "uv_index": uv, "precipitation_probability": precip_prob},
        )
        await self._cache.set(cache_key, response.model_dump(mode="json"), self._settings.CACHE_TTL_CURRENT)
        return response

    async def get_trends(self, lat: float, lon: float, hours: int = 24) -> WeatherTrendResponse:
        lat, lon = validate_coordinate_pair(lat, lon)
        cache_key = CacheKeyBuilder.trends(lat, lon, hours)
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return WeatherTrendResponse(**cached)

        data = await self._fetch_from_aggregator("trends", lat, lon, hours=hours)
        location_ctx = await self._build_location_context(lat, lon)
        points = [
            WeatherTrendPoint(
                datetime_utc=p.get("datetime_utc"), temperature_c=self._safe_float(p.get("temperature_c")),
                humidity=self._safe_float(p.get("humidity")), pressure_hpa=self._safe_float(p.get("pressure_hpa")),
                wind_speed_ms=self._safe_float(p.get("wind_speed_ms")),
            )
            for p in data.get("points", [])
        ]

        response = WeatherTrendResponse(location=location_ctx, period_hours=hours, data_points=points, trends=self._analyze_trends(points))
        await self._cache.set(cache_key, response.model_dump(mode="json"), self._settings.CACHE_TTL_CURRENT)
        return response

    async def get_insights(self, lat: float, lon: float) -> WeatherInsightsResponse:
        lat, lon = validate_coordinate_pair(lat, lon)
        current = await self.get_current_weather(lat, lon)
        insights: list[WeatherInsight] = []

        temp = current.temperature_c
        if temp is not None:
            if temp > 35:
                insights.append(WeatherInsight(category="temperature", title="Extreme Heat", description=f"Temperature is {temp}°C.", severity="severe", recommendation="Stay hydrated and avoid prolonged sun exposure."))
            elif temp < -10:
                insights.append(WeatherInsight(category="temperature", title="Extreme Cold", description=f"Temperature is {temp}°C.", severity="severe", recommendation="Dress in layers and limit time outdoors."))

        if current.uv_index and current.uv_index >= 8:
            insights.append(WeatherInsight(category="uv", title="Very High UV Index", description=f"UV index is {current.uv_index}.", severity="high", recommendation="Apply SPF 30+ sunscreen and wear protective clothing."))

        if current.wind and current.wind.speed_ms and current.wind.speed_ms > 17:
            insights.append(WeatherInsight(category="wind", title="High Winds", description=f"Wind speed is {current.wind.speed_ms} m/s.", severity="moderate", recommendation="Secure loose outdoor items."))

        if current.humidity and current.humidity > 85:
            insights.append(WeatherInsight(category="humidity", title="Very High Humidity", description=f"Humidity is {current.humidity}%.", severity="minor", recommendation="Stay in air-conditioned spaces when possible."))

        if current.visibility_m and current.visibility_m < 1000:
            insights.append(WeatherInsight(category="visibility", title="Low Visibility", description=f"Visibility is {current.visibility_m}m.", severity="moderate", recommendation="Drive with low-beam headlights and reduce speed."))

        if not insights:
            insights.append(WeatherInsight(category="general", title="Pleasant Conditions", description="Current weather conditions are generally favorable.", severity="none", recommendation="Enjoy the weather!"))

        return WeatherInsightsResponse(location=current.location, generated_at=datetime.now(timezone.utc), insights=insights)

    async def _fetch_from_aggregator(self, data_type: str, lat: float, lon: float, **kwargs: Any) -> dict[str, Any]:
        from app.providers.provider_aggregator import ProviderAggregator

        try:
            return await ProviderAggregator().fetch(data_type, lat, lon, **kwargs)
        except ProviderException:
            raise
        except Exception as exc:
            logger.error("Provider aggregator error: %s", exc, exc_info=True)
            raise ServiceUnavailableException("weather_providers", str(exc))

    async def _build_location_context(
        self, lat: float, lon: float, source: LocationSource = LocationSource.MANUAL, precision: PrecisionLevel = PrecisionLevel.MEDIUM,
    ) -> LocationContext:
        from app.services.location_service import LocationService

        try:
            geo = await LocationService(self._db).reverse_geocode(lat, lon)
            return LocationContext(
                latitude=lat, longitude=lon, source=source, precision=precision,
                city=geo.city, state=geo.state, country=geo.country, country_code=geo.country_code,
            )
        except Exception:
            return LocationContext(latitude=lat, longitude=lon, source=source, precision=precision)

    @staticmethod
    def _compute_comfort_index(temp: float, humidity: float, wind: float) -> float:
        temp_score = max(0, 10 - abs(temp - 22) * 0.5)
        hum_score = max(0, 10 - abs(humidity - 50) * 0.1)
        wind_score = max(0, 10 - wind * 0.3)
        return round(temp_score * 0.5 + hum_score * 0.3 + wind_score * 0.2, 1)

    @staticmethod
    def _compute_outdoor_index(temp: float, humidity: float, wind: float, precip_prob: float, uv: float) -> float:
        temp_score = max(0, 10 - abs(temp - 22) * 0.4)
        hum_score = max(0, 10 - abs(humidity - 45) * 0.08)
        wind_penalty = min(3, wind * 0.2)
        precip_penalty = precip_prob / 25.0
        uv_penalty = max(0, (uv - 6) * 0.3) if uv > 6 else 0
        return round(max(0, min(10, temp_score * 0.4 + hum_score * 0.2 + 3 - wind_penalty - precip_penalty - uv_penalty)), 1)

    @staticmethod
    def _analyze_trends(points: list[WeatherTrendPoint]) -> dict[str, Any]:
        if len(points) < 2:
            return {}
        temps = [p.temperature_c for p in points if p.temperature_c is not None]
        humidities = [p.humidity for p in points if p.humidity is not None]
        pressures = [p.pressure_hpa for p in points if p.pressure_hpa is not None]
        trends: dict[str, Any] = {}

        if len(temps) >= 2:
            diff = temps[-1] - temps[0]
            trends["temperature"] = {"direction": "rising" if diff > 0.5 else ("falling" if diff < -0.5 else "stable"), "change": round(diff, 2), "min": round(min(temps), 2), "max": round(max(temps), 2)}
        if len(pressures) >= 2:
            pdiff = pressures[-1] - pressures[0]
            trends["pressure"] = {"direction": "rising" if pdiff > 1 else ("falling" if pdiff < -1 else "stable"), "change": round(pdiff, 2)}
        if len(humidities) >= 2:
            hdiff = humidities[-1] - humidities[0]
            trends["humidity"] = {"direction": "rising" if hdiff > 5 else ("falling" if hdiff < -5 else "stable"), "change": round(hdiff, 2)}
        return trends