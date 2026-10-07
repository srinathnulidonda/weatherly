# backend/app/tasks/alert_tasks.py
import logging
from sqlalchemy import select
from app.models.location import Location
from app.services.alert_service import AlertService
from app.tasks.celery_app import celery_app
from app.utils.celery_helpers import with_services

logger = logging.getLogger("weatherly.tasks.alerts")


@celery_app.task(name="app.tasks.alert_tasks.deactivate_expired_alerts")
@with_services(AlertService)
async def deactivate_expired_alerts(*, db, service):
    try:
        count = await service.deactivate_expired_alerts()
        return {"deactivated": count}
    except Exception as exc:
        logger.error("deactivate_expired_alerts failed: %s", exc, exc_info=True)
        return {"error": str(exc)}


@celery_app.task(name="app.tasks.alert_tasks.ingest_alerts_for_popular_locations")
@with_services(AlertService)
async def ingest_alerts_for_popular_locations(*, db, service):
    try:
        stmt = select(Location).order_by(Location.search_count.desc()).limit(30)
        result = await db.execute(stmt)
        locations = result.scalars().all()

        total_alerts = 0
        checked = 0
        for loc in locations:
            try:
                alerts = await service.ingest_provider_alerts(loc.latitude, loc.longitude, 100.0)
                total_alerts += len(alerts)
                checked += 1
            except Exception as exc:
                logger.debug("Alert ingestion failed for %s: %s", loc.name, exc)

        logger.info("Alert ingestion complete: %d locations, %d new alerts", checked, total_alerts)
        return {"locations_checked": checked, "new_alerts": total_alerts}
    except Exception as exc:
        logger.error("ingest_alerts_for_popular_locations failed: %s", exc, exc_info=True)
        return {"error": str(exc)}