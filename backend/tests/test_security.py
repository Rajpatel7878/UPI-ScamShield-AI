"""Security regression tests for authentication and error handling."""

from datetime import timedelta

import jwt
from fastapi.testclient import TestClient

from app.core.security import (
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.main import app

client = TestClient(app)


def test_password_is_hashed_and_verifiable():
    password = "Str0ng-Test-Password!"
    hashed = get_password_hash(password)

    assert hashed != password
    assert hashed.startswith("$argon2")
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_malformed_hash_is_rejected_without_raising():
    assert verify_password("anything", "not-a-real-hash") is False


def test_access_token_round_trip():
    token = create_access_token(subject=42)
    payload = decode_access_token(token)

    assert payload is not None
    assert payload["sub"] == "42"


def test_expired_token_is_rejected():
    token = create_access_token(subject=42, expires_delta=timedelta(seconds=-5))
    assert decode_access_token(token) is None


def test_tampered_token_is_rejected():
    token = create_access_token(subject=42)
    assert decode_access_token(token + "tampered") is None


def test_unsigned_alg_none_token_is_rejected():
    unsigned = jwt.encode(
        {"sub": "42", "type": "access"},
        key="",
        algorithm="none",
    )
    assert decode_access_token(unsigned) is None


def test_token_signed_with_wrong_key_is_rejected():
    token = jwt.encode(
        {"sub": "42", "type": "access"},
        key="a-different-secret-key-that-is-long-enough",
        algorithm=JWT_ALGORITHM,
    )
    assert token
    assert JWT_SECRET_KEY
    assert decode_access_token(token) is None


def test_validation_errors_do_not_echo_password():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "QA",
            "email": "qa-validation@example.com",
            "password": "Zq7!",
        },
    )

    assert response.status_code == 422
    assert "Zq7!" not in response.text
    body = response.json()
    assert body["detail"] == "Request validation failed."
    assert all("input" not in error for error in body["errors"])


def test_security_headers_are_present():
    response = client.get("/api/v1/health")

    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
