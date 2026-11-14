"""Pydantic schemas for Android device registration and management."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator

DEVICE_NAME_MAX_LENGTH = 100


class DeviceRegisterRequest(BaseModel):
    """Device registration request. Unknown fields are rejected."""

    model_config = ConfigDict(extra="forbid")

    device_name: str = Field(
        ...,
        min_length=1,
        max_length=DEVICE_NAME_MAX_LENGTH,
        description="Human-readable device label, for example 'Raj Android Phone'",
    )

    @field_validator("device_name")
    @classmethod
    def normalize_device_name(cls, value: str) -> str:
        """Reject control characters and collapse runs of whitespace."""
        if any(not ch.isprintable() for ch in value):
            raise ValueError("Device name must not contain control characters")
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("Device name is required")
        return cleaned


class DeviceInfo(BaseModel):
    """Safe device metadata. Never includes the token or its hash."""

    id: int
    device_name: str
    created_at: str | None = None
    expires_at: str | None = None
    last_used_at: str | None = None
    revoked_at: str | None = None
    is_active: bool


class DeviceRegistrationResponse(BaseModel):
    """Registration response; ``token`` is returned only in this response."""

    success: bool = True
    device: DeviceInfo
    token: str = Field(..., description="Raw device token, shown once")
    token_type: str = "device"


class DeviceListResponse(BaseModel):
    """The authenticated user's devices."""

    success: bool = True
    devices: list[DeviceInfo] = Field(default_factory=list)


class DeviceTokenRotationResponse(BaseModel):
    """Rotation response; the previous token is no longer valid."""

    success: bool = True
    device: DeviceInfo
    token: str = Field(..., description="New raw device token, shown once")
    token_type: str = "device"


class DeviceRevokeResponse(BaseModel):
    """Result of revoking a device."""

    success: bool = True
    device_id: int
    revoked_at: str | None = None
