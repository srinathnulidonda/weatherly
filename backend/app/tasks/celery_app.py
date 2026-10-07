# backend/app/tasks/celery_app.py
from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "weatherly",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    task_soft_time_limit=240,
    task_acks_late=True,
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    worker_concurrency=4,
    result_expires=3600,
    task_routes={
        "app.tasks.weather_tasks.*": {"queue": "weather"},
        "app.tasks.alert_tasks.*": {"queue": "alerts"},
    },
    task_default_queue="default",
    task_default_exchange="default",
    task_default_routing_key="default",
)

celery_app.conf.beat_schedule = {
    "deactivate-expired-alerts": {
        "task": "app.tasks.alert_tasks.deactivate_expired_alerts",
        "schedule": crontab(minute="*/5"),
        "options": {"queue": "alerts"},
    },
    "warm-popular-locations-cache": {
        "task": "app.tasks.weather_tasks.warm_popular_caches",
        "schedule": crontab(minute="*/10"),
        "options": {"queue": "weather"},
    },
    "ingest-alerts-popular-locations": {
        "task": "app.tasks.alert_tasks.ingest_alerts_for_popular_locations",
        "schedule": crontab(minute="*/15"),
        "options": {"queue": "alerts"},
    },
    "provider-health-check": {
        "task": "app.tasks.weather_tasks.check_provider_health",
        "schedule": crontab(minute="*/5"),
        "options": {"queue": "weather"},
    },
}