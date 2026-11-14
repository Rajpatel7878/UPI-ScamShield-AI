"""Database schema initialization.

Development: create any missing tables and indexes with SQLAlchemy's
``create_all``, which is idempotent and never deletes records.

Production: the schema is owned by Alembic migrations (``alembic upgrade head``).
Startup only *verifies* that the expected tables exist and fails with an
actionable message when they do not. ``create_all`` is deliberately skipped so a
misconfigured deployment cannot silently create a partial schema, and no
destructive operation (``drop_all``, resets) exists anywhere in the codebase.
"""

import logging

from sqlalchemy import inspect
from sqlalchemy.engine import Engine

from app.database.connection import engine
from app.database.base import Base

# Importing the models registers them on Base.metadata.
import app.models  # noqa: F401  (imported for its side effect)

logger = logging.getLogger(__name__)

REQUIRED_TABLES = ("users", "scans", "devices")


def table_exists(engine: Engine, table_name: str) -> bool:
    """Check if a table already exists in the database."""
    inspector = inspect(engine)
    return inspector.has_table(table_name)


def missing_tables() -> list[str]:
    """Return the required tables that are absent from the database."""
    inspector = inspect(engine)
    existing = set(inspector.get_table_names())
    return [name for name in REQUIRED_TABLES if name not in existing]


def init_db() -> None:
    """Prepare the database schema for the current environment.

    Raises:
        RuntimeError: in production when migrations have not been applied.
    """
    from app.core.config import get_settings

    if get_settings().is_production:
        missing = missing_tables()
        if missing:
            raise RuntimeError(
                "Database schema is not initialised; missing table(s): "
                + ", ".join(missing)
                + ". Run 'alembic upgrade head' from the backend directory "
                "before starting the server."
            )
        logger.info("Production schema verified (%s)", ", ".join(REQUIRED_TABLES))
        return

    # Development / local: create missing tables and indexes. Idempotent and
    # additive only - existing data is never dropped or rewritten.
    Base.metadata.create_all(bind=engine)

    # create_all does not add new indexes to tables that already exist. Create
    # any missing indexes explicitly; checkfirst makes this idempotent.
    for table in Base.metadata.tables.values():
        for index in table.indexes:
            index.create(bind=engine, checkfirst=True)

    logger.info("Schema ready (development create_all)")


def get_engine() -> Engine:
    """Return the configured SQLAlchemy engine."""
    return engine
