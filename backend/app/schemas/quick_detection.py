"""Pydantic schemas for the device-authenticated quick detection endpoint."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

QUICK_TEXT_MAX_LENGTH = 2_000
QUICK_SENDER_MAX_LENGTH = 120
QUICK_SOURCE_APP_MAX_LENGTH = 255
QUICK_WARNING_MAX_LENGTH = 120
QUICK_MAX_REASONS = 3


def _reject_control_characters(value: str, field: str, allow_newlines: bool = False) -> None:
    """Reject NUL and control characters that cannot be legitimate message text."""
    allowed = {"\n", "\r", "\t"} if allow_newlines else set()
    if any(ord(char) < 32 and char not in allowed for char in value):
        raise ValueError(f"{field} contains invalid control characters")


class QuickDetectionRequest(BaseModel):
    """Notification text submitted by an enrolled Android device.

    ``text`` is the only required field. ``sender`` and ``source_app`` are
    optional metadata; unknown fields are ignored, matching the existing
    detection request convention.
    """

    model_config = ConfigDict(extra="ignore")

    text: str = Field(
        ...,
        min_length=1,
        max_length=QUICK_TEXT_MAX_LENGTH,
        description="Notification message text (1-2000 characters).",
    )
    sender: str | None = Field(
        default=None,
        max_length=QUICK_SENDER_MAX_LENGTH,
        description="Optional sender label, for example 'VM-HDFCBK'.",
    )
    source_app: str | None = Field(
        default=None,
        max_length=QUICK_SOURCE_APP_MAX_LENGTH,
        description="Optional source package, for example 'com.google.android.apps.messaging'.",
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        """Reject blank text and invalid control characters."""
        if not value or not value.strip():
            raise ValueError("Text must not be empty")
        _reject_control_characters(value, "Text", allow_newlines=True)
        return value

    @field_validator("sender")
    @classmethod
    def validate_sender(cls, value: str | None) -> str | None:
        """Trim the sender and reject control characters."""
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            return None
        _reject_control_characters(cleaned, "Sender")
        return cleaned

    @field_validator("source_app")
    @classmethod
    def validate_source_app(cls, value: str | None) -> str | None:
        """Trim the package name and reject control characters."""
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            return None
        _reject_control_characters(cleaned, "Source app")
        return cleaned


class QuickDetectionResponse(BaseModel):
    """Compact risk assessment for a notification.

    Contains no message content, no credentials and no token material. Reasons
    are derived from matched rule names only, never from AI-generated text.
    """

    risk_score: int = Field(..., ge=0, le=100, description="Risk score (0-100).")
    risk_level: Literal["Low", "Medium", "High", "Critical"] = Field(
        ..., description="Existing project risk band for the score."
    )
    category: str = Field(..., description="Detection category from the existing rule engine.")
    warning_text: str = Field(
        ...,
        max_length=QUICK_WARNING_MAX_LENGTH,
        description="Short user-facing warning (max 120 characters).",
    )
    reasons: list[str] = Field(
        default_factory=list,
        max_length=QUICK_MAX_REASONS,
        description="At most three concise reasons derived from matched indicators.",
    )
    analysis_type: Literal["hybrid", "rule_and_url", "rule_based_only"] = Field(
        ...,
        description=(
            "Source of the result: hybrid = validated AI merged, "
            "rule_and_url = rules plus URL analysis, rule_based_only = rules only."
        ),
    )
