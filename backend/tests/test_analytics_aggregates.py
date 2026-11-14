"""Regression tests for the SQL analytics aggregates and time-range filters.

Set ``TEST_POSTGRES_URL`` to run these tests against a disposable PostgreSQL
database (the CI workflow does this). When unset, a temporary SQLite database
is used. PostgreSQL tests create their own rows and delete them between tests;
they do not drop or reset the schema.
"""

import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete, event, select
from sqlalchemy.dialects import postgresql, sqlite
from sqlalchemy.orm import sessionmaker

from app.api.routes.dashboard import _compute_stats, _scan_day_expression
from app.core.dependencies import get_current_user, get_db_session
from app.core.time_utils import as_utc
from app.database.base import Base
from app.main import app
from app.models.scan import Scan
from app.models.user import User

POSTGRES_URL = os.getenv("TEST_POSTGRES_URL")
USE_POSTGRES = bool(POSTGRES_URL)


@pytest.fixture(scope="module")
def db_engine(tmp_path_factory):
    """Create the test engine and ensure the schema exists.

    On PostgreSQL the schema is normally created by Alembic in CI first;
    ``create_all`` is idempotent and covers a fresh test database.
    """
    if USE_POSTGRES:
        engine = create_engine(POSTGRES_URL, future=True, pool_pre_ping=True)
    else:
        path = tmp_path_factory.mktemp("analytics") / "analytics.db"
        engine = create_engine(
            f"sqlite:///{path}",
            future=True,
            connect_args={"check_same_thread": False},
        )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db(db_engine):
    """Provide a clean session; rows are removed before each test."""
    session_factory = sessionmaker(
        bind=db_engine,
        autoflush=False,
        expire_on_commit=False,
        future=True,
    )
    session = session_factory()
    session.execute(delete(Scan))
    session.execute(delete(User))
    session.commit()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


def _stamp(now: datetime, days_ago: int) -> datetime:
    """Return a UTC timestamp suitable for the active test database."""
    value = now - timedelta(days=days_ago)
    return value if USE_POSTGRES else value.replace(tzinfo=None)


def _seed(db):
    """Seed one user with edge-case scans and a second user for isolation."""
    now = datetime.now(timezone.utc)
    user_one = User(
        email="analytics-one@example.com",
        hashed_password="x",
        full_name="Analytics One",
        is_active=True,
    )
    user_two = User(
        email="analytics-two@example.com",
        hashed_password="x",
        full_name="Analytics Two",
        is_active=True,
    )
    db.add_all([user_one, user_two])
    db.commit()
    db.refresh(user_one)
    db.refresh(user_two)

    records = [
        # summary, user, risk level, score, content type, category, indicators, days ago
        ("scan a", user_one, "Critical", 90, "sms", "Credential Theft",
         [{"name": "OTP Request"}, {"indicator": "Urgency"}], 1),
        ("scan b", user_one, "critical ", 100, "SMS", "credential theft",
         [{"name": "OTP Request"}, {"name": "OTP Request"}], 2),
        ("scan c", user_one, "HIGH", 50, " whatsapp ", "  Payment Fraud  ",
         [{"name": "OTP Request"}, {"name": "Fake Reward"}], 10),
        ("scan d", user_one, "Medium", 0, "url", "",
         [{"name": "Fake Reward"}], 3),
        ("scan e", user_one, "Low", None, "", None, [], 40),
        ("scan f", user_one, None, 25, "general", "Impersonation",
         [{"name": "Urgency"}], 400),
        ("scan g", user_one, "weird", 75, "general", "Impersonation", None, 5),
    ]
    scans = []
    for summary, user, level, score, content_type, category, indicators, days in records:
        scan = Scan(
            user_id=user.id,
            summary=summary,
            risk_level=level,
            risk_score=score,
            content_type=content_type,
            category=category,
            indicators=indicators,
            created_at=_stamp(now, days),
        )
        db.add(scan)
        scans.append(scan)

    other = Scan(
        user_id=user_two.id,
        summary="other user",
        risk_level="Critical",
        risk_score=99,
        content_type="sms",
        category="Other",
        indicators=[{"name": "Other"}],
        created_at=_stamp(now, 1),
    )
    db.add(other)
    db.commit()
    return user_one, user_two, scans


