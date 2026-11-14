"""SQLAlchemy ORM models.

Importing the models here registers them on ``Base.metadata``, which is what
schema creation (development) and Alembic autogenerate (migrations) rely on.
"""

from app.models.device import Device
from app.models.scan import Scan
from app.models.user import User

__all__ = ["Device", "Scan", "User"]
