# backend/app/middleware/security.py
import logging

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

from app.config import get_settings
from app.database import RedisManager
from app.utils.rate_limit import add_rate_limit_headers, check_rate_limit, get_client_identifier

logger = logging.getLogger("weatherly.middleware.security")

_EXEMPT_PREFIXES = ("/docs", "/redoc", "/openapi.json", "/health", "/metrics")


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self._settings = get_settings()

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path.startswith(_EXEMPT_PREFIXES) or request.scope.get("type") == "websocket":
            return await call_next(request)

        try:
            redis = RedisManager.get_client()
        except RuntimeError:
            return await call_next(request)

        identifier = await get_client_identifier(request)
        is_allowed, current, ttl = await check_rate_limit(
            redis_client=redis, identifier=identifier, key_suffix="global",
            limit=self._settings.RATE_LIMIT_PER_MINUTE, window_seconds=60,
        )

        if not is_allowed:
            return Response(
                content='{"error":true,"error_code":"RATE_LIMIT_EXCEEDED","message":"Too many requests"}',
                status_code=429, media_type="application/json",
                headers={"Retry-After": str(max(ttl, 1)), "X-RateLimit-Limit": str(self._settings.RATE_LIMIT_PER_MINUTE)},
            )

        response = await call_next(request)
        add_rate_limit_headers(response, self._settings.RATE_LIMIT_PER_MINUTE, current)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        return response