def test_aggregates_match_seeded_dataset(db):
    user_one, _, scans = _seed(db)

    stats = _compute_stats(db, user_one.id)

    assert stats["total_scans"] == 7
    assert stats["suspicious_scans"] == 4
    assert stats["critical_alerts"] == 2
    assert stats["average_risk_score"] == 56.67
    assert stats["risk_distribution"] == {
        "Low": 1,
        "Medium": 1,
        "High": 1,
        "Critical": 2,
    }
    assert stats["content_type_distribution"] == {
        "sms": 2,
        "whatsapp": 1,
        "url": 1,
        "unknown": 1,
        "general": 2,
    }
    assert stats["detection_category_distribution"] == {
        "Credential Theft": 1,
        "credential theft": 1,
        "Payment Fraud": 1,
        "Unknown": 2,
        "Impersonation": 2,
    }
    assert stats["most_frequent_indicators"] == [
        {"name": "OTP Request", "count": 4},
        {"name": "Urgency", "count": 2},
        {"name": "Fake Reward", "count": 2},
    ]

    daily = stats["daily_scan_activity"]
    assert len(daily) == 7
    assert sum(item["count"] for item in daily) == 7
    assert [item["date"] for item in daily] == sorted(item["date"] for item in daily)
    assert sum(item["count"] for item in stats["weekly_trends"]) == 7
    assert sum(item["count"] for item in stats["monthly_trends"]) == 7
    assert [item["period"] for item in stats["weekly_trends"]] == sorted(
        item["period"] for item in stats["weekly_trends"]
    )

    assert [item["summary"] for item in stats["recent_scans"]] == [
        "scan a",
        "scan b",
        "scan d",
        "scan g",
        "scan c",
    ]
    assert len(stats["recent_scans"]) == 5
    for recent in stats["recent_scans"]:
        assert recent["created_at"].endswith(("Z", "+00:00"))

    assert as_utc(stats["most_recent_scan_date"]) == as_utc(scans[0].created_at)
    assert stats["security_insights"] == stats["risk_insights"]
    assert stats["recent_activity"] == stats["daily_scan_activity"]
    assert "4 of 7 scans were flagged as suspicious or higher risk." in stats["security_insights"]
    assert "2 critical-risk scan(s) were detected in this period." in stats["security_insights"]


def test_time_range_filters_and_empty_period(db):
    user_one, user_two, _ = _seed(db)

    last_week = _compute_stats(db, user_one.id, days=7)
    assert last_week["total_scans"] == 4  # 1, 2, 3 and 5 days ago
    assert last_week["suspicious_scans"] == 3
    assert last_week["critical_alerts"] == 2
    assert sum(item["count"] for item in last_week["daily_scan_activity"]) == 4

    last_month = _compute_stats(db, user_one.id, days=30)
    assert last_month["total_scans"] == 5  # adds the 10-day-old scan
    assert last_month["average_risk_score"] == 63.0

    all_time = _compute_stats(db, user_one.id, days=None)
    assert all_time["total_scans"] == 7

    too_recent = _compute_stats(db, user_one.id, days=1)
    assert too_recent["total_scans"] == 0
    assert too_recent["average_risk_score"] == 0.0
    assert too_recent["most_recent_scan_date"] is None
    assert too_recent["security_insights"] == [
        "No scans recorded yet. Run your first analysis to see security insights."
    ]

    other_user = _compute_stats(db, user_two.id)
    assert other_user["total_scans"] == 1
    assert other_user["critical_alerts"] == 1
    assert other_user["risk_distribution"] == {
        "Low": 0,
        "Medium": 0,
        "High": 0,
        "Critical": 1,
    }
    assert other_user["most_frequent_indicators"] == [{"name": "Other", "count": 1}]
    assert "OTP Request" not in [item["name"] for item in other_user["most_frequent_indicators"]]


