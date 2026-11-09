"""FastAPI application entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.schemas.health import RootResponse

logging.basicConfig(
    level=logging.INFO if get_settings().debug else logging.WARNING,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)

logger = logging.getLogger(__name__)


def create_application() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "AI-powered UPI fraud detection and digital payment security API. "
            "Phase 1 provides the service foundation only; the detection engine "
            "arrives in a later phase."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=settings.api_v1_prefix + "/" + "openapi.json",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(application)

    @application.get(
        "/",
        response_model=RootResponse,
        summary="API root",
        description="Returns service metadata and running status.",
    )
    async def read_root() -> RootResponse:
        return RootResponse(
            status="running",
            service=settings.app_name,
            version=settings.app_version,
        )

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    return application


app = create_application()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )