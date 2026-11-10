"""JWT and password security configuration."""

import logging
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Argon2 password hashing. Argon2id is the passlib default for the argon2 scheme.
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

ALLOWED_JWT_ALGORITHMS = {"HS256", "HS384", "HS512"}
WEAK_SECRETS = {
    "secret",
    "changeme",
    "change-me",
    "your-secret-key",
    "supersecret",
    "development",
}

settings = get_settings()

JWT_ALGORITHM = settings.jwt_algorithm.strip().upper()
if JWT_ALGORITHM not in ALLOWED_JWT_ALGORITHMS:
    raise RuntimeError(
        "Unsupported JWT algorithm. Set JWT_ALGORITHM to one of: "
        + ", ".join(sorted(ALLOWED_JWT_ALGORITHMS))
    )

JWT_SECRET_KEY = (settings.jwt_secret_key or "").strip()
if settings.is_production:
    if len(JWT_SECRET_KEY) < 32:
        raise RuntimeError(
            "JWT_SECRET_KEY must be set to at least 32 characters in production."
        )
    if JWT_SECRET_KEY.lower() in WEAK_SECRETS:
        raise RuntimeError("JWT_SECRET_KEY is a known weak value; refusing to start.")
elif not JWT_SECRET_KEY:
    # Development fallback: tokens are invalidated on every process restart.
    # Production never reaches this branch.
    JWT_SECRET_KEY = secrets.token_urlsafe(48)
    logger.warning(
        "JWT_SECRET_KEY is not set; using an ephemeral development secret. "
        "Set JWT_SECRET_KEY to keep sessions valid across restarts."
    )

ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
JWT_ISSUER = "upi-scamshield"
JWT_AUDIENCE = "upi-scamshield-web"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its Argon2 hash.

    Returns False for malformed stored hashes instead of raising, so a corrupt
    record cannot crash the login endpoint.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        logger.warning("Password verification failed due to a malformed hash")
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using Argon2."""
    return pwd_context.hash(password)


def create_access_token(
    subject: int | str,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token."""
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT access token.

    The algorithm list is fixed to the configured algorithm, which prevents
    ``alg=none`` and algorithm-confusion attacks. Issuer, audience, expiry and
    token type are all verified.
    """
    if not token or not isinstance(token, str):
        return None
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
            options={"require": ["exp", "iat", "sub", "iss", "aud"]},
        )
    except jwt.PyJWTError:
        return None

    if payload.get("type") != "access":
        return None
    subject = payload.get("sub")
    if subject is None or str(subject).strip() == "":
        return None
    return payload


def get_current_user_from_token(token: str) -> dict | None:
    """Extract token payload from a raw bearer token."""
    return decode_access_token(token)
