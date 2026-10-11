# backend/app/services/app_version_service.py
from __future__ import annotations

from app.config import get_settings
from app.core.exceptions import ServiceUnavailableException
from app.schemas.app_version import AppVersionResponse
from app.utils.datetime_utils import ensure_datetime

_REQUIRED = (
    "APP_LATEST_VERSION",
    "APP_APK_URL",
    "APP_APK_SHA256",
    "APP_APK_SIZE_BYTES",
)

_HEX_DIGITS = frozenset("0123456789abcdef")


class AppVersionService:
    def __init__(self) -> None:
        self._settings = get_settings()

    def _validate(self) -> None:
        if not self._settings.APP_UPDATE_ENABLED:
            raise ServiceUnavailableException("app_update", "In-app updates are disabled")

        missing = [name for name in _REQUIRED if not getattr(self._settings, name)]
        if missing:
            raise ServiceUnavailableException(
                "app_update", f"Update service is not configured: {', '.join(missing)}"
            )

        apk_url = self._settings.APP_APK_URL.strip()
        if not apk_url.lower().startswith("https://"):
            raise ServiceUnavailableException("app_update", "APP_APK_URL must use https")

        sha256 = self._settings.APP_APK_SHA256.strip().lower()
        if len(sha256) != 64 or any(ch not in _HEX_DIGITS for ch in sha256):
            raise ServiceUnavailableException(
                "app_update", "APP_APK_SHA256 must be a 64 character hex digest"
            )

    async def get_version_info(self) -> AppVersionResponse:
        self._validate()
        settings = self._settings

        changelog = [line.strip() for line in settings.APP_CHANGELOG.splitlines() if line.strip()]
        released_at = ensure_datetime(settings.APP_RELEASED_AT) if settings.APP_RELEASED_AT else None

        return AppVersionResponse(
            latest_version=settings.APP_LATEST_VERSION.strip(),
            latest_build_number=settings.APP_LATEST_BUILD_NUMBER,
            min_version=settings.APP_MIN_VERSION.strip(),
            force_update=settings.APP_FORCE_UPDATE,
            apk_url=settings.APP_APK_URL.strip(),
            sha256=settings.APP_APK_SHA256.strip().lower(),
            file_size_bytes=settings.APP_APK_SIZE_BYTES,
            changelog=changelog,
            released_at=released_at,
        )


app_version_service = AppVersionService()