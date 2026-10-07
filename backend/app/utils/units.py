# backend/app/utils/units.py
import math
from enum import StrEnum
from typing import Callable


class TemperatureUnit(StrEnum):
    CELSIUS = "celsius"
    FAHRENHEIT = "fahrenheit"
    KELVIN = "kelvin"


class SpeedUnit(StrEnum):
    MS = "m/s"
    KMH = "km/h"
    MPH = "mph"
    KNOTS = "knots"


class PressureUnit(StrEnum):
    HPA = "hPa"
    INHG = "inHg"
    MMHG = "mmHg"
    MB = "mb"
    ATM = "atm"


class DistanceUnit(StrEnum):
    KM = "km"
    MI = "miles"
    M = "m"
    FT = "ft"
    NM = "nm"


class PrecipitationUnit(StrEnum):
    MM = "mm"
    IN = "in"
    CM = "cm"


_TEMP_TO_C: dict[TemperatureUnit, Callable[[float], float]] = {
    TemperatureUnit.CELSIUS: lambda t: t,
    TemperatureUnit.FAHRENHEIT: lambda t: (t - 32.0) * 5.0 / 9.0,
    TemperatureUnit.KELVIN: lambda t: t - 273.15,
}
_TEMP_FROM_C: dict[TemperatureUnit, Callable[[float], float]] = {
    TemperatureUnit.CELSIUS: lambda t: t,
    TemperatureUnit.FAHRENHEIT: lambda t: t * 9.0 / 5.0 + 32.0,
    TemperatureUnit.KELVIN: lambda t: t + 273.15,
}


def convert_temperature(value: float, from_unit: TemperatureUnit, to_unit: TemperatureUnit) -> float:
    if from_unit == to_unit:
        return value
    return round(_TEMP_FROM_C[to_unit](_TEMP_TO_C[from_unit](value)), 2)


_SPEED_TO_MS: dict[SpeedUnit, float] = {
    SpeedUnit.MS: 1.0, SpeedUnit.KMH: 1.0 / 3.6, SpeedUnit.MPH: 0.44704, SpeedUnit.KNOTS: 0.514444,
}


def convert_speed(value: float, from_unit: SpeedUnit, to_unit: SpeedUnit) -> float:
    if from_unit == to_unit:
        return value
    return round(value * _SPEED_TO_MS[from_unit] / _SPEED_TO_MS[to_unit], 2)


_PRESSURE_TO_HPA: dict[PressureUnit, float] = {
    PressureUnit.HPA: 1.0, PressureUnit.MB: 1.0, PressureUnit.INHG: 33.8639,
    PressureUnit.MMHG: 1.33322, PressureUnit.ATM: 1013.25,
}


def convert_pressure(value: float, from_unit: PressureUnit, to_unit: PressureUnit) -> float:
    if from_unit == to_unit:
        return value
    return round(value * _PRESSURE_TO_HPA[from_unit] / _PRESSURE_TO_HPA[to_unit], 4)


_DISTANCE_TO_M: dict[DistanceUnit, float] = {
    DistanceUnit.M: 1.0, DistanceUnit.KM: 1000.0, DistanceUnit.MI: 1609.344,
    DistanceUnit.FT: 0.3048, DistanceUnit.NM: 1852.0,
}


def convert_distance(value: float, from_unit: DistanceUnit, to_unit: DistanceUnit) -> float:
    if from_unit == to_unit:
        return value
    return round(value * _DISTANCE_TO_M[from_unit] / _DISTANCE_TO_M[to_unit], 4)


_PRECIP_TO_MM: dict[PrecipitationUnit, float] = {
    PrecipitationUnit.MM: 1.0, PrecipitationUnit.CM: 10.0, PrecipitationUnit.IN: 25.4,
}


