# backend/app/core/exceptions.py
from typing import Any


class WeatherlyException(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        self.headers = headers
        super().__init__(message)

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "error": True,
            "error_code": self.error_code,
            "message": self.message,
        }
        if self.details and self.error_code not in {
            "PROVIDER_ERROR", "PROVIDER_TIMEOUT", "SERVICE_UNAVAILABLE",
            "INTERNAL_ERROR", "CACHE_ERROR",
        }:
            payload["details"] = self.details
        return payload


class NotFoundException(WeatherlyException):
    def __init__(self, resource: str, identifier: str | None = None) -> None:
        message = f"{resource} not found" if not identifier else f"{resource} '{identifier}' not found"
        super().__init__(
            message=message, status_code=404, error_code="NOT_FOUND",
            details={"resource": resource, "identifier": identifier},
        )


class RateLimitExceededException(WeatherlyException):
    def __init__(self, retry_after: int | None = None) -> None:
        details: dict[str, Any] = {}
        headers: dict[str, str] = {}
        if retry_after is not None:
            details["retry_after_seconds"] = retry_after
            headers["Retry-After"] = str(retry_after)
        super().__init__(
            message="Rate limit exceeded. Please try again later.",
            status_code=429, error_code="RATE_LIMIT_EXCEEDED",
            details=details, headers=headers,
        )


class ValidationException(WeatherlyException):
    def __init__(self, message: str, errors: list[dict[str, Any]] | None = None) -> None:
        super().__init__(
            message=message, status_code=422, error_code="VALIDATION_ERROR",
            details={"errors": errors or []},
        )


class BadRequestException(WeatherlyException):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=400, error_code="BAD_REQUEST")


class ConflictException(WeatherlyException):
    def __init__(self, resource: str, message: str = "Already exists") -> None:
        super().__init__(
            message=f"{resource}: {message}", status_code=409, error_code="CONFLICT",
            details={"resource": resource},
        )


class ProviderException(WeatherlyException):
    def __init__(
        self, provider: str, message: str, original_error: Exception | None = None,
        error_code: str = "PROVIDER_ERROR", status_code: int = 502,
    ) -> None:
        details: dict[str, Any] = {"provider": provider}
        if original_error:
            details["original_error"] = str(original_error)
        super().__init__(
            message=f"Weather provider '{provider}' error: {message}",
            status_code=status_code, error_code=error_code, details=details,
        )


class ProviderTimeoutException(ProviderException):
    def __init__(self, provider: str) -> None:
        super().__init__(
            provider=provider, message="Request timed out",
            error_code="PROVIDER_TIMEOUT", status_code=504,
        )


class CacheException(WeatherlyException):
    def __init__(self, message: str, operation: str | None = None) -> None:
        details: dict[str, Any] = {"operation": operation} if operation else {}
        super().__init__(
            message=f"Cache error: {message}", status_code=500,
            error_code="CACHE_ERROR", details=details,
        )


class ServiceUnavailableException(WeatherlyException):
    def __init__(self, service: str, message: str = "Service temporarily unavailable") -> None:
        super().__init__(
            message=f"{service}: {message}", status_code=503,
            error_code="SERVICE_UNAVAILABLE", details={"service": service},
        )


class GeocodingException(WeatherlyException):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=400, error_code="GEOCODING_ERROR")