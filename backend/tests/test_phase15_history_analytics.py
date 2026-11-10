import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database.base import Base
from app.main import app
from app.core.dependencies import get_current_user, get_db_session
from app.models.scan import Scan
from app.models.user import User


def make_client():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    engine = create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False}, future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False, future=True)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    user1 = User(email="u1@example.com", hashed_password="hashed", full_name="User One", is_active=True)
    user2 = User(email="u2@example.com", hashed_password="hashed", full_name="User Two", is_active=True)
    db.add_all([user1, user2])
    db.commit()
    db.refresh(user1)
    db.refresh(user2)

    now = datetime.now(timezone.utc)
    scans = [
        Scan(user_id=user1.id, content_type="sms", risk_score=90, risk_level="Critical", category="Credential Theft", summary="Critical SMS scam", indicators=[{"name": "OTP request", "severity": "high", "description": "Asks for OTP", "source": "rule_based"}], recommendations=["Do not share OTP"], created_at=now - timedelta(days=1)),
        Scan(user_id=user1.id, content_type="whatsapp", risk_score=55, risk_level="Medium", category="Payment Fraud", summary="Suspicious WhatsApp", indicators=[{"name": "Urgency", "severity": "medium", "description": "Urgent tone", "source": "rule_based"}], recommendations=["Verify sender"], created_at=now - timedelta(days=2)),
        Scan(user_id=user1.id, content_type="url", risk_score=20, risk_level="Low", category="General", summary="Low risk URL", indicators=[], recommendations=["Stay cautious"], created_at=now - timedelta(days=10)),
        Scan(user_id=user2.id, content_type="sms", risk_score=85, risk_level="High", category="Phishing", summary="Other user scan", indicators=[], recommendations=[], created_at=now),
    ]
    db.add_all(scans)
    db.commit()

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    def override_user():
        # return fresh attached user
        session = TestingSessionLocal()
        try:
            return session.get(User, user1.id)
        finally:
            session.close()

    # Better: dependency returns user from same request db context by id; simpler to override with object having id
    class U:
        pass
    u = U()
    u.id = user1.id
    u.email = user1.email
    u.is_active = True

    app.dependency_overrides[get_db_session] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: u

    client = TestClient(app)
    return client, app, path, user1.id, user2.id


def cleanup(client_app, path):
    client_app.dependency_overrides.clear()
    try:
        os.remove(path)
    except Exception:
        pass


def test_history_requires_auth():
    # clear overrides to test unauthenticated
    app.dependency_overrides.clear()
    client = TestClient(app)
    res = client.get("/api/v1/detect/history")
    assert res.status_code in (401, 403)


def test_history_returns_only_current_user_and_pagination():
    client, app_, path, u1, u2 = make_client()
    try:
        res = client.get("/api/v1/detect/history?page=1&limit=2")
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["items"]) <= 2
        assert data["pagination"]["total"] == 3
        assert all(item["id"] != 4 for item in data["items"]) if any(i.get("id")==4 for i in data["items"]) else True
    finally:
        cleanup(app_, path)


def test_history_filters_sort_search_and_empty():
    client, app_, path, u1, u2 = make_client()
    try:
        res = client.get("/api/v1/detect/history?risk_level=Critical&content_type=sms&sort_by=risk_score&sort_order=desc")
        assert res.status_code == 200
        data = res.json()
        assert data["pagination"]["total"] == 1
        assert data["items"][0]["risk_level"] == "Critical"

        res = client.get("/api/v1/detect/history?category=Payment%20Fraud")
        assert res.status_code == 200
        assert res.json()["pagination"]["total"] == 1

        res = client.get("/api/v1/detect/history?search=Critical")
        assert res.status_code == 200
        assert res.json()["pagination"]["total"] >= 1

        res = client.get("/api/v1/detect/history?start_date=2100-01-01&end_date=2100-01-02")
        assert res.status_code == 200
        assert res.json()["pagination"]["total"] == 0
        assert res.json()["items"] == []
    finally:
        cleanup(app_, path)


def test_scan_detail_owner_only_and_not_found():
    client, app_, path, u1, u2 = make_client()
    try:
        # find an owned scan id
        res = client.get("/api/v1/detect/history")
        scan_id = res.json()["items"][0]["id"]
        res = client.get(f"/api/v1/detect/history/{scan_id}")
        assert res.status_code == 200
        assert res.json()["success"] is True
        assert "scan" in res.json()
        assert "indicators" in res.json()["scan"]

        # other user's scan id is 4 in setup; should be 404 (not exposed)
        res = client.get("/api/v1/detect/history/4")
        assert res.status_code == 404

        res = client.get("/api/v1/detect/history/999999")
        assert res.status_code == 404
    finally:
        cleanup(app_, path)


def test_delete_history_user_specific():
    client, app_, path, u1, u2 = make_client()
    try:
        res = client.delete("/api/v1/detect/history")
        assert res.status_code == 200
        assert res.json()["success"] is True
        assert res.json()["deleted"] == 3

        res = client.get("/api/v1/detect/history")
        assert res.status_code == 200
        assert res.json()["pagination"]["total"] == 0
    finally:
        cleanup(app_, path)


def test_dashboard_and_analytics_stats():
    client, app_, path, u1, u2 = make_client()
    try:
        res = client.get("/api/v1/dashboard/stats")
        assert res.status_code == 200
        data = res.json()
        assert data["total_scans"] == 3
        assert data["critical_alerts"] == 1
        assert "risk_distribution" in data
        assert "daily_scan_activity" in data

        res = client.get("/api/v1/analytics/overview?days=30")
        assert res.status_code == 200
        ad = res.json()
        assert ad["total_scans"] == 3
        assert "security_insights" in ad
        assert "weekly_trends" in ad
        assert ad["period_days"] == 30

        res = client.get("/api/v1/analytics/overview?days=3650")
        assert res.status_code in (200, 422)
    finally:
        cleanup(app_, path)
