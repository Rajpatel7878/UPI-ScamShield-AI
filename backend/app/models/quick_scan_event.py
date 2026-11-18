"""SQLAlchemy model for optional quick-scan metadata.

Quick scans are not persisted by default (``STORE_QUICK_SCANS=false``). When
enabled, only aggregate metadata is stored. The table deliberately has no column
for raw or masked message text, sender, OTP, PIN, password, card number or any
other message content.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class QuickScanEvent(Base):
    """Approved metadata for one device quick scan.

    Maps to the 'quick_scan_events' table.
    """

    __tablename__ = "quick_scan_events"

    __table_args__ = (
        Index("ix_quick_scan_events_user_created_at", "user_id", "created_at"),
        Index("ix_quick_scan_events_device_created_at", "device_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    device_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("devices.id", ondelete="SET NULL"),
        nullable=True,
    )
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    source_app: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return (
            f"<QuickScanEvent(id={self.id}, user_id={self.user_id}, "
            f"device_id={self.device_id}, risk_level={self.risk_level})>"
        )