def convert_precipitation(value: float, from_unit: PrecipitationUnit, to_unit: PrecipitationUnit) -> float:
    if from_unit == to_unit:
        return value
    return round(value * _PRECIP_TO_MM[from_unit] / _PRECIP_TO_MM[to_unit], 4)


def beaufort_scale(wind_speed_ms: float) -> int:
    thresholds = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7]
    for level, threshold in enumerate(thresholds):
        if wind_speed_ms < threshold:
            return level
    return 12


_DIRECTIONS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]


def wind_direction_label(degrees: float) -> str:
    return _DIRECTIONS[round(degrees / 22.5) % 16]


def uv_index_category(uv: float) -> str:
    if uv <= 2:
        return "low"
    if uv <= 5:
        return "moderate"
    if uv <= 7:
        return "high"
    if uv <= 10:
        return "very_high"
    return "extreme"


def heat_index(temp_c: float, humidity: float) -> float:
    if temp_c < 27 or humidity < 40:
        return temp_c
    t = convert_temperature(temp_c, TemperatureUnit.CELSIUS, TemperatureUnit.FAHRENHEIT)
    hi = (
        -42.379 + 2.04901523 * t + 10.14333127 * humidity - 0.22475541 * t * humidity
        - 0.00683783 * t ** 2 - 0.05481717 * humidity ** 2 + 0.00122874 * t ** 2 * humidity
        + 0.00085282 * t * humidity ** 2 - 0.00000199 * t ** 2 * humidity ** 2
    )
    return round(convert_temperature(hi, TemperatureUnit.FAHRENHEIT, TemperatureUnit.CELSIUS), 2)


def wind_chill(temp_c: float, wind_speed_kmh: float) -> float:
    if temp_c > 10 or wind_speed_kmh < 4.8:
        return temp_c
    wc = 13.12 + 0.6215 * temp_c - 11.37 * wind_speed_kmh ** 0.16 + 0.3965 * temp_c * wind_speed_kmh ** 0.16
    return round(wc, 2)


def dew_point(temp_c: float, humidity: float) -> float:
    a, b = 17.27, 237.7
    alpha = (a * temp_c) / (b + temp_c) + math.log(max(humidity, 0.1) / 100.0)
    return round((b * alpha) / (a - alpha), 2)


def feels_like(temp_c: float, humidity: float, wind_speed_ms: float) -> float:
    wind_kmh = convert_speed(wind_speed_ms, SpeedUnit.MS, SpeedUnit.KMH)
    if temp_c >= 27 and humidity >= 40:
        return heat_index(temp_c, humidity)
    if temp_c <= 10 and wind_kmh >= 4.8:
        return wind_chill(temp_c, wind_kmh)
    return temp_c


def visibility_category(visibility_km: float) -> str:
    if visibility_km >= 10:
        return "excellent"
    if visibility_km >= 4:
        return "good"
    if visibility_km >= 1:
        return "moderate"
    if visibility_km >= 0.5:
        return "poor"
    return "very_poor"


def cloud_cover_description(percentage: float) -> str:
    if percentage <= 6:
        return "clear"
    if percentage <= 25:
        return "few_clouds"
    if percentage <= 50:
        return "scattered"
    if percentage <= 87:
        return "broken"
    return "overcast"


def humidity_comfort(humidity: float) -> str:
    if humidity < 30:
        return "dry"
    if humidity < 60:
        return "comfortable"
    if humidity < 80:
        return "humid"
    return "very_humid"


def calculate_us_aqi_from_pm25(pm25: float) -> int:
    if pm25 <= 0:
        return 0
    if pm25 > 500.4:
        return 500
    breakpoints = [
        (0.0, 12.0, 0, 50), (12.1, 35.4, 51, 100), (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200), (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400), (350.5, 500.4, 401, 500),
    ]
    for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints:
        if bp_lo <= pm25 <= bp_hi:
            return round(((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (pm25 - bp_lo) + aqi_lo)
    return 500


def aqi_category_us(aqi: int) -> str:
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"