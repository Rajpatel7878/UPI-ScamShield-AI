"""SQLAlchemy engine and session configuration."""

import logging
import os

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base

logger = logging.getLogger(__name__)

DEFAULT_DATABASE_URL = "sqlite:///./scamshield.db"

# Hosting platforms hand out ``postgres://`` or ``postgresql://`` URLs, which
# SQLAlchemy maps to the psycopg2 driver. Only psycopg (v3) is installed, so the
# scheme is normalised here instead of asking operators to edit the URL.
POSTGRES_PREFIXES = ("postgres://", "postgresql://", "postgresql+psycopg2://")


def get_database_url() -> str:
    """Return the configured database URL, normalised for the installed driver."""
    raw = (os.getenv("DATABASE_URL") or "").strip()
    if not raw:
        return DEFAULT_DATABASE_URL

    for prefix in POSTGRES_PREFIXES:
        if raw.startswith(prefix):
            return "postgresql+psycopg://" + raw[len(prefix):]
    return raw


# DATABASE_URL environment variable format:
# SQLite: sqlite:///./scamshield.db
# PostgreSQL: postgresql://user:password@host/dbname (normalised to psycopg)
DATABASE_URL = get_database_url()

# Engine configuration
# - echo=False: SQL statements and their parameters are never logged, which
#   keeps submitted content out of application logs
# - future=True: use SQLAlchemy 2.0 style
# - connect_args/pool settings are database-specific
_engine_options: dict = {"echo": False, "future": True}
if DATABASE_URL.startswith("sqlite"):
    _engine_options["connect_args"] = {"check_same_thread": False}
else:
    # Recover from database restarts and avoid handing out dead connections.
    _engine_options["pool_pre_ping"] = True
    _engine_options["pool_recycle"] = 1800
    _engine_options["pool_size"] = 5
    _engine_options["max_overflow"] = 5

engine: Engine = create_engine(DATABASE_URL, **_engine_options)

if DATABASE_URL != DEFAULT_DATABASE_URL:
    logger.info("Database driver configured: %s", engine.url.get_backend_name())

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
