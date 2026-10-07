# backend/app/__init__.py
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app import models
from app.config import get_settings
from app.core.exceptions import WeatherlyException
from app.database import DatabaseManager, RedisManager
from app.middleware.monitoring import MetricsCollector, ObservabilityMiddleware, setup_logging
from app.middleware.security import RateLimitMiddleware, SecurityHeadersMiddleware
from app.utils.http import http_client

logger = logging.getLogger("weatherly")


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings.LOG_LEVEL, settings.LOG_JSON_FORMAT)
    is_production = settings.ENVIRONMENT == "production"

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Weather platform API with multi-provider aggregation.",
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json",
        lifespan=_lifespan,
    )

    _register_middleware(app, settings)
    _register_exception_handlers(app)
    _register_routers(app)
    _register_health_routes(app, settings)
    return app


@asynccontextmanager
async def _lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting Weatherly %s [%s]", settings.APP_VERSION, settings.ENVIRONMENT)

    await DatabaseManager.initialize(
        database_url=settings.async_database_url,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_recycle=settings.DB_POOL_RECYCLE,
        echo=settings.DB_ECHO,
    )
    await DatabaseManager.create_tables()

    try:
        await RedisManager.initialize(settings.REDIS_URL, settings.REDIS_MAX_CONNECTIONS)
    except Exception as exc:
        logger.error("Redis unavailable: %s", exc)

    MetricsCollector.get()
    logger.info("Weatherly startup complete")
    yield

    logger.info("Shutting down Weatherly...")
    await http_client.close()
    await RedisManager.close()
    await DatabaseManager.close()


def _register_middleware(app: FastAPI, settings: Any) -> None:
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts_list or ["*"])
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time-Ms", "X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"],
    )
    app.add_middleware(ObservabilityMiddleware)


def _register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(WeatherlyException)
    async def weatherly_exception_handler(request: Request, exc: WeatherlyException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=exc.to_dict(), headers=exc.headers)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {"field": ".".join(str(loc) for loc in err.get("loc", [])), "message": err.get("msg", ""), "type": err.get("type", "")}
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={"error": True, "error_code": "VALIDATION_ERROR", "message": "Request validation failed", "details": {"errors": errors}},
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": True, "error_code": "HTTP_ERROR", "message": str(exc.detail)},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled exception: %s", exc, exc_info=True, extra={"request_id": getattr(request.state, "request_id", "unknown")})
        return JSONResponse(status_code=500, content={"error": True, "error_code": "INTERNAL_ERROR", "message": "An unexpected error occurred"})


def _register_routers(app: FastAPI) -> None:
    from app.api.analytics import router as analytics_router
    from app.api.locations import router as locations_router
    from app.api.marine import router as marine_router
    from app.api.weather import router as weather_router

    prefix = "/api/v1"
    app.include_router(weather_router, prefix=prefix)
    app.include_router(locations_router, prefix=prefix)
    app.include_router(marine_router, prefix=prefix)
    app.include_router(analytics_router, prefix=prefix)


def _register_health_routes(app: FastAPI, settings: Any) -> None:
    @app.api_route("/", methods=["GET", "HEAD"])
    async def root():
        return PlainTextResponse(":) Yo....")

    @app.get("/health", tags=["System"])
    async def health_check():
        db_ok = False
        redis_ok = False
        try:
            engine = DatabaseManager.get_engine()
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            db_ok = True
        except Exception:
            pass
        try:
            redis_ok = await RedisManager.health_check()
        except Exception:
            pass

        status = "healthy" if (db_ok and redis_ok) else "degraded"
        return JSONResponse(
            status_code=200 if status == "healthy" else 503,
            content={
                "status": status,
                "version": settings.APP_VERSION,
                "environment": settings.ENVIRONMENT,
                "database": "connected" if db_ok else "disconnected",
                "redis": "connected" if redis_ok else "disconnected",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "uptime_seconds": MetricsCollector.get().uptime_seconds,
            },
        )

    @app.get("/health/detailed", tags=["System"])
    async def detailed_health():
        from app.providers.provider_aggregator import ProviderAggregator
        from app.services.cache_service import cache_service

        try:
            providers = await ProviderAggregator().health_check_all()
        except Exception:
            providers = {}
        try:
            cache_stats = await cache_service.cache_stats()
        except Exception:
            cache_stats = {}

        return {"metrics": MetricsCollector.get().summary(), "providers": providers, "cache": cache_stats}

    @app.get("/metrics", tags=["System"])
    async def get_metrics():
        return MetricsCollector.get().summary()