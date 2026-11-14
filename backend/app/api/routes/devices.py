"""Android device registration and management routes.

Enrollment and management require the existing user JWT
(``Authorization: Bearer <JWT>``). Device credentials themselves are presented
separately in ``X-Device-Token`` on device-authenticated endpoints.

Security properties enforced here:

* only a SHA-256 hash of the device token is stored,
* the raw token is returned exactly once (registration or rotation),
* every query is scoped by the authenticated user's id,
* another user's device returns 404, never 403, so existence is not confirmed,
* revoked and expired devices cannot authenticate.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_current_user, get_db_session
from app.core.device_auth import (
    device_token_expiry,
    generate_device_token,
    hash_device_token,
)
from app.core.time_utils import as_utc, utc_iso
from app.models.device import Device
from app.models.user import User
from app.schemas.device import (
    DeviceInfo,
    DeviceListResponse,
    DeviceRegisterRequest,
    DeviceRegistrationResponse,
    DeviceRevokeResponse,
    DeviceTokenRotationResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["devices"])


def _device_info(device: Device) -> DeviceInfo:
    """Serialize device metadata with explicit UTC timestamps."""
    return DeviceInfo(
        id=device.id,
        device_name=device.device_name,
        created_at=utc_iso(device.created_at),
        expires_at=utc_iso(device.expires_at),
        last_used_at=utc_iso(device.last_used_at),
        revoked_at=utc_iso(device.revoked_at),
        is_active=device.is_active,
    )


def _owned_device(db: Session, user_id: int, device_id: int) -> Device:
    """Return a device owned by ``user_id`` or raise 404.

    A device belonging to another user is indistinguishable from a device that
    does not exist.
    """
    device = db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user_id)
    ).scalar_one_or_none()
    if device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found.",
        )
    return device


def _is_live(device: Device, now: datetime) -> bool:
    """Whether a device currently holds a usable credential."""
    if not device.is_active or device.revoked_at is not None:
        return False
    expires_at = as_utc(device.expires_at)
    return expires_at is not None and expires_at > now


@router.post(
    "/register",
    response_model=DeviceRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register an Android device",
)
def register_device(
    payload: DeviceRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DeviceRegistrationResponse:
    """Issue a device token for the authenticated user's Android app.

    The raw token is generated with ``secrets`` and returned once; the database
    stores only its hash. The number of usable devices per user is bounded by
    ``MAX_ACTIVE_DEVICES_PER_USER``.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)

    existing = db.execute(
        select(Device).where(Device.user_id == current_user.id)
    ).scalars().all()
    active_count = sum(1 for device in existing if _is_live(device, now))
    if active_count >= settings.max_active_devices_per_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Active device limit reached. Revoke a device before "
                "registering another one."
            ),
        )

    raw_token = generate_device_token()
    device = Device(
        user_id=current_user.id,
        device_name=payload.device_name,
        device_token_hash=hash_device_token(raw_token),
        created_at=now,
        expires_at=device_token_expiry(now),
        is_active=True,
    )
    db.add(device)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        # Never include the token or the exception detail in the response.
        logger.warning(
            "Device registration failed for user_id=%s", current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not register device.",
        )

    db.refresh(device)
    return DeviceRegistrationResponse(
        device=_device_info(device),
        token=raw_token,
    )


@router.get(
    "",
    response_model=DeviceListResponse,
    summary="List the authenticated user's devices",
)
def list_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DeviceListResponse:
    """Return metadata for the caller's devices only.

    Tokens and token hashes are never part of the response.
    """
    devices = db.execute(
        select(Device)
        .where(Device.user_id == current_user.id)
        .order_by(Device.created_at.desc(), Device.id.desc())
    ).scalars().all()
    return DeviceListResponse(devices=[_device_info(device) for device in devices])


@router.delete(
    "/{device_id}",
    response_model=DeviceRevokeResponse,
    summary="Revoke a device",
)
def revoke_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DeviceRevokeResponse:
    """Revoke one of the caller's devices immediately.

    The record is kept for audit purposes, but its token stops authenticating on
    the next request. Revoking an already revoked device is idempotent.
    """
    device = _owned_device(db, current_user.id, device_id)
    if device.revoked_at is None:
        device.revoked_at = datetime.now(timezone.utc)
    device.is_active = False
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.warning("Device revocation failed for device_id=%s", device.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not revoke device.",
        )

    db.refresh(device)
    return DeviceRevokeResponse(
        device_id=device.id,
        revoked_at=utc_iso(device.revoked_at),
    )


@router.post(
    "/{device_id}/rotate",
    response_model=DeviceTokenRotationResponse,
    summary="Rotate a device token",
)
def rotate_device_token(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DeviceTokenRotationResponse:
    """Replace a device token, invalidating the previous one immediately.

    The device row keeps its identity and name; only the stored hash and expiry
    change. A revoked device cannot be rotated (409).
    """
    device = _owned_device(db, current_user.id, device_id)
    if device.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Revoked devices cannot be rotated. Register a new device.",
        )

    raw_token = generate_device_token()
    device.device_token_hash = hash_device_token(raw_token)
    device.expires_at = device_token_expiry()
    device.is_active = True
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.warning("Device rotation failed for device_id=%s", device.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not rotate device token.",
        )

    db.refresh(device)
    return DeviceTokenRotationResponse(
        device=_device_info(device),
        token=raw_token,
    )
