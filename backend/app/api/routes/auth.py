"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token
from app.core.dependencies import get_db_session, get_current_user
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, TokenData
from app.services.auth_service import register_user, authenticate_user, login_user

router = APIRouter(tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db_session),
) -> UserResponse:
    """Register a new user account.

    - **full_name**: User's full name
    - **email**: Valid email address
    - **password**: Minimum 8 characters

    Returns:
        User response without password hash

    Raises:
        400: If email already registered
    """
    try:
        return register_user(db, user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db_session),
) -> Token:
    """Login with email and password.

    - **email**: User's email address
    - **password**: Plaintext password

    Returns:
        JWT access token and expiration info

    Raises:
        401: If credentials are invalid or account is inactive
    """
    user = authenticate_user(db, login_data.email, login_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return login_user(db, login_data)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current user profile.

    Requires valid Bearer access token.

    Returns:
        User profile information (no password hash)
    """
    return UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.post("/logout")
async def logout() -> dict:
    """Logout client-side token removal.

    For a stateless JWT system, this endpoint acknowledges that
    the client should remove the token. The server does not
    magically revoke already-issued tokens.

    Returns:
        Confirmation message
    """
    return {"message": "Token should be client-side removed. Stateless JWT does not server-side revoke."}