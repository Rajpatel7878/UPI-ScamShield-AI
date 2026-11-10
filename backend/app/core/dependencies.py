"""FastAPI dependency injection for authentication and database sessions."""

from collections.abc import Generator
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.connection import session_factory
from app.models.user import User


def get_db_session() -> Generator[Session, None, None]:
    """Yield a database session and always close it.

    A transaction that raises is rolled back before the session is closed. The
    schema is created once at application startup, not on every request.
    """
    session = session_factory()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


reusable_bearer = HTTPBearer(auto_error=False)


def _unauthorized(detail: str = "Authentication required") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _user_id_from_payload(payload: dict) -> int:
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise _unauthorized()
    if user_id <= 0:
        raise _unauthorized()
    return user_id


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(reusable_bearer),
    db: Session = Depends(get_db_session),
) -> User:
    """Return the authenticated user or raise 401.

    Validates the bearer token, loads the user by primary key and rejects
    missing or inactive accounts. Resource ownership is enforced separately by
    each route (for example, every scan query is scoped by ``user_id``).
    """
    if not credentials:
        raise _unauthorized()

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise _unauthorized()

    user = db.get(User, _user_id_from_payload(payload))
    if user is None:
        raise _unauthorized()
    if not user.is_active:
        raise _unauthorized("Account is inactive")
    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(reusable_bearer),
    db: Session = Depends(get_db_session),
) -> Optional[User]:
    """Return the authenticated user, or None when no valid token is supplied."""
    if not credentials:
        return None

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        return None

    try:
        user_id = _user_id_from_payload(payload)
    except HTTPException:
        return None

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        return None
    return user
