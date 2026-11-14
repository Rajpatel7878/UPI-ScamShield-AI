"""UTC timestamp helpers.

SQLite stores ``DateTime(timezone=True)`` values without an offset, so values
read back from the database are naive even though they were written as UTC.
Always serialising them with an explicit UTC offset keeps browsers from
interpreting stored UTC times as local time.
"""

from datetime import datetime, timezone


def as_utc(value: datetime | None) -> datetime | None:
    """Return a timezone-aware UTC datetime, assuming UTC for naive values."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def utc_iso(value: datetime | None) -> str | None:
    """Return an ISO-8601 UTC string with an explicit offset."""
    normalized = as_utc(value)
    return normalized.isoformat() if normalized else None
