"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging_config import configure_logging
from app.core.middleware import RequestGuardMiddleware
from app.database.connection import engine
from app.database.init_db import init_db
from app.schemas.health import RootResponse

configure_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Prepare the database schema once at startup.

    Development creates missing tables idempotently. Production verifies the
    Alembic-managed schema and refuses to start when migrations are missing.
    No data is ever dropped or reset at startup.
    """
    init_db()
    yield
    engine.dispose()
    logger.info("Database engine disposed")


def create_application() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()
    openapi_url = settings.api_v1_prefix + "/openapi.json"
    docs_enabled = settings.enable_docs

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "UPI fraud detection and digital payment security API. "
            "Detection combines explainable rules, passive URL analysis and "
            "optional Gemini assistance. Results are heuristic risk assessments, "
            "not proof that a message is fraudulent."
        ),
        # Public API documentation can be disabled with ENABLE_DOCS=false.
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url=openapi_url if docs_enabled else None,
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

    logger.info(
        "%s %s starting | environment=%s | debug=%s | docs=%s | db=%s | cors=%s",
        settings.app_name,
        settings.app_version,
        settings.environment,
        settings.debug,
        docs_enabled,
        engine.url.get_backend_name(),
        ",".join(settings.cors_origins),
    )

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
