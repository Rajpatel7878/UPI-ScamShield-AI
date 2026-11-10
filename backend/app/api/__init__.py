"""API router aggregation.

Feature routers are registered here so `app.main` only needs to include a
single root router.
"""

from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.detect import router as detect_router
from app.api.routes.dashboard import router as dashboard_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router, prefix="/auth")
api_router.include_router(detect_router)
api_router.include_router(dashboard_router)

__all__ = ["api_router"]
