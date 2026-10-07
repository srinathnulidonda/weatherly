# backend/app/models/__init__.py
from app.database import Base
from app.models.alert import WeatherAlert
from app.models.location import Location

__all__ = ["Base", "Location", "WeatherAlert"]