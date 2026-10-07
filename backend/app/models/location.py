# backend/app/models/location.py
from sqlalchemy import Float, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin


class Location(Base, TimestampMixin):
    __tablename__ = "locations"
    __table_args__ = (
        Index("ix_locations_lat_lon", "latitude", "longitude"),
        Index("ix_locations_country_state", "country_code", "state"),
        Index("ix_locations_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
        UniqueConstraint("latitude", "longitude", name="uq_locations_lat_lon"),
    )

    name: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float(precision=8), nullable=False)
    longitude: Mapped[float] = mapped_column(Float(precision=8), nullable=False)
    country: Mapped[str | None] = mapped_column(String(128), nullable=True)
    country_code: Mapped[str | None] = mapped_column(String(3), nullable=True, index=True)
    state: Mapped[str | None] = mapped_column(String(128), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="geocoding")
    precision_level: Mapped[str | None] = mapped_column(String(32), nullable=True, default="medium")
    search_count: Mapped[int] = mapped_column(Integer, default=0)

    def __repr__(self) -> str:
        return f"<Location {self.name} ({self.latitude}, {self.longitude})>"