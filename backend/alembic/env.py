"""Alembic environment configuration.

The database URL always comes from the application settings (``DATABASE_URL``),
so local SQLite and production PostgreSQL migrations run through the same code
path. Run Alembic commands from the ``backend/`` directory.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import get_settings
from app.database.base import Base
from app.database.connection import get_database_url

# Importing the models registers every table on Base.metadata.
import app.models  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    """Return the normalized database URL for migrations."""
    settings = get_settings()
    if settings.is_production and not get_database_url():
        raise RuntimeError("DATABASE_URL must be set to run production migrations.")
    return get_database_url()


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode, emitting SQL instead of executing it."""
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode against the configured database."""
    configuration = config.get_section(config.config_ini_section, {}) or {}
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
