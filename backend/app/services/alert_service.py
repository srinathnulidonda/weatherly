# backend/app/services/alert_service.py
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, case, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.alert import WeatherAlert
from app.schemas.alert import AlertResponse, AlertStats
from app.schemas.common import PaginationMeta
from app.services.cache_service import CacheKeyBuilder, cache_service
from app.utils import bounding_box, ensure_datetime, haversine_distance, validate_coordinate_pair

logger = logging.getLogger("weatherly.alert_service")


class AlertService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._cache = cache_service
        self._settings = get_settings()

    async def get_alerts_for_location(
        self, lat: float, lon: float, radius_km: float = 50.0,
        severity: list[str] | None = None, active_only: bool = True, page: int = 1, size: int = 20,
    ) -> tuple[list[AlertResponse], PaginationMeta]:
        lat, lon = validate_coordinate_pair(lat, lon)
        if severity:
            severity = [s.strip().lower() for s in severity if s.strip()] or None

        cache_key = CacheKeyBuilder.alerts(lat, lon, radius_km, severity, active_only)
        cached = await self._cache.get(cache_key)
        if cached is not None and page == 1:
            return [AlertResponse(**a) for a in cached.get("alerts", [])], PaginationMeta(**cached["pagination"])

        bbox = bounding_box(lat, lon, radius_km)
        stmt = select(WeatherAlert).where(
            WeatherAlert.latitude.between(bbox.min_lat, bbox.max_lat),
            WeatherAlert.longitude.between(bbox.min_lon, bbox.max_lon),
        )
        if active_only:
            now = datetime.now(timezone.utc)
            stmt = stmt.where(WeatherAlert.is_active.is_(True), WeatherAlert.expires_at > now)
        if severity:
            stmt = stmt.where(func.lower(WeatherAlert.severity).in_(severity))

        severity_order = case(
            (func.lower(WeatherAlert.severity) == "extreme", 4), (func.lower(WeatherAlert.severity) == "severe", 3),
            (func.lower(WeatherAlert.severity) == "moderate", 2), (func.lower(WeatherAlert.severity) == "minor", 1), else_=0,
        )
        stmt = stmt.order_by(severity_order.desc(), WeatherAlert.effective_at.desc())

        result = await self._db.execute(stmt)
        in_radius = [
            a for a in result.scalars().all()
            if haversine_distance(lat, lon, a.latitude, a.longitude) <= radius_km
        ]

        total = len(in_radius)
        pagination = PaginationMeta.create(page, size, total)
        start = (page - 1) * size
        alerts = [AlertResponse.model_validate(a) for a in in_radius[start:start + size]]

        if page == 1:
            await self._cache.set(
                cache_key,
                {"alerts": [a.model_dump(mode="json") for a in alerts], "pagination": pagination.model_dump()},
                self._settings.CACHE_TTL_ALERTS,
            )
        return alerts, pagination

    async def deactivate_expired_alerts(self) -> int:
        now = datetime.now(timezone.utc)
        stmt = update(WeatherAlert).where(WeatherAlert.is_active.is_(True), WeatherAlert.expires_at <= now).values(is_active=False)
        result = await self._db.execute(stmt)
        await self._db.flush()
        if result.rowcount:
            logger.info("Deactivated %d expired alerts", result.rowcount)
        return result.rowcount

    async def ingest_provider_alerts(self, lat: float, lon: float, radius_km: float = 100.0) -> list[AlertResponse]:
        from app.providers.provider_aggregator import ProviderAggregator

        try:
            raw_alerts = await ProviderAggregator().fetch_alerts(lat, lon, radius_km)
        except Exception as exc:
            logger.error("Failed to fetch provider alerts: %s", exc)
            return []

        created: list[AlertResponse] = []
        now = datetime.now(timezone.utc)

        for raw in raw_alerts:
            source_id = raw.get("source_alert_id")
            if source_id:
                existing = await self._db.execute(select(WeatherAlert).where(WeatherAlert.source_alert_id == source_id))
                if existing.scalar_one_or_none():
                    continue

            effective_at = ensure_datetime(raw.get("effective_at")) or now
            expires_at = ensure_datetime(raw.get("expires_at")) or now
            if expires_at <= effective_at:
                expires_at = effective_at + timedelta(hours=24)

            try:
                alert = WeatherAlert(
                    source_alert_id=source_id, provider=raw.get("provider", "unknown"),
                    latitude=float(raw.get("latitude", lat)), longitude=float(raw.get("longitude", lon)),
                    location_name=raw.get("location_name"), affected_zones=raw.get("affected_zones"),
                    event_type=raw.get("event_type", "Unknown"), severity=(raw.get("severity") or "moderate").strip().lower(),
                    urgency=(raw.get("urgency") or "").strip().lower() or None, certainty=(raw.get("certainty") or "").strip().lower() or None,
                    headline=raw.get("headline", "Weather Alert"), description=raw.get("description"),
                    instruction=raw.get("instruction"), sender=raw.get("sender"),
                    effective_at=effective_at, onset_at=ensure_datetime(raw.get("onset_at")), expires_at=expires_at,
                    is_active=True, category=raw.get("category"), response_type=raw.get("response_type"),
                    raw_data=raw.get("raw_data"),
                )
                async with self._db.begin_nested():
                    self._db.add(alert)
                await self._db.refresh(alert)
                created.append(AlertResponse.model_validate(alert))
            except Exception as exc:
                logger.warning("Failed to ingest alert from %s: %s", raw.get("provider", "unknown"), exc)

        if created:
            await self._cache.invalidate_alerts(lat, lon)
        return created

    async def get_alert_stats(self, lat: float, lon: float, radius_km: float = 100.0) -> AlertStats:
        lat, lon = validate_coordinate_pair(lat, lon)
        bbox = bounding_box(lat, lon, radius_km)
        now = datetime.now(timezone.utc)

        base_filter = and_(
            WeatherAlert.is_active.is_(True), WeatherAlert.expires_at > now,
            WeatherAlert.latitude.between(bbox.min_lat, bbox.max_lat),
            WeatherAlert.longitude.between(bbox.min_lon, bbox.max_lon),
        )

        total_active = (await self._db.execute(select(func.count()).select_from(WeatherAlert).where(base_filter))).scalar() or 0

        sev_result = await self._db.execute(select(WeatherAlert.severity, func.count()).where(base_filter).group_by(WeatherAlert.severity))
        by_severity = {row[0]: row[1] for row in sev_result.all()}

        type_result = await self._db.execute(select(WeatherAlert.event_type, func.count()).where(base_filter).group_by(WeatherAlert.event_type))
        by_event_type = {row[0]: row[1] for row in type_result.all()}

        recent_filter = and_(base_filter, WeatherAlert.created_at >= now - timedelta(hours=24))
        recent_count = (await self._db.execute(select(func.count()).select_from(WeatherAlert).where(recent_filter))).scalar() or 0

        return AlertStats(total_active=total_active, by_severity=by_severity, by_event_type=by_event_type, recent_count_24h=recent_count)