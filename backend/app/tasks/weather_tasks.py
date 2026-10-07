# backend/app/tasks/weather_tasks.py
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from app.models.location import Location
from app.providers.provider_aggregator import ProviderAggregator
from app.services.weather_service import WeatherService
from app.tasks.celery_app import celery_app
from app.utils.celery_helpers import with_services

logger = logging.getLogger("weatherly.tasks.weather")


@celery_app.task(name="app.tasks.weather_tasks.fetch_weather_for_location", bind=True, max_retries=3)
@with_services(WeatherService)
async def fetch_weather_for_location(self, lat, lon, units="metric", *, db, service):
    try:
        result = await service.get_current_weather(lat, lon, units)
        return {"status": "ok", "temperature_c": result.temperature_c}
    except Exception as exc:
        logger.error("fetch_weather_for_location failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))


@celery_app.task(name="app.tasks.weather_tasks.warm_popular_caches")
@with_services(WeatherService)
async def warm_popular_caches(*, db, service):
    try:
        stmt = select(Location).order_by(Location.search_count.desc()).limit(50)
        result = await db.execute(stmt)
        locations = result.scalars().all()

        warmed = 0
        for loc in locations:
            try:
                await service.get_current_weather(loc.latitude, loc.longitude)
                warmed += 1
            except Exception as exc:
                logger.debug("Cache warm failed for %s: %s", loc.name, exc)

        logger.info("Cache warming complete: %d/%d locations", warmed, len(locations))
        return {"warmed": warmed, "total": len(locations)}
    except Exception as exc:
        logger.error("warm_popular_caches failed: %s", exc, exc_info=True)
        return {"error": str(exc)}


@celery_app.task(name="app.tasks.weather_tasks.check_provider_health")
@with_services(use_db=False, use_redis=True)
async def check_provider_health(*, db, service):
    try:
        health = await ProviderAggregator().health_check_all()
        logger.info("Provider health: %s", health)
        return health
    except Exception as exc:
        logger.error("check_provider_health failed: %s", exc, exc_info=True)
        return {"error": str(exc)}


@celery_app.task(name="app.tasks.weather_tasks.generate_weather_report", bind=True, max_retries=2)
@with_services(WeatherService)
async def generate_weather_report(self, lat, lon, report_type="daily", *, db, service):
    try:
        current = await service.get_current_weather(lat, lon)
        forecast = await service.get_forecast(lat, lon, days=7)
        insights = await service.get_insights(lat, lon)

        return {
            "report_type": report_type,
            "location": current.location.model_dump(mode="json"),
            "current_temp_c": current.temperature_c,
            "forecast_days": len(forecast.days),
            "insights_count": len(insights.insights),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        logger.error("generate_weather_report failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc, countdown=60)