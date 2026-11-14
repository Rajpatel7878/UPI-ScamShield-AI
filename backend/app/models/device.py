"""SQLAlchemy Device model for Android device authentication.

A device row is the server-side record of one enrolled Android installation.
Only a SHA-256 hash of the device token is stored; the raw token is returned to
the client exactly once (at registration or rotation) and never persisted.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:  # pragma: no cover - import for type checkers only
    from app.models.user import User


class Device(Base):
    """Android device credential.

    Maps to the 'devices' table.
    Every device belongs to exactly one user and is always accessed with an
    owner filter, so a user cannot read or modify another user's devices.
    Revocation is soft (``revoked_at`` + ``is_active = False``) so the record
    remains available for audit purposes.
    """

    __tablename__ = "devices"

    __table_args__ = (
        # Token lookup is by hash on every device-authenticated request.
        Index("ix_devices_token_hash", "device_token_hash", unique=True),
        # Device listing and the active-device limit are user-scoped.
        Index("ix_devices_user_active", "user_id", "is_active"),
        # Expired devices can be pruned or inspected by expiry.
        Index("ix_devices_expires_at", "expires_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    device_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    # Hex SHA-256 digest of the raw token. The raw token is never stored.
    device_token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # Relationship: every device belongs to one user
    user: Mapped["User"] = relationship(
        back_populates="devices",
        lazy="select",
    )

    def __repr__(self) -> str:
        # Never include the token hash in logs or repr output.
        return f"<Device(id={self.id}, user_id={self.user_id}, name={self.device_name})>"
