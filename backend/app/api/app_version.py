# backend/app/api/app_version.py
from fastapi import APIRouter, Depends

from app.core.dependencies import app_update_rate_limit
from app.schemas.app_version import AppVersionResponse
from app.schemas.common import DataResponse
from app.services.app_version_service import app_version_service

router = APIRouter(prefix="/app", tags=["App"])


@router.get("/version", response_model=DataResponse[AppVersionResponse])
async def get_app_version(_: None = Depends(app_update_rate_limit)):
    info = await app_version_service.get_version_info()
    return DataResponse(data=info, message="App version information retrieved")