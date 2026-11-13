"""Mocked tests for the OpenRouter AI provider integration.

No network access: every test injects an ``httpx.MockTransport`` so provider
behavior is deterministic and the real API key is never used.
"""

import asyncio
import json

import httpx
import pytest

import app.api.routes.detect as detect
import app.services.detection.openrouter_service as openrouter_module
from app.services.detection.hybrid_scorer import HybridScorer
from app.services.detection.openrouter_service import (
    OpenRouterService,
    is_openrouter_configured,
)

TEST_KEY = "sk-or-v1-test-key-not-real"
CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"


def _analysis_payload(
    *,
    is_suspicious=True,
    risk_level="high",
    category="Credential Theft",
    indicators=None,
    recommendations=None,
    confidence=0.9,
):
    return {
        "is_suspicious": is_suspicious,
        "risk_level": risk_level,
        "category": category,
        "summary": "Mocked analysis of the submitted message.",
        "indicators": indicators
        if indicators is not None
        else [
            {
                "name": "OTP Request",
                "severity": "critical",
                "explanation": "The message asks for an OTP.",
            }
        ],
        "recommendations": recommendations
        if recommendations is not None
        else ["Never share your OTP with anyone."],
        "confidence": confidence,
    }


def _chat_response(payload, *, content=None, status=200):
    body = {
        "id": "gen-test",
        "model": "google/gemini-3.5-flash",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": content
                    if content is not None
                    else json.dumps(payload),
                },
                "finish_reason": "stop",
            }
        ],
    }
    return httpx.Response(
        status,
        json=body,
        request=httpx.Request("POST", CHAT_URL),
    )


