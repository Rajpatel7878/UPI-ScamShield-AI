"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db_session
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse
from app.services.auth_service import login_user, register_user

router = APIRouter(tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db_session),
) -> UserResponse:
    """Register a new user account.

    Passwords are hashed with Argon2 and never returned. Duplicate emails are
    rejected without revealing account details beyond the conflict itself.
    """
    try:
        return register_user(db, user_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db_session),
) -> Token:
    """Authenticate and return a short-lived JWT access token.

    The password is verified exactly once. Unknown emails and wrong passwords
    return the same generic error.
    """
    try:
        return login_user(db, login_data)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the authenticated user's profile (no password hash)."""
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout() -> dict:
    """Acknowledge client-side token removal.

    JWTs are stateless, so the server cannot revoke an already-issued token
    without a denylist. Clients must delete the token; tokens expire after the
    configured lifetime.
    """
    return {
        "message": (
            "Remove the access token on the client. Stateless JWTs cannot be "
            "revoked server-side; they expire automatically."
        )
    }
