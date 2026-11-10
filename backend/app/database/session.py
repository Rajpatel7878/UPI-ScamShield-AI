"""Database session dependency for FastAPI routes and services."""

from typing import Generator

from sqlalchemy.orm import Session

from app.database.connection import session_factory, get_session as get_session_gen


def get_db_session() -> Generator[Session, None, None]:
    """Provide a database session for FastAPI dependency injection.

    Yields a SQLAlchemy Session that is automatically closed after use.
    Does not automatically commit - the caller decides when to commit.

    Usage:
        @app.get("/items/")
        def read_items(db: Session = Depends(get_db_session)):
            ...
    """
    with get_session_gen() as session:
        yield session