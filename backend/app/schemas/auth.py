"""Pydantic schemas for authentication."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, validator


class UserCreate(BaseModel):
    """User registration request."""

    full_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)

    @validator("email")
    def validate_email_format(cls, v: str) -> str:
        """Validate email format."""
        if "@" not in v:
            raise ValueError("Invalid email format")
        return v

    @validator("password")
    def validate_password_strength(cls, v: str) -> str:
        """Validate minimum password length."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserLogin(BaseModel):
    """User login request."""

    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class UserResponse(BaseModel):
    """User response schema (safe, no password hashes)."""

    id: int
    full_name: str
    email: str
    is_active: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True


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

    old_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)