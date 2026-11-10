"""SQLAlchemy Scan model."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Scan(Base):
    """Scan model for storing analysis results.

    Maps to the 'scans' table.
    One scan can optionally belong to one user.
    One user can have multiple scans.
    Does not store raw submitted message content or sensitive financial information.
    Uses JSON fields for structured indicators and recommendations.
    """

    __tablename__ = "scans"

    __table_args__ = (
        # History and analytics always filter by user and order by time.
        Index("ix_scans_user_created_at", "user_id", "created_at"),
        Index("ix_scans_risk_level", "risk_level"),
        Index("ix_scans_content_type", "content_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    content_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    content_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )
    risk_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    risk_level: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    summary: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    indicators: Mapped[list[dict] | None] = mapped_column(
        JSON,
        nullable=True,
        default=None,
    )
    recommendations: Mapped[list[dict] | None] = mapped_column(
        JSON,
        nullable=True,
        default=None,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationship: each scan can optionally belong to one user
    user: Mapped["User | None"] = relationship(
        back_populates="scans",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Scan(id={self.id}, content_type={self.content_type})>"

    @property
    def risk_level_display(self) -> str | None:
        """Return formatted risk level."""
        if self.risk_level:
            return self.risk_level.capitalize()
        return None

    @property
    def is_high_risk(self) -> bool | None:
        """Check if the scan has high or critical risk level."""
        if self.risk_level and self.risk_level.lower() in ("high", "critical"):
            return True
        return None