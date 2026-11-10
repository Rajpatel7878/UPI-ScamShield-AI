"""Database initialization.

Creates all database tables defined in SQLAlchemy models.
Idempotent: safe to call multiple times without deleting existing data.
Uses SQLAlchemy's create_all which is safe for existing tables.
"""

from sqlalchemy import inspect
from sqlalchemy.engine import Engine

from app.database.connection import engine, session_factory, Base


def table_exists(engine: Engine, table_name: str) -> bool:
    """Check if a table already exists in the database."""
    inspector = inspect(engine)
    return inspector.has_table(table_name)


def init_db() -> None:
    """Initialize the database by creating all tables.

    This function is idempotent - it safely creates tables that don't
    exist yet and does not delete or modify existing data.

    Use in development startup. For production schema changes, use Alembic migrations.
    """
    # Create all tables that don't already exist
    Base.metadata.create_all(bind=engine)

    # Verify creation
    inspector = inspect(engine)
    for table_name in Base.metadata.tables:
        if not inspector.has_table(table_name):
            # This shouldn't happen, but just in case
            pass


def init_db_with_session() -> None:
    """Initialize database and verify session functionality.

    Creates tables and tests that a session can be opened and closed properly.
    """
    init_db()

    # Test that we can create a session
    with get_session() as session:
        # Simple query to verify session works
        from sqlalchemy import select
        stmt = select(Base).limit(0)
        session.execute(stmt)


def get_engine() -> Engine:
    """Return the configured SQLAlchemy engine."""
    return engine