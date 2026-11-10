"""Pydantic schemas for authentication."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    """User registration request."""

    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        """Trim the display name and reject whitespace-only values."""
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("Full name is required")
        return cleaned

    @field_validator("password")
    @classmethod
    def reject_blank_password(cls, value: str) -> str:
        """Passwords must contain more than whitespace."""
        if not value.strip():
            raise ValueError("Password must not be blank")
        return value


class UserLogin(BaseModel):
    """User login request."""

    email: EmailStr = Field(...)
    password: str = Field(..., min_length=1, max_length=128)


class UserResponse(BaseModel):
    """User response schema (safe, no password hashes)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str | None = None
    email: str
    is_active: bool
    created_at: datetime | None = None


class Token(BaseModel):
    """JWT token response."""

    access_token: str = Field(..., description="Signed JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(default=1800, description="Seconds until expiration")


class TokenData(BaseModel):
    """Token data payload."""

    user_id: int | None = None
    exp: int | None = None


class PasswordChange(BaseModel):
    """Password change request."""

    old_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
