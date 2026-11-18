"""Tests for the device-authenticated quick detection endpoint and pipeline.

All AI calls are mocked: no provider key is required and no credits are spent.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.api.routes import detect as detect_routes
from app.core.config import get_settings
from app.core.dependencies import get_db_session
from app.core.device_auth import generate_device_token, hash_device_token
from app.core.device_rate_limit import quick_scan_limiter
from app.database.base import Base
from app.main import app
from app.models.device import Device
from app.models.quick_scan_event import QuickScanEvent
from app.models.scan import Scan
from app.models.user import User
from app.schemas.detection import GeminiAnalysisResult, GeminiIndicator
from app.services.detection.quick_analysis import AI_MAX_SCORE, AI_MIN_SCORE, risk_level_for_score

QUICK_URL = "/api/v1/detect/quick"

HIGH_RISK_TEXT = (
    "Your OTP is 482913. Enter UPI PIN 1234 immediately. "
    "Send bank account details to reactivate your account."
)
LOW_RISK_TEXT = "Hello, see you at 6 pm near the tea shop."
BORDERLINE_TEXT = "Your KYC verification failed. Act now immediately or penalty."


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    quick_scan_limiter.reset()
    yield
    quick_scan_limiter.reset()


@pytest.fixture(autouse=True)
def _no_real_ai_providers(monkeypatch):
    """Never let an un-mocked quick scan reach a real AI provider."""
    monkeypatch.setattr(detect_routes, "is_openrouter_configured", lambda: False)
    monkeypatch.setattr(detect_routes, "is_gemini_configured", lambda: False)


@pytest.fixture()
def api(tmp_path):
    """Client backed by a temporary database with two users and two devices."""
    engine = create_engine(
        f"sqlite:///{tmp_path / 'quick.db'}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
        future=True,
    )

    now = datetime.now(timezone.utc)
    with session_factory() as db:
        user_one = User(
            email="quick-one@example.com",
            hashed_password="x",
            full_name="Quick One",
            is_active=True,
        )
        user_two = User(
            email="quick-two@example.com",
            hashed_password="x",
            full_name="Quick Two",
            is_active=True,
        )
        db.add_all([user_one, user_two])
        db.commit()

        tokens = {"one": generate_device_token(), "two": generate_device_token()}
        device_one = Device(
            user_id=user_one.id,
            device_name="Phone One",
            device_token_hash=hash_device_token(tokens["one"]),
            created_at=now,
            expires_at=now + timedelta(days=90),
            is_active=True,
        )
        device_two = Device(
            user_id=user_two.id,
            device_name="Phone Two",
            device_token_hash=hash_device_token(tokens["two"]),
            created_at=now,
            expires_at=now + timedelta(days=90),
            is_active=True,
        )
        db.add_all([device_one, device_two])
        db.commit()
        ids = {
            "device_one": device_one.id,
            "device_two": device_two.id,
            "user_one": user_one.id,
            "user_two": user_two.id,
        }

    def override_get_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db_session] = override_get_db

    yield SimpleNamespace(
        client=TestClient(app),
        session_factory=session_factory,
        token_one=tokens["one"],
        token_two=tokens["two"],
        **ids,
    )

    app.dependency_overrides.clear()
    engine.dispose()


def _headers(token: str) -> dict[str, str]:
    return {"X-Device-Token": token}


def _ai_result(risk_level: str = "high", category: str = "Credential Theft") -> dict:
    """Build a provider result shaped exactly like the real services return."""
    return {
        "status": "completed",
        "provider": "openrouter",
        "model": "test-model",
        "result": GeminiAnalysisResult(
            is_suspicious=True,
            risk_level=risk_level,
            category=category,
            summary="Mocked provider analysis.",
            indicators=[
                GeminiIndicator(
                    name="OTP Request",
                    severity="critical",
                    explanation="The message asks for an OTP.",
                )
            ],
            recommendations=["Never share your OTP."],
            confidence=0.9,
        ),
    }


def _post(api, text: str, token: str | None = None, **extra):
    return api.client.post(
        QUICK_URL,
        json={"text": text, **extra},
        headers=_headers(token or api.token_one),
    )


# --- Authentication -------------------------------------------------------


def test_missing_device_token_returns_401(api):
    response = api.client.post(QUICK_URL, json={"text": LOW_RISK_TEXT})

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired device token."


def test_invalid_device_tokens_return_401(api):
    unknown = api.client.post(
        QUICK_URL,
        json={"text": LOW_RISK_TEXT},
        headers=_headers("ssdev_" + "a" * 43),
    )
    malformed = api.client.post(
        QUICK_URL,
        json={"text": LOW_RISK_TEXT},
        headers=_headers("not-a-device-token"),
    )

    assert unknown.status_code == 401
    assert malformed.status_code == 401
    assert "ssdev_" not in unknown.text


def test_revoked_device_token_returns_401(api):
    with api.session_factory() as db:
        device = db.get(Device, api.device_one)
        device.revoked_at = datetime.now(timezone.utc)
        device.is_active = False
        db.commit()

    response = _post(api, LOW_RISK_TEXT)

    assert response.status_code == 401


def test_valid_device_token_succeeds(api):
    response = _post(api, LOW_RISK_TEXT)

    assert response.status_code == 200, response.text
    body = response.json()
    assert 0 <= body["risk_score"] <= 100
    assert body["risk_level"] in {"Low", "Medium", "High", "Critical"}
    assert body["warning_text"]
    assert isinstance(body["reasons"], list)


# --- Input validation -----------------------------------------------------


@pytest.mark.parametrize("text", ["", "   ", "\n\t "])
def test_empty_text_is_rejected(api, text):
    response = _post(api, text)

    assert response.status_code == 422
    assert response.json()["detail"] == "Request validation failed."


def test_text_longer_than_2000_characters_is_rejected(api):
    response = _post(api, "a" * 2001)

    assert response.status_code == 422


def test_text_at_the_2000_character_boundary_is_accepted(api):
    response = _post(api, "a" * 2000)

    assert response.status_code == 200


def test_malformed_payloads_are_rejected(api):
    wrong_type = api.client.post(
        QUICK_URL, json={"text": ["not a string"]}, headers=_headers(api.token_one)
    )
    missing_text = api.client.post(
        QUICK_URL, json={"sender": "BANK"}, headers=_headers(api.token_one)
    )
    control_characters = _post(api, "KYC\x00verify")
    invalid_json = api.client.post(
        QUICK_URL,
        content=b"{not-json",
        headers={**_headers(api.token_one), "Content-Type": "application/json"},
    )

    for response in (wrong_type, missing_text, control_characters, invalid_json):
        assert response.status_code == 422


def test_unknown_fields_are_ignored(api):
    response = _post(api, LOW_RISK_TEXT, unexpected="value")

    assert response.status_code == 200


# --- Detection behaviour --------------------------------------------------


def test_high_rule_score_uses_rule_based_path(api, monkeypatch):
    async def forbidden(*args, **kwargs):
        raise AssertionError("AI must not be called for high rule scores")

    monkeypatch.setattr(detect_routes, "_analyze_with_ai", forbidden)

    response = _post(api, HIGH_RISK_TEXT)

    assert response.status_code == 200
    body = response.json()
    assert body["risk_score"] > AI_MAX_SCORE
    assert body["risk_level"] == "Critical"
    assert body["analysis_type"] in {"rule_based_only", "rule_and_url"}


def test_low_rule_score_uses_rule_based_path(api, monkeypatch):
    async def forbidden(*args, **kwargs):
        raise AssertionError("AI must not be called for low rule scores")

    monkeypatch.setattr(detect_routes, "_analyze_with_ai", forbidden)

    response = _post(api, LOW_RISK_TEXT)

    assert response.status_code == 200
    body = response.json()
    assert body["risk_score"] < AI_MIN_SCORE
    assert body["risk_level"] == "Low"
    assert body["analysis_type"] == "rule_based_only"
    assert body["reasons"] == []


def test_borderline_rule_score_invokes_ai_and_uses_hybrid_scoring(api, monkeypatch):
    captured: dict = {}

    async def fake_ai(content, content_type, timeout=35.0):
        captured["content"] = content
        captured["content_type"] = content_type
        captured["timeout"] = timeout
        return _ai_result(risk_level="high")

    monkeypatch.setattr(detect_routes, "_analyze_with_ai", fake_ai)

    response = _post(api, BORDERLINE_TEXT)

    assert response.status_code == 200
    body = response.json()
    assert body["analysis_type"] == "hybrid"
    # base 45 * 0.60 + 70 * 0.40 = 55, the existing 60/40 formula.
    assert body["risk_score"] == 55
    assert body["risk_level"] == "Medium"
    # The AI call is bounded and receives the masked text with rules content type.
    assert captured["timeout"] == get_settings().quick_scan_ai_timeout_seconds
    assert captured["content_type"] == "sms"
    assert AI_MIN_SCORE <= 45 <= AI_MAX_SCORE


def test_ai_failure_falls_back_to_rule_result(api, monkeypatch):
    async def failing_ai(content, content_type, timeout=35.0):
        return None

    monkeypatch.setattr(detect_routes, "_analyze_with_ai", failing_ai)

    response = _post(api, BORDERLINE_TEXT)

    assert response.status_code == 200
    body = response.json()
    assert body["analysis_type"] == "rule_based_only"
    assert body["risk_score"] == 45
    assert body["risk_level"] == "Medium"


def test_ai_exception_falls_back_to_rule_result(api, monkeypatch):
    async def raising_ai(content, content_type, timeout=35.0):
        raise RuntimeError("provider exploded with secret text: 482913")

    monkeypatch.setattr(detect_routes, "_analyze_with_ai", raising_ai)

    response = _post(api, BORDERLINE_TEXT)

    assert response.status_code == 200
    assert response.json()["analysis_type"] == "rule_based_only"
    assert "provider exploded" not in response.text


@pytest.mark.parametrize(
    ("score", "expected"),
    [
        (0, "Low"),
        (29, "Low"),
        (30, "Medium"),
        (59, "Medium"),
        (60, "High"),
        (79, "High"),
        (80, "Critical"),
        (100, "Critical"),
    ],
)
def test_risk_levels_follow_existing_thresholds(score, expected):
    assert risk_level_for_score(score) == expected


def test_response_uses_existing_thresholds(api):
    body = _post(api, HIGH_RISK_TEXT).json()

    assert body["risk_level"] == risk_level_for_score(body["risk_score"])


def test_reasons_never_exceed_three(api):
    text = (
        "Your OTP is 123456. Share UPI PIN 1234. Send bank account details. "
        "KYC will be suspended. Pay immediately. You won a lottery prize. "
        "Pay the processing fee. Approve the collect request. Visit https://secure-kyc-verify.example.top/login"
    )

    body = _post(api, text).json()

    assert len(body["reasons"]) <= 3
    assert len(set(body["reasons"])) == len(body["reasons"])


def test_warning_text_never_exceeds_120_characters(api):
    for text in (HIGH_RISK_TEXT, BORDERLINE_TEXT, LOW_RISK_TEXT):
        body = _post(api, text).json()
        assert len(body["warning_text"]) <= 120
        assert body["warning_text"]


# --- Privacy --------------------------------------------------------------


def test_ai_never_receives_unmasked_credentials(api, monkeypatch):
    captured: dict = {}

    async def fake_ai(content, content_type, timeout=35.0):
        captured["content"] = content
        return _ai_result()

    monkeypatch.setattr(detect_routes, "_analyze_with_ai", fake_ai)

    response = _post(api, "Your OTP is 482913. Enter UPI PIN 1234.")

    assert response.status_code == 200
    assert captured, "borderline score should have invoked the AI chain"
    sent = captured["content"]
    assert "482913" not in sent
    assert "1234" not in sent
    assert "[REDACTED]" in sent
    # The response itself never echoes the message or its credentials.
    assert "482913" not in response.text
    assert "1234" not in response.text


def test_raw_notification_text_is_never_logged(api, monkeypatch, caplog):
    async def fake_ai(content, content_type, timeout=35.0):
        return _ai_result()

    monkeypatch.setattr(detect_routes, "_analyze_with_ai", fake_ai)

    marker = "UNIQUE-NOTIFICATION-MARKER-9137"
    with caplog.at_level(logging.DEBUG):
        response = _post(api, f"{marker} Your KYC is expired. Verify immediately.")

    assert response.status_code == 200
    assert marker not in caplog.text


def test_store_quick_scans_disabled_creates_no_records(api, monkeypatch):
    monkeypatch.setattr(get_settings(), "store_quick_scans", False)

    marker = "UNIQUE-PERSISTENCE-MARKER-4411"
    response = _post(api, f"{marker} Your KYC is expired.", source_app="com.example.sms")

    assert response.status_code == 200
    with api.session_factory() as db:
        assert db.execute(select(QuickScanEvent)).scalars().all() == []
        assert db.execute(select(Scan)).scalars().all() == []


def test_store_quick_scans_enabled_stores_only_approved_metadata(api, monkeypatch):
    monkeypatch.setattr(get_settings(), "store_quick_scans", True)

    marker = "UNIQUE-PERSISTENCE-MARKER-7788"
    response = _post(
        api, f"{marker} Your OTP is 482913. Verify immediately.", source_app="com.example.sms"
    )

    assert response.status_code == 200
    with api.session_factory() as db:
        events = db.execute(select(QuickScanEvent)).scalars().all()
        assert len(events) == 1
        event = events[0]
        assert event.user_id == api.user_one
        assert event.device_id == api.device_one
        assert event.risk_score == response.json()["risk_score"]
        assert event.risk_level == response.json()["risk_level"]
        assert event.category == response.json()["category"]
        assert event.source_app == "com.example.sms"
        assert event.created_at is not None

        stored_values = [str(getattr(event, column.name)) for column in QuickScanEvent.__table__.columns]
        assert all(marker not in value and "482913" not in value for value in stored_values)

    assert set(QuickScanEvent.__table__.columns.keys()) == {
        "id",
        "user_id",
        "device_id",
        "risk_score",
        "risk_level",
        "category",
        "source_app",
        "created_at",
    }


# --- Rate limiting --------------------------------------------------------


def test_requests_within_the_limit_succeed(api):
    for _ in range(30):
        assert _post(api, LOW_RISK_TEXT).status_code == 200


def test_request_above_the_limit_returns_429(api):
    for _ in range(30):
        assert _post(api, LOW_RISK_TEXT).status_code == 200

    limited = _post(api, LOW_RISK_TEXT)

    assert limited.status_code == 429
    assert limited.json()["status"] == "error"
    retry_after = int(limited.headers["Retry-After"])
    assert 1 <= retry_after <= 60


def test_rate_limiting_is_isolated_by_device(api):
    for _ in range(30):
        assert _post(api, LOW_RISK_TEXT, token=api.token_one).status_code == 200

    assert _post(api, LOW_RISK_TEXT, token=api.token_one).status_code == 429
    assert _post(api, LOW_RISK_TEXT, token=api.token_two).status_code == 200
