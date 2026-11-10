"""SQLAlchemy engine and session configuration."""

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base

import os

# DATABASE_URL environment variable format:
# SQLite: sqlite:///./scamshield.db
# PostgreSQL: postgresql://user:password@host/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./scamshield.db")

# Engine configuration
# - echo=False: disable SQL logging (set True for debugging)
# - future=True: use SQLAlchemy 2.0 style
# - connect_args: SQLite-specific settings
engine: Engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False},
)

# Session factory
# - autocommit=False: manual commit control
# - autoflush=False: manual flush control  
# - expire_on_commit=False: keep attributes accessible after commit
session_factory = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    future=True,
)


def get_session() -> Session:
    """Get a new database session.

    Yields a Session that should be closed after use.
    """
    session = session_factory()
    try:
        yield session
    finally:
        session.close()