# backend/app/config.py
from functools import lru_cache
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str
    APP_VERSION: str
    ENVIRONMENT: str

    DATABASE_URL: str
    DB_POOL_SIZE: int
    DB_MAX_OVERFLOW: int
    DB_POOL_TIMEOUT: int
    DB_POOL_RECYCLE: int
    DB_ECHO: bool

    REDIS_URL: str
    REDIS_MAX_CONNECTIONS: int

    OPENWEATHERMAP_API_KEY: str = ""
    OPENWEATHERMAP_BASE_URL: str = "https://api.openweathermap.org"
    WEATHERAPI_API_KEY: str = ""
    WEATHERAPI_BASE_URL: str = "https://api.weatherapi.com"
    TOMORROW_IO_API_KEY: str = ""
    TOMORROW_IO_BASE_URL: str = "https://api.tomorrow.io"
    NOAA_API_KEY: str = ""
    NOAA_BASE_URL: str = "https://api.weather.gov"
    COPERNICUS_API_KEY: str = ""
    COPERNICUS_BASE_URL: str = "https://ads.atmosphere.copernicus.eu/api"
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com"

    CORS_ORIGINS: str

    RATE_LIMIT_PER_MINUTE: int

    CACHE_TTL_CURRENT: int
    CACHE_TTL_FORECAST: int
    CACHE_TTL_LOCATION: int
    CACHE_TTL_ALERTS: int

    HTTP_TIMEOUT: float = 30.0
    HTTP_TIMEOUT_CONNECT: float = 10.0

    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    LOG_LEVEL: str
    LOG_JSON_FORMAT: bool

    API_KEY: str = ""
    TRUSTED_PROXY_COUNT: int = 0
    ALLOWED_HOSTS: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_hosts_list(self) -> list[str]:
        return [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]

    @property
    def async_database_url(self) -> str:
        return self._convert_to_asyncpg_url(self.DATABASE_URL)

    @property
    def active_providers(self) -> list[str]:
        providers = ["open_meteo", "noaa"]
        if self.OPENWEATHERMAP_API_KEY:
            providers.append("openweathermap")
        if self.WEATHERAPI_API_KEY:
            providers.append("weatherapi")
        if self.TOMORROW_IO_API_KEY:
            providers.append("tomorrow_io")
        if self.COPERNICUS_API_KEY:
            providers.append("copernicus")
        return providers

    @model_validator(mode="after")
    def _validate_production_security(self) -> "Settings":
        if self.ENVIRONMENT.lower() == "production":
            if not self.API_KEY:
                raise ValueError("API_KEY must be set when ENVIRONMENT=production")
            if not self.ALLOWED_HOSTS or "*" in self.allowed_hosts_list:
                raise ValueError("ALLOWED_HOSTS must list explicit hostnames when ENVIRONMENT=production")
            if "*" in self.cors_origins_list:
                raise ValueError("CORS_ORIGINS cannot be '*' when ENVIRONMENT=production")
        return self

    @staticmethod
    def _convert_to_asyncpg_url(url: str) -> str:
        if not url:
            raise ValueError("DATABASE_URL is empty")

        parsed = urlparse(url)
        if parsed.scheme.lower() not in {"postgres", "postgresql", "cockroachdb"}:
            return url

        sslmode = parse_qs(parsed.query).get("sslmode", [None])[0]
        new_query = ""
        if sslmode:
            ssl_map = {
                "disable": "disable", "allow": "prefer", "prefer": "prefer",
                "require": "require", "verify-ca": "require", "verify-full": "verify-full",
            }
            new_query = urlencode({"ssl": ssl_map.get(sslmode.lower(), "require")})

        return urlunparse(parsed._replace(scheme="postgresql+asyncpg", query=new_query))


@lru_cache
def get_settings() -> Settings:
    return Settings()