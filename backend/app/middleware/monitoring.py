# backend/app/middleware/monitoring.py
import json
import logging
import sys
import threading
import time
import uuid
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp
from app.config import get_settings
from app.utils.trusted_ip import get_client_ip, get_trusted_proxy_count

logger = logging.getLogger("weatherly")


class StructuredLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = str(record.exc_info[1])
            log_entry["exception_type"] = record.exc_info[0].__name__ if record.exc_info[0] else None
        for key in ("method", "path", "status_code", "duration_ms", "client_ip", "user_agent"):
            if hasattr(record, key):
                log_entry[key] = getattr(record, key)
        return json.dumps(log_entry, default=str)


def setup_logging(log_level: str, json_format: bool) -> None:
    root = logging.getLogger()
    root.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    for handler in root.handlers[:]:
        root.removeHandler(handler)

    stream_handler = logging.StreamHandler(sys.stdout)
    if json_format:
        stream_handler.setFormatter(StructuredLogFormatter())
    else:
        stream_handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)-8s | %(name)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S"))
    root.addHandler(stream_handler)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING if log_level.upper() != "DEBUG" else logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


class MetricsCollector:
    _instance: "MetricsCollector | None" = None

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.total_requests = 0
        self.total_errors = 0
        self.status_counts: dict[int, int] = {}
        self.endpoint_latencies: dict[str, list[float]] = {}
        self._start_time = time.time()

    @classmethod
    def get(cls) -> "MetricsCollector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def record(self, path: str, status_code: int, duration_ms: float) -> None:
        with self._lock:
            self.total_requests += 1
            if status_code >= 400:
                self.total_errors += 1
            self.status_counts[status_code] = self.status_counts.get(status_code, 0) + 1
            latencies = self.endpoint_latencies.setdefault(path, [])
            latencies.append(duration_ms)
            if len(latencies) > 1000:
                self.endpoint_latencies[path] = latencies[-500:]

    @property
    def uptime_seconds(self) -> float:
        return round(time.time() - self._start_time, 2)

    def summary(self) -> dict[str, Any]:
        with self._lock:
            endpoints: dict[str, dict[str, Any]] = {}
            for path, latencies in self.endpoint_latencies.items():
                if not latencies:
                    continue
                sorted_l = sorted(latencies)
                n = len(sorted_l)
                endpoints[path] = {
                    "count": n,
                    "avg_ms": round(sum(sorted_l) / n, 2),
                    "p50_ms": sorted_l[n // 2],
                    "p95_ms": sorted_l[min(int(n * 0.95), n - 1)],
                    "p99_ms": sorted_l[min(int(n * 0.99), n - 1)],
                }
            return {
                "uptime_seconds": self.uptime_seconds,
                "total_requests": self.total_requests,
                "total_errors": self.total_errors,
                "error_rate": round(self.total_errors / max(self.total_requests, 1) * 100, 2),
                "status_counts": dict(self.status_counts),
                "endpoints": endpoints,
            }


class ObservabilityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self._settings = get_settings()

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = str(duration_ms)

        if request.url.path.startswith(("/docs", "/redoc", "/openapi.json", "/favicon.ico")):
            return response

        route = request.scope.get("route")
        metric_path = route.path if route is not None else request.url.path
        MetricsCollector.get().record(metric_path, response.status_code, duration_ms)

        client_ip = get_client_ip(request, get_trusted_proxy_count(self._settings))

        log_level = logging.ERROR if response.status_code >= 500 else (
            logging.WARNING if response.status_code >= 400 else logging.INFO
        )
        logger.log(
            log_level, "%s %s -> %s (%sms)",
            request.method, request.url.path, response.status_code, duration_ms,
            extra={
                "request_id": request_id, "method": request.method, "path": str(request.url.path),
                "status_code": response.status_code, "duration_ms": duration_ms,
                "client_ip": client_ip, "user_agent": request.headers.get("User-Agent", "")[:200],
            },
        )
        return response