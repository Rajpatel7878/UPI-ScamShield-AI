"""API router aggregation.

Feature routers are registered here so `app.main` only needs to include a
single root router.
"""

from fastapi import APIRouter

from app.api.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)

__all__ = ["api_router"]
