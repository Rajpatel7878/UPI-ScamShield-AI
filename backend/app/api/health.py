"""System routes: API metadata and health checks."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.health import HealthResponse, RootResponse

router = APIRouter(tags=["system"])


@router.get(
    "/",
    response_model=RootResponse,
    summary="API metadata",
    description="Returns basic information about the running service.",
)
async def read_root() -> RootResponse:
    settings = get_settings()
    return RootResponse(
        status="ok",
        service=f"{settings.app_name} API",
        version=settings.app_version,
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
    description=(
        "Reports service availability. Database persistence is not wired up "
        "in this phase, so it always reports `not_configured`."
    ),
)
async def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        database="not_configured",
        service=settings.app_name,
    )
