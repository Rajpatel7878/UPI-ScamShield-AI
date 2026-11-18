"""Device-authenticated quick detection endpoint for the Android app.

``POST /api/v1/detect/quick`` authenticates with the Phase 1 device token
(``X-Device-Token``), not a user JWT. It returns a compact risk assessment and
never returns or logs the submitted message.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.routes import detect as detect_routes
from app.core.config import get_settings
from app.core.dependencies import get_db_session
from app.core.device_auth import get_current_device
from app.core.device_rate_limit import quick_scan_limiter
from app.models.device import Device
from app.models.quick_scan_event import QuickScanEvent
from app.schemas.quick_detection import QuickDetectionRequest, QuickDetectionResponse
from app.services.detection.quick_analysis import analyze_quick_scan

logger = logging.getLogger(__name__)

router = APIRouter(tags=["detection"])


def _store_metadata(
    db: Session,
    device: Device,
    payload: QuickDetectionRequest,
    result: dict,
) -> None:
    """Persist approved metadata when ``STORE_QUICK_SCANS`` is enabled.

    A storage failure is logged without content and never fails the analysis.
    """
    event = QuickScanEvent(
        user_id=device.user_id,
        device_id=device.id,
        risk_score=int(result["risk_score"]),
        risk_level=str(result["risk_level"]),
        category=str(result["category"])[:100],
        source_app=payload.source_app,
    )
    try:
        db.add(event)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.warning("Quick scan metadata could not be stored")


@router.post(
    "/detect/quick",
    response_model=QuickDetectionResponse,
    summary="Quick scam check for Android notifications",
    description=(
        "Analyzes one notification message for scam indicators. "
        "Requires `X-Device-Token` (an enrolled device credential, not a JWT). "
        "Credential values are masked before analysis and no message text is "
        "returned, logged or stored. AI providers are only consulted for "
        "mid-range rule scores, with a bounded timeout; any AI failure falls "
        "back to the rule and URL result. Limit: 30 requests per minute per "
        "device, then HTTP 429 with `Retry-After`."
    ),
    responses={
        401: {"description": "Missing, malformed, revoked or expired device token."},
        422: {"description": "Invalid request body (blank or over-2000-character text)."},
        429: {"description": "Per-device rate limit exceeded."},
    },
)
async def quick_detect(
    payload: QuickDetectionRequest,
    device: Device = Depends(get_current_device),
    db: Session = Depends(get_db_session),
) -> QuickDetectionResponse:
    """Analyze a notification and return a compact risk assessment."""
    settings = get_settings()

    retry_after = quick_scan_limiter.check(
        str(device.id),
        settings.rate_limit_quick_scan_per_minute,
    )
    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many quick detection requests. Please wait and try again.",
            headers={"Retry-After": str(retry_after)},
        )

    result = await analyze_quick_scan(
        payload.text,
        ai_analyzer=detect_routes._analyze_with_ai,
        ai_timeout=settings.quick_scan_ai_timeout_seconds,
    )

    if settings.store_quick_scans:
        _store_metadata(db, device, payload, result)

    return QuickDetectionResponse(**result)
