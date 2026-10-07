# backend/app/models/alert.py
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Index, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin


class WeatherAlert(Base, TimestampMixin):
    __tablename__ = "weather_alerts"
    __table_args__ = (
        Index("ix_alerts_lat_lon", "latitude", "longitude"),
        Index("ix_alerts_severity", "severity"),
        Index("ix_alerts_active", "is_active", "expires_at"),
        Index("ix_alerts_event_type", "event_type"),
    )

    source_alert_id: Mapped[str | None] = mapped_column(String(256), nullable=True, unique=True)
    provider: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float(precision=8), nullable=False)
    longitude: Mapped[float] = mapped_column(Float(precision=8), nullable=False)
    location_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    affected_zones: Mapped[list | None] = mapped_column(JSON, nullable=True)
    event_type: Mapped[str] = mapped_column(String(128), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    urgency: Mapped[str | None] = mapped_column(String(32), nullable=True)
    certainty: Mapped[str | None] = mapped_column(String(32), nullable=True)
    headline: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    instruction: Mapped[str | None] = mapped_column(Text, nullable=True)
    sender: Mapped[str | None] = mapped_column(String(256), nullable=True)
    effective_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    onset_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    response_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    raw_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    def __repr__(self) -> str:
        return f"<WeatherAlert {self.event_type} severity={self.severity}>"