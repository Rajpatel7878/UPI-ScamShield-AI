"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.middleware import RequestGuardMiddleware
from app.database.init_db import init_db
from app.schemas.health import RootResponse

logging.basicConfig(
    level=logging.INFO if get_settings().debug else logging.WARNING,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create missing tables and indexes once at startup.

    ``create_all`` is idempotent and never deletes existing records. Schema
    migrations for production changes belong in Alembic.
    """
    init_db()
    logger.info("Database schema ready")
    yield


def create_application() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "UPI fraud detection and digital payment security API. "
            "Detection combines explainable rules, passive URL analysis and "
            "optional Gemini assistance. Results are heuristic risk assessments, "
            "not proof that a message is fraudulent."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=settings.api_v1_prefix + "/openapi.json",
        lifespan=lifespan,
    )

    # Added first so CORS wraps the guard and still decorates 429/413 responses.
    application.add_middleware(RequestGuardMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
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
