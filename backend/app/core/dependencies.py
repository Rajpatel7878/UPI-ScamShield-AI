"""FastAPI dependency injection for authentication."""

from typing import Optional

from fastapi import HTTPException, Request, status
from fastapi.params import Depends  # NOQA: F401
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_access_token
from app.core.config import get_settings
from app.database.connection import engine, session_factory
from app.models.user import User
from sqlalchemy import select


def get_db_session() -> Session:
    """Get database session for dependency injection."""
    from app.database.init_db import init_db
    init_db()
    return session_factory()


reusable_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(reusable_bearer),
    db: Session = Depends(get_db_session),
) -> User:
    """Get the current authenticated user from Bearer token.

    This dependency:
    1. Extracts the credentials from the Authorization header
    2. Decodes and validates the JWT token
    3. Retrieves the associated user from the database
    4. Returns the user object or raises 401

    Raises:
        401: If token is missing, malformed, expired, or invalid
    """
    credentials: Optional[HTTPAuthorizationCredentials] = credentials
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode the JWT token
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user ID from token subject
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Retrieve user from database
    from sqlalchemy import select
    stmt = select(User).where(User.id == user_id)
    user = db.scalar(stmt)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(reusable_bearer),
    db: Session = Depends(get_db_session),
) -> Optional[User]:
    """Get current user optionally (returns None if not authenticated).

    Useful for routes that work both with and without authentication.
    """
    credentials: Optional[HTTPAuthorizationCredentials] = credentials
    if not credentials:
        return None

    try:
        payload = decode_access_token(credentials.credentials)
        if payload is None:
            return None

        user_id: int = payload.get("sub")
        if user_id is None:
            return None

        from sqlalchemy import select
        stmt = select(User).where(User.id == user_id)
        user = db.scalar(stmt)

        if user is None or not user.is_active:
            return None

        return user
    except Exception:
        return None