def _service(handler, monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", TEST_KEY)
    return OpenRouterService(transport=httpx.MockTransport(handler))


SCENARIOS = [
    (
        "fake_kyc",
        "sms",
        _analysis_payload(risk_level="critical", category="Fake KYC Verification"),
        "critical",
        True,
    ),
    (
        "otp_sharing",
        "sms",
        _analysis_payload(risk_level="critical", category="OTP Theft"),
        "critical",
        True,
    ),
    (
        "fake_cashback",
        "whatsapp",
        _analysis_payload(risk_level="high", category="Fake Reward"),
        "high",
        True,
    ),
    (
        "suspicious_payment_url",
        "url",
        _analysis_payload(risk_level="high", category="Suspicious Link"),
        "high",
        True,
    ),
    (
        "normal_upi_message",
        "sms",
        _analysis_payload(
            is_suspicious=False,
            risk_level="low",
            category="Legitimate Notification",
            indicators=[],
            recommendations=[],
            confidence=0.95,
        ),
        "low",
        False,
    ),
    (
        "prompt_injection",
        "general",
        _analysis_payload(risk_level="high", category="Prompt Injection"),
        "high",
        True,
    ),
]


@pytest.mark.parametrize("name, content_type, payload, risk, suspicious", SCENARIOS)
def test_openrouter_six_scenarios(name, content_type, payload, risk, suspicious, monkeypatch):
    """Each scenario returns a validated structured result."""
    requests = []

    def handler(request):
        requests.append(request)
        return _chat_response(payload)

    service = _service(handler, monkeypatch)
    result = service.analyze("Fictional test message for " + name, content_type, timeout=5)

    assert result["status"] == "completed"
    assert result["provider"] == "openrouter"
    assert result["model"] == service.get_model_name()
    assert result["result"].risk_level == risk
    assert result["result"].is_suspicious is suspicious
    assert result["result"].confidence == pytest.approx(0.9 if suspicious else 0.95)

    # Request contract: auth header present, JSON output requested, prompt delimited.
    request = requests[0]
    assert str(request.url) == CHAT_URL
    assert request.headers["authorization"] == f"Bearer {TEST_KEY}"
    body = json.loads(request.content)
    assert body["response_format"] == {"type": "json_object"}
    assert body["model"] == "google/gemini-3.5-flash"
    assert "<untrusted_message>" in body["messages"][0]["content"]


def test_openrouter_masks_credentials_before_sending(monkeypatch):
    """OTP/UPI PIN values must never appear in the outbound request."""
    captured = {}

    def handler(request):
        captured["body"] = request.content.decode("utf-8")
        return _chat_response(_analysis_payload())

    service = _service(handler, monkeypatch)
    result = service.analyze(
        "Share your UPI PIN 4321 and OTP 998877 to receive cashback.",
        "payment_request",
        timeout=5,
    )

    assert result["status"] == "completed"
    assert "4321" not in captured["body"]
    assert "998877" not in captured["body"]
    assert "[REDACTED]" in captured["body"]


def test_openrouter_missing_key(monkeypatch):
    """No key means a clear unavailable status, never a crash."""
    with monkeypatch.context() as patch:
        patch.setattr(openrouter_module, "_openrouter_api_key", lambda: "")
        assert is_openrouter_configured() is False
        service = OpenRouterService()
        assert service.is_available() is False
        result = service.analyze("Test", "sms")
        assert result["status"] == "unavailable"
        assert result["result"] is None


def test_openrouter_401_fails_safely_without_leaking_key(monkeypatch):
    """Authentication errors are reported without exposing the key."""
    calls = []

    def handler(request):
        calls.append(1)
        return httpx.Response(
            401,
            json={"error": {"message": "No auth credentials found"}},
            request=request,
        )

    service = _service(handler, monkeypatch)
    result = service.analyze("Your OTP is 123456", "sms", timeout=5)

    assert result["status"] == "failed"
    assert result["result"] is None
    assert len(calls) == 1  # non-retryable
    assert TEST_KEY not in (result.get("error") or "")


def test_openrouter_rate_limit_retries_then_succeeds(monkeypatch):
    """A 429 is retried and a later validated result is returned."""
    calls = []

    def handler(request):
        calls.append(1)
        if len(calls) == 1:
            return httpx.Response(
                429,
                json={"error": {"message": "rate limited"}},
                request=request,
            )
        return _chat_response(_analysis_payload(is_suspicious=False, risk_level="low"))

    monkeypatch.setattr(openrouter_module.time, "sleep", lambda _: None)
    service = _service(handler, monkeypatch)
    result = service.analyze("Test message", "sms", timeout=5)

    assert result["status"] == "completed"
    assert len(calls) == 2


def test_openrouter_timeout_is_retried_and_fails_safely(monkeypatch):
    """Network timeouts exhaust bounded retries and return failed."""
    calls = []

    def handler(request):
        calls.append(1)
        raise httpx.ReadTimeout("timed out", request=request)

    monkeypatch.setattr(openrouter_module.time, "sleep", lambda _: None)
    service = _service(handler, monkeypatch)
    result = service.analyze("Test message", "sms", timeout=1)

    assert result["status"] == "failed"
    assert result["result"] is None
    assert len(calls) == 3  # initial attempt + 2 retries


def test_openrouter_invalid_json_is_rejected(monkeypatch):
    """Non-JSON model output is never presented as a completed analysis."""
    service = _service(lambda request: _chat_response(None, content="not json"), monkeypatch)
    result = service.analyze("Test message", "sms", timeout=5)

    assert result["status"] == "failed"
    assert result["result"] is None


def test_openrouter_result_flows_through_hybrid_scorer(monkeypatch):
    """OpenRouter output combines with rule scores using the existing formula."""
    service = _service(
        lambda request: _chat_response(_analysis_payload(risk_level="critical")),
        monkeypatch,
    )
    gemini_result = service.analyze("Share OTP 123456", "sms", timeout=5)

    hybrid = HybridScorer().score(
        rule_score=70,
        rule_risk_level="High",
        rule_category="Credential Theft",
        rule_indicators=[],
        rule_recommendations=["Never share your OTP."],
        gemini_result=gemini_result,
    )

    assert hybrid["analysis_type"] == "hybrid"
    assert hybrid["source_status"]["gemini"] == "completed"
    # 70*0.6 + 90*0.4 = 78
    assert hybrid["hybrid_score"] == 78


def test_ai_chain_falls_back_to_gemini(monkeypatch):
    """A failed OpenRouter call falls back to Gemini without breaking rules."""
    async def fake_openrouter(content, content_type, timeout=35.0):
        return {"status": "failed", "provider": "openrouter", "model": "m", "result": None}

    async def fake_gemini(content, content_type, timeout=35.0):
        return {"status": "completed", "provider": "gemini", "model": "g", "result": object()}

    monkeypatch.setattr(detect, "_analyze_with_openrouter", fake_openrouter)
    monkeypatch.setattr(detect, "_analyze_with_gemini", fake_gemini)
    monkeypatch.setattr(detect, "is_openrouter_configured", lambda: True)
    monkeypatch.setattr(detect, "is_gemini_configured", lambda: True)

    result = asyncio.run(detect._analyze_with_ai("Test", "sms"))

    assert result["provider"] == "gemini"
    assert result["status"] == "completed"


def test_ai_chain_without_providers_returns_none(monkeypatch):
    """No configured provider leaves rule-based analysis untouched."""
    monkeypatch.setattr(detect, "is_openrouter_configured", lambda: False)
    monkeypatch.setattr(detect, "is_gemini_configured", lambda: False)
    assert asyncio.run(detect._analyze_with_ai("Test", "sms")) is None


# --- Endpoint-level provider orchestration (mocked, no network, no credits) ---


def _ai_result(provider: str, model: str = "test-model") -> dict:
    """Build a validated provider result shaped like both services return."""
    from app.schemas.detection import GeminiAnalysisResult, GeminiIndicator

    return {
        "status": "completed",
        "provider": provider,
        "model": model,
        "result": GeminiAnalysisResult(
            is_suspicious=True,
            risk_level="high",
            category="Credential Theft",
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


@pytest.fixture()
def detect_client():
    """TestClient with an isolated in-memory DB and an authenticated user."""
    from fastapi.testclient import TestClient
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.core.dependencies import get_current_user, get_db_session
    from app.database.base import Base
    from app.main import app
    from app.models.user import User

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    session_factory = sessionmaker(
        bind=engine, autocommit=False, autoflush=False, expire_on_commit=False, future=True
    )
    Base.metadata.create_all(bind=engine)

    with session_factory() as db:
        user = User(
            email="openrouter-test@example.com",
            hashed_password="hashed",
            full_name="Provider Test",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = user.id

    class _User:
        id = user_id
        email = "openrouter-test@example.com"
        is_active = True

    def override_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db_session] = override_db
    app.dependency_overrides[get_current_user] = lambda: _User()
    client = TestClient(app)
    try:
        yield client
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def _analyze(client):
    response = client.post(
        "/api/v1/detect/analyze",
        json={
            "content": "Share your OTP 998877 to verify your account immediately.",
            "content_type": "sms",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_endpoint_reports_openrouter_provider_and_model(detect_client, monkeypatch):
    """The endpoint routes through _analyze_with_ai and never claims Gemini."""
    async def fake_openrouter(content, content_type):
        return _ai_result("openrouter", "google/gemini-3.5-flash")

    async def forbidden_gemini(content, content_type):
        raise AssertionError("Gemini must not be called when OpenRouter succeeds")

    monkeypatch.setattr(detect, "is_openrouter_configured", lambda: True)
    monkeypatch.setattr(detect, "_analyze_with_openrouter", fake_openrouter)
    monkeypatch.setattr(detect, "is_gemini_configured", lambda: False)
    monkeypatch.setattr(detect, "_analyze_with_gemini", forbidden_gemini)

    body = _analyze(detect_client)

    assert body["ai_analysis"]["status"] == "completed"
    assert body["ai_analysis"]["provider"] == "openrouter"
    assert body["ai_analysis"]["model"] == "google/gemini-3.5-flash"
    assert body["ai_analysis"]["result"]["risk_level"] == "high"
    assert body["analysis_type"] == "hybrid"


def test_endpoint_falls_back_to_gemini_when_openrouter_fails(detect_client, monkeypatch):
    """A failed OpenRouter call falls through to Gemini, which is reported."""
    async def failing_openrouter(content, content_type):
        return {
            "status": "failed",
            "provider": "openrouter",
            "model": "openrouter-model",
            "result": None,
        }

    async def fake_gemini(content, content_type):
        return _ai_result("gemini", "gemini-2.5-flash")

    monkeypatch.setattr(detect, "is_openrouter_configured", lambda: True)
    monkeypatch.setattr(detect, "_analyze_with_openrouter", failing_openrouter)
    monkeypatch.setattr(detect, "is_gemini_configured", lambda: True)
    monkeypatch.setattr(detect, "_analyze_with_gemini", fake_gemini)

    body = _analyze(detect_client)

    assert body["ai_analysis"]["status"] == "completed"
    assert body["ai_analysis"]["provider"] == "gemini"
    assert body["ai_analysis"]["model"] == "gemini-2.5-flash"


def test_endpoint_reports_unavailable_when_both_providers_fail(detect_client, monkeypatch):
    """Both providers failing yields a clean rule-based response, never an error."""
    async def failing_openrouter(content, content_type):
        return {"status": "failed", "provider": "openrouter", "model": "m", "result": None}

    async def failing_gemini(content, content_type):
        return {"status": "failed", "provider": "gemini", "model": "g", "result": None}

    monkeypatch.setattr(detect, "is_openrouter_configured", lambda: True)
    monkeypatch.setattr(detect, "_analyze_with_openrouter", failing_openrouter)
    monkeypatch.setattr(detect, "is_gemini_configured", lambda: True)
    monkeypatch.setattr(detect, "_analyze_with_gemini", failing_gemini)

    body = _analyze(detect_client)

    assert body["ai_analysis"] == {
        "status": "unavailable",
        "provider": "none",
        "model": None,
        "result": None,
    }
    assert body["analysis_type"] != "hybrid"
    assert body["risk_score"] >= 0


def test_endpoint_makes_no_ai_calls_without_keys(detect_client, monkeypatch):
    """Neither provider configured: no provider call is attempted at all."""
    async def forbidden(content, content_type):
        raise AssertionError("No provider may be called without an API key")

    monkeypatch.setattr(detect, "is_openrouter_configured", lambda: False)
    monkeypatch.setattr(detect, "is_gemini_configured", lambda: False)
    monkeypatch.setattr(detect, "_analyze_with_openrouter", forbidden)
    monkeypatch.setattr(detect, "_analyze_with_gemini", forbidden)

    body = _analyze(detect_client)

    assert body["ai_analysis"]["status"] == "unavailable"
    assert body["ai_analysis"]["result"] is None
    assert body["analysis_type"] in {"rule_based_only", "rule_and_url"}


def test_endpoint_uses_real_openrouter_service_with_mock_transport(detect_client, monkeypatch):
    """Full stack through /detect/analyze with the real service, mocked transport.

    Only the HTTP transport and the API key are substituted: the endpoint calls
    ``_analyze_with_ai`` -> ``_analyze_with_openrouter``, which builds a real
    ``OpenRouterService``. No request leaves the process.
    """
    requests = []

    def handler(request):
        requests.append(request)
        return _chat_response(
            _analysis_payload(risk_level="critical", category="Credential Theft")
        )

    real_service = openrouter_module.OpenRouterService

    def factory():
        return real_service(transport=httpx.MockTransport(handler))

    monkeypatch.setenv("OPENROUTER_API_KEY", TEST_KEY)
    monkeypatch.setenv("OPENROUTER_MODEL", "mock/provider-model")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr(openrouter_module, "OpenRouterService", factory)

    response = detect_client.post(
        "/api/v1/detect/analyze",
        json={
            "content": (
                "Your account will be blocked. Share your UPI PIN 4321 and "
                "OTP 998877 at https://secure-kyc-verify.example.com/verify now."
            ),
            "content_type": "sms",
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()

    # Exactly one provider call, against the mocked transport.
    assert len(requests) == 1
    request = requests[0]
    assert str(request.url) == CHAT_URL
    assert request.headers["authorization"] == f"Bearer {TEST_KEY}"

    # The configured model flows through both the request and the response.
    outbound = json.loads(request.content)
    assert outbound["model"] == "mock/provider-model"
    assert body["ai_analysis"]["provider"] == "openrouter"
    assert body["ai_analysis"]["model"] == "mock/provider-model"
    assert body["ai_analysis"]["status"] == "completed"
    assert body["ai_analysis"]["result"]["risk_level"] == "critical"

    # The real service's masking runs before the request is serialized.
    prompt = outbound["messages"][0]["content"]
    assert "4321" not in prompt
    assert "998877" not in prompt
    assert "[REDACTED]" in prompt

    # Validated AI output participates in hybrid scoring.
    assert body["analysis_type"] == "hybrid"


def test_build_ai_analysis_uses_provider_from_result():
    """Metadata comes from the service result, not a hardcoded provider."""
    openrouter = _ai_result("openrouter", "openrouter-model")
    built = detect._build_ai_analysis(openrouter, "completed")
    assert built["provider"] == "openrouter"
    assert built["model"] == "openrouter-model"
    assert built["status"] == "completed"

    gemini = _ai_result("gemini", "gemini-2.5-flash")
    built = detect._build_ai_analysis(gemini, "completed")
    assert built["provider"] == "gemini"
    assert built["model"] == "gemini-2.5-flash"

    unavailable = detect._build_ai_analysis(None, "unavailable")
    assert unavailable == {
        "status": "unavailable",
        "provider": "none",
        "model": None,
        "result": None,
    }


def test_gemini_masks_credentials_before_request(monkeypatch):
    """The Gemini fallback path also masks OTP and UPI PIN values."""
    from unittest.mock import MagicMock, patch

    from app.services.detection.gemini_service import GeminiService

    monkeypatch.setenv("GEMINI_API_KEY", "test-key-not-real")
    captured = {}

    with patch("app.services.detection.gemini_service.genai.Client"):
        service = GeminiService()
        response = MagicMock()
        response.text = json.dumps(_analysis_payload())

        def fake_generate(model, contents, config):
            captured["prompt"] = contents
            return response

        with patch.object(service._client.models, "generate_content", side_effect=fake_generate):
            result = service.analyze(
                "Share your UPI PIN 4321 and OTP 998877 to receive cashback.",
                "payment_request",
            )

    assert result["status"] == "completed"
    assert "4321" not in captured["prompt"]
    assert "998877" not in captured["prompt"]
    assert "[REDACTED]" in captured["prompt"]
