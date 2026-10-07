# backend/app/utils/geo.py
import math
from dataclasses import dataclass

EARTH_RADIUS_KM = 6371.0088


@dataclass(frozen=True, slots=True)
class BoundingBox:
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(EARTH_RADIUS_KM * c, 4)


def bounding_box(latitude: float, longitude: float, radius_km: float) -> BoundingBox:
    lat_delta = math.degrees(radius_km / EARTH_RADIUS_KM)
    cos_lat = math.cos(math.radians(latitude))
    lon_delta = math.degrees(radius_km / (EARTH_RADIUS_KM * max(cos_lat, 1e-10)))
    return BoundingBox(
        min_lat=round(max(latitude - lat_delta, -90.0), 6),
        max_lat=round(min(latitude + lat_delta, 90.0), 6),
        min_lon=round(max(longitude - lon_delta, -180.0), 6),
        max_lon=round(min(longitude + lon_delta, 180.0), 6),
    )