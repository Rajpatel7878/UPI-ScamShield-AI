"""SQLAlchemy base class for all ORM models."""

from sqlalchemy.ext.declarative import declarative_base

# Base class for all database models
Base = declarative_base()

# Alias for type hints
ModelType = type[Base]