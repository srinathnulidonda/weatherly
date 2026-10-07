# backend/app/utils/validators.py
import re
from datetime import date

from app.core.exceptions import ValidationException


def validate_latitude(value: float) -> float:
    if not -90.0 <= value <= 90.0:
        raise ValidationException(f"Latitude must be between -90 and 90, got {value}")
    return round(value, 6)


def validate_longitude(value: float) -> float:
    if not -180.0 <= value <= 180.0:
        raise ValidationException(f"Longitude must be between -180 and 180, got {value}")
    return round(value, 6)


def validate_coordinate_pair(latitude: float, longitude: float) -> tuple[float, float]:
    return validate_latitude(latitude), validate_longitude(longitude)


def validate_date_range(start: date, end: date, max_days: int | None = None) -> tuple[date, date]:
    if start > end:
        raise ValidationException("Start date must be before or equal to end date")
    if max_days is not None and (end - start).days > max_days:
        raise ValidationException(f"Date range cannot exceed {max_days} days")
    return start, end


_VALID_UNIT_SYSTEMS = frozenset({"metric", "imperial", "standard"})


def validate_unit_system(unit: str) -> str:
    if unit not in _VALID_UNIT_SYSTEMS:
        raise ValidationException(f"Invalid unit system '{unit}'. Must be one of: {', '.join(sorted(_VALID_UNIT_SYSTEMS))}")
    return unit


_STRIP_PATTERN = re.compile(r"[<>\"';]")


def sanitize_string(value: str, max_length: int = 255) -> str:
    return _STRIP_PATTERN.sub("", value.strip())[:max_length]


def validate_query_string(q: str) -> str:
    cleaned = sanitize_string(q, max_length=200)
    if len(cleaned) < 2:
        raise ValidationException("Search query must be at least 2 characters")
    return cleaned