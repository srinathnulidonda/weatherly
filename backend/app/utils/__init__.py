# backend/app/utils/__init__.py
from app.utils.datetime_utils import ensure_datetime
from app.utils.geo import BoundingBox, bounding_box, haversine_distance
from app.utils.http import HTTPClient, get_http_client, http_client
from app.utils.rate_limit import add_rate_limit_headers, check_rate_limit, get_client_identifier
from app.utils.trusted_ip import get_client_ip, get_trusted_proxy_count, is_private_ip
from app.utils.units import (
    DistanceUnit, PrecipitationUnit, PressureUnit, SpeedUnit, TemperatureUnit,
    aqi_category_us, beaufort_scale, calculate_us_aqi_from_pm25, cloud_cover_description,
    convert_distance, convert_precipitation, convert_pressure, convert_speed,
    convert_temperature, dew_point, feels_like, heat_index, humidity_comfort,
    uv_index_category, visibility_category, wind_chill, wind_direction_label,
)
from app.utils.validators import (
    sanitize_string, validate_coordinate_pair, validate_date_range,
    validate_latitude, validate_longitude, validate_query_string, validate_unit_system,
)

__all__ = [
    "ensure_datetime", "BoundingBox", "bounding_box", "haversine_distance",
    "HTTPClient", "get_http_client", "http_client",
    "add_rate_limit_headers", "check_rate_limit", "get_client_identifier",
    "get_client_ip", "get_trusted_proxy_count", "is_private_ip",
    "DistanceUnit", "PrecipitationUnit", "PressureUnit", "SpeedUnit", "TemperatureUnit",
    "aqi_category_us", "beaufort_scale", "calculate_us_aqi_from_pm25", "cloud_cover_description",
    "convert_distance", "convert_precipitation", "convert_pressure", "convert_speed",
    "convert_temperature", "dew_point", "feels_like", "heat_index", "humidity_comfort",
    "uv_index_category", "visibility_category", "wind_chill", "wind_direction_label",
    "sanitize_string", "validate_coordinate_pair", "validate_date_range",
    "validate_latitude", "validate_longitude", "validate_query_string", "validate_unit_system",
]