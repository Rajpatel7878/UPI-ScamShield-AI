"""Authentication service business logic."""

import logging

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import Token, TokenData, UserCreate, UserLogin, UserResponse

logger = logging.getLogger(__name__)


def register_user(db: Session, user_data: UserCreate) -> UserResponse:
    """Register a new user.

    Raises:
        ValueError: If the email already exists.
    """
    email = str(user_data.email).strip().lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise ValueError("Email already registered")

    db_user = User(
        email=email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
    )
    db.add(db_user)
    try:
        db.commit()
    except IntegrityError:
        # Handles the race where two requests register the same email at once.
        db.rollback()
        raise ValueError("Email already registered")
    db.refresh(db_user)

    return UserResponse.model_validate(db_user)


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Authenticate a user with email and password.

    Uses the same failure result for unknown emails and wrong passwords so the
    response does not disclose whether an account exists.
    """
    normalized_email = str(email).strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def login_user(db: Session, user_login: UserLogin) -> Token:
    """Authenticate a user and issue a JWT access token.

    Raises:
        ValueError: If credentials are invalid or the account is inactive.
    """
    user = authenticate_user(db, user_login.email, user_login.password)
    if user is None:
        raise ValueError("Incorrect email or password")

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        expires_in=get_settings().access_token_expire_minutes * 60,
    )


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Get a user by primary key."""
    return db.get(User, user_id)


def get_token_payload(token: str) -> TokenData | None:
    """Extract and validate a token payload."""
    payload = decode_access_token(token)
    if payload is None:
        return None
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        return None
    return TokenData(user_id=user_id)


def verify_token_and_get_user(db: Session, token: str) -> User | None:
    """Verify a JWT and return the associated active user."""
    token_data = get_token_payload(token)
    if token_data is None or token_data.user_id is None:
        return None
    user = get_user_by_id(db, token_data.user_id)
    if user is None or not user.is_active:
        return None
    return user