def test_query_count_does_not_grow_with_scan_count(db, db_engine):
    """Aggregates must be batched, not executed per scan."""
    user = User(
        email="query-count@example.com",
        hashed_password="x",
        full_name="Query Count",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    now = datetime.now(timezone.utc)
    for index in range(3):
        db.add(Scan(
            user_id=user.id,
            content_type="sms",
            risk_level="Low",
            risk_score=index,
            category="General",
            summary=f"small {index}",
            indicators=[{"name": "Indicator"}],
            created_at=_stamp(now, index + 1),
        ))
    db.commit()

    statements = []

    def count_selects(conn, cursor, statement, parameters, context, executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            statements.append(statement)

    event.listen(db_engine, "before_cursor_execute", count_selects)
    try:
        _compute_stats(db, user.id)
        small_count = len(statements)
        statements.clear()

        for index in range(25):
            db.add(Scan(
                user_id=user.id,
                content_type="sms",
                risk_level="Low",
                risk_score=index,
                category="General",
                summary=f"large {index}",
                indicators=[{"name": "Indicator"}],
                created_at=_stamp(now, index + 2),
            ))
        db.commit()
        statements.clear()

        _compute_stats(db, user.id)
        large_count = len(statements)
    finally:
        event.remove(db_engine, "before_cursor_execute", count_selects)

    assert small_count == large_count
    assert small_count <= 10


def test_api_endpoints_expose_aggregates_and_validate_days(db):
    user_one, _, _ = _seed(db)
    engine = db.get_bind()
    session_factory = sessionmaker(
        bind=engine,
        autoflush=False,
        expire_on_commit=False,
        future=True,
    )

    def override_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    class CurrentUser:
        id = user_one.id
        email = user_one.email
        is_active = True

    app.dependency_overrides[get_db_session] = override_db
    app.dependency_overrides[get_current_user] = lambda: CurrentUser()
    client = TestClient(app)
    try:
        response = client.get("/api/v1/dashboard/stats")
        assert response.status_code == 200
        body = response.json()
        assert body["total_scans"] == 7
        assert body["risk_distribution"]["Critical"] == 2
        assert len(body["recent_scans"]) == 5

        response = client.get("/api/v1/analytics/overview?days=7")
        assert response.status_code == 200
        body = response.json()
        assert body["period_days"] == 7
        assert body["total_scans"] == 4
        assert sum(item["count"] for item in body["weekly_trends"]) == 4

        response = client.get("/api/v1/analytics/overview?days=30")
        assert response.status_code == 200
        assert response.json()["total_scans"] == 5

        assert client.get("/api/v1/analytics/overview?days=0").status_code == 422
        assert client.get("/api/v1/analytics/overview?days=3661").status_code == 422
    finally:
        app.dependency_overrides.clear()
        client.close()


def test_postgres_day_expression_compiles_for_postgres_dialect():
    """Guard the PostgreSQL-only UTC day conversion without a live server."""
    class PostgresBind:
        dialect = postgresql.dialect()

    class FakeSession:
        def get_bind(self):
            return PostgresBind()

    expression = _scan_day_expression(FakeSession())
    compiled = str(select(expression).compile(
        dialect=postgresql.dialect(),
        compile_kwargs={"literal_binds": True},
    ))

    assert "timezone('UTC', scans.created_at)" in compiled
    assert "date(" in compiled


def test_sqlite_day_expression_skips_timezone_conversion():
    class SqliteBind:
        dialect = sqlite.dialect()

    class FakeSession:
        def get_bind(self):
            return SqliteBind()

    expression = _scan_day_expression(FakeSession())
    compiled = str(select(expression).compile(dialect=sqlite.dialect()))

    assert "timezone(" not in compiled
    assert "date(scans.created_at)" in compiled
