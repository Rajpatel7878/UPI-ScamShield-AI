"""JWT and password security configuration."""

import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import EmailStr

# Argon2 password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT Configuration
# In production, set these via environment variables
JWT_SECRET_KEY = secrets.token_urlsafe(32)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its Argon2 hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using Argon2."""
    return pwd_context.hash(password)


def create_access_token(
    subject: int | str,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT access token.

    Args:
        subject: The token subject (typically user ID)
        expires_delta: Token expiration time delta

    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": str(subject),
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }

    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT access token.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload, or None if invalid/expired
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def get_current_user_from_token(token: str) -> dict | None:
    """Extract current user from JWT token.

    Args:
        token: JWT token string (without Bearer prefix)

    Returns:
        Token payload dict if valid, None otherwise
    """
    return decode_access_token(token)


# Email validation helper
def validate_email(email: str) -> EmailStr:
    """Validate email format using Pydantic EmailStr."""
    try:
        return EmailStr(email)
    except Exception:
        raise ValueError("Invalid email format")