# backend/app/schemas/alert.py
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_alert_id: str | None
    provider: str
    latitude: float
    longitude: float
    location_name: str | None
    affected_zones: list[str] | None
    event_type: str
    severity: str
    urgency: str | None
    certainty: str | None
    headline: str
    description: str | None
    instruction: str | None
    sender: str | None
    effective_at: datetime
    onset_at: datetime | None
    expires_at: datetime
    is_active: bool
    category: str | None
    response_type: str | None
    created_at: datetime
    updated_at: datetime


class AlertStats(BaseModel):
    total_active: int
    by_severity: dict[str, int]
    by_event_type: dict[str, int]
    recent_count_24h: int