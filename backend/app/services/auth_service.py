"""Authentication service business logic."""

from sqlalchemy.orm import Session

from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, TokenData


def register_user(db: Session, user_data: UserCreate) -> UserResponse:
    """Register a new user.

    Args:
        db: Database session
        user_data: User registration data

    Returns:
        User response object (without password hash)

    Raises:
        ValueError: If email already exists
    """
    # Check for existing user with normalized email
    from sqlalchemy import select
    stmt = select(User).where(User.email == user_data.email.lower())
    existing = db.scalar(stmt)
    if existing:
        raise ValueError("Email already registered")

    # Create user with hashed password
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email.lower(),
        full_name=user_data.full_name,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return UserResponse(
        id=db_user.id,
        full_name=db_user.full_name,
        email=db_user.email,
        is_active=db_user.is_active,
        created_at=db_user.created_at,
    )


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Authenticate a user with email and password.

    Args:
        db: Database session
        email: User email (normalized)
        password: Plaintext password

    Returns:
        User object if authentication successful, None otherwise
    """
    # Normalize email
    normalized_email = email.lower().strip()

    # Query user by normalized email
    from sqlalchemy import select
    stmt = select(User).where(User.email == normalized_email)
    user = db.scalar(stmt)

    if not user:
        return None

    # Verify password against Argon2 hash
    if not verify_password(password, user.hashed_password):
        return None

    # Check account is active
    if not user.is_active:
        return None

    return user


def login_user(db: Session, user_login: UserLogin) -> Token:
    """Login user and generate JWT access token.

    Args:
        db: Database session
        user_login: Login credentials

    Returns:
        Token response with access token

    Raises:
        ValueError: If credentials are invalid or account is inactive
    """
    user = authenticate_user(db, user_login.email, user_login.password)
    if user is None:
        raise ValueError("Incorrect email or password")

    # Create access token
    access_token = create_access_token(subject=user.id)

    return Token(
        access_token=access_token,
        expires_in=1800,  # 30 minutes
    )


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Get user by ID.

    Args:
        db: Database session
        user_id: User primary key

    Returns:
        User object or None
    """
    from sqlalchemy import select
    stmt = select(User).where(User.id == user_id)
    return db.scalar(stmt)


def get_token_payload(token: str) -> TokenData | None:
    """Extract and validate token payload.

    Args:
        token: JWT access token

    Returns:
        TokenData if valid, None otherwise
    """
    payload = decode_access_token(token)
    if payload is None:
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    return TokenData(user_id=int(user_id))


def verify_token_and_get_user(db: Session, token: str) -> User | None:
    """Verify a JWT token and return the associated user.

    Args:
        db: Database session
        token: JWT access token string

    Returns:
        User object if token is valid and user exists, None otherwise
    """
    payload = decode_access_token(token)
    if payload is None:
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    user = get_user_by_id(db, int(user_id))
    if user is None:
        return None

    # Check account is still active
    if not user.is_active:
        return None

    return user