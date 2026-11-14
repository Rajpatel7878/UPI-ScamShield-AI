"""Device token generation, hashing and authentication.

A device token is a server-issued, per-installation credential for the Android
app. It is deliberately separate from the user JWT:

* the raw token is high-entropy random data (never derived from ``JWT_SECRET_KEY``),
* only a SHA-256 hex digest is stored, so a database leak does not expose usable
  credentials,
* every token belongs to one user and one device row, and can be revoked or
  rotated individually.

Tokens are presented in the ``X-Device-Token`` header only, never as a bearer
token, so browser/CORS flows and device flows cannot be confused.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_db_session
from app.core.time_utils import as_utc
from app.models.device import Device
from app.models.user import User

logger = logging.getLogger(__name__)

DEVICE_TOKEN_HEADER = "X-Device-Token"
DEVICE_TOKEN_PREFIX = "ssdev_"
# 32 random bytes -> 256 bits of entropy, URL-safe encoded.
DEVICE_TOKEN_BYTES = 32
# Defensive bound: anything longer than a generated token is malformed.
MAX_DEVICE_TOKEN_LENGTH = 256
# Do not rewrite last_used_at on every single notification check.
LAST_USED_WRITE_INTERVAL = timedelta(seconds=60)


def generate_device_token() -> str:
    """Return a new high-entropy device token.

    The token is shown to the client exactly once. Callers must never log or
    persist it.
    """
    return DEVICE_TOKEN_PREFIX + secrets.token_urlsafe(DEVICE_TOKEN_BYTES)


def hash_device_token(token: str) -> str:
    """Return the SHA-256 hex digest stored for a device token.

    SHA-256 is appropriate here because the token is 256-bit random data, not a
    user-chosen password; a slow password KDF would only add latency to every
    device-authenticated request without adding practical security.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def device_token_expiry(now: datetime | None = None) -> datetime:
    """Return the expiry timestamp for a freshly issued device token."""
    issued_at = now or datetime.now(timezone.utc)
    return issued_at + timedelta(days=get_settings().device_token_expire_days)


def is_well_formed_device_token(token: str) -> bool:
    """Validate the token shape before hashing or querying the database."""
    if not isinstance(token, str) or not token.startswith(DEVICE_TOKEN_PREFIX):
        return False
    if len(token) > MAX_DEVICE_TOKEN_LENGTH:
        return False
    body = token[len(DEVICE_TOKEN_PREFIX) :]
    if not body:
        return False
    return all(ch.isascii() and (ch.isalnum() or ch in "-_") for ch in body)


def _unauthorized() -> HTTPException:
    """Return the single generic 401 used for every device-auth failure.

    Missing, malformed, unknown, revoked and expired tokens all produce the same
    response so the endpoint never reveals which condition failed.
    """
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired device token.",
        headers={"WWW-Authenticate": "DeviceToken"},
    )


def resolve_device(db: Session, token: str) -> Device | None:
    """Return the usable device for ``token``, or ``None``.

    Rejects unknown, revoked, expired and inactive devices, and devices whose
    owner account is no longer active.
    """
    if not is_well_formed_device_token(token):
        return None

    token_hash = hash_device_token(token)
    device = db.execute(
        select(Device).where(Device.device_token_hash == token_hash)
    ).scalar_one_or_none()
    if device is None:
        return None

    # Constant-time comparison as defence in depth: the indexed lookup already
    # matched, but this avoids any short-circuiting comparison on the digest.
    if not hmac.compare_digest(device.device_token_hash, token_hash):
        return None

    if not device.is_active or device.revoked_at is not None:
        return None

    expires_at = as_utc(device.expires_at)
    if expires_at is None or expires_at <= datetime.now(timezone.utc):
        return None

    user = db.get(User, device.user_id)
    if user is None or not user.is_active:
        return None

    return device


def _touch_last_used(db: Session, device: Device, now: datetime) -> None:
    """Record device activity without ever failing the authenticated request."""
    previous = as_utc(device.last_used_at)
    if previous is not None and now - previous < LAST_USED_WRITE_INTERVAL:
        return
    try:
        device.last_used_at = now
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.warning("Could not update last_used_at for device_id=%s", device.id)


def get_current_device(
    x_device_token: Optional[str] = Header(default=None, alias=DEVICE_TOKEN_HEADER),
    db: Session = Depends(get_db_session),
) -> Device:
    """FastAPI dependency returning the device authenticated by its token.

    Raises 401 for any missing, malformed, invalid, revoked or expired token.
    """
    if not x_device_token:
        raise _unauthorized()

    device = resolve_device(db, x_device_token.strip())
    if device is None:
        raise _unauthorized()

    _touch_last_used(db, device, datetime.now(timezone.utc))
    return device
