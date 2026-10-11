# backend/app/schemas/app_version.py
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AppVersionResponse(BaseModel):
    latest_version: str = Field(min_length=1)
    latest_build_number: int = Field(ge=0)
    min_version: str = ""
    force_update: bool = False
    apk_url: str = Field(min_length=1)
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    file_size_bytes: int = Field(gt=0)
    changelog: list[str] = Field(default_factory=list)
    released_at: datetime | None = None