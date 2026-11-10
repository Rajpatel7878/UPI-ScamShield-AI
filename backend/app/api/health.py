"""System routes: API metadata and health checks."""

from fastapi import APIRouter, Response, status
from sqlalchemy import text

from app.core.config import get_settings
from app.database.connection import engine
from app.schemas.health import HealthResponse, RootResponse, SystemInfoResponse
from app.services.detection.gemini_service import is_gemini_configured

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
    description="Reports service availability and database connectivity.",
)
async def health_check(response: Response) -> HealthResponse:
    """Report liveness and database connectivity.

    Returns 503 when the database cannot be reached so hosting-platform health
    checks and uptime monitors see the real state instead of a false positive.
    """
    settings = get_settings()
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database = "connected"
        status_value = "healthy"
    except Exception:
        database = "unavailable"
        status_value = "degraded"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return HealthResponse(
        status=status_value,
        database=database,
        ai_analysis="configured" if is_gemini_configured() else "not_configured",
        service=settings.app_name,
        environment=settings.environment,
    )


@router.get(
    "/system/info",
    response_model=SystemInfoResponse,
    summary="System information",
    description="Returns safe application metadata.",
)
async def system_info() -> SystemInfoResponse:
    settings = get_settings()
    return SystemInfoResponse(
        app_name=settings.app_name,
        app_version=settings.app_version,
        environment=settings.environment,
        api_prefix=settings.api_prefix,
        available_modules=["system", "health", "auth", "detection", "history", "analytics"],
        database_integration="sqlalchemy",
        ai_integration="gemini_optional",
    )
