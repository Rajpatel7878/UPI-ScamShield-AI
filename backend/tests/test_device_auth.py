"""Tests for Android device registration, authentication and management.

Each test uses an isolated temporary SQLite database and the real FastAPI
dependency chain: management endpoints are called with genuinely signed user
JWTs, and device tokens are checked through the ``get_current_device``
dependency mounted on a small probe application (the Phase 2 quick-detection
endpoint does not exist yet).
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.core.dependencies import get_db_session
from app.core.device_auth import (
    DEVICE_TOKEN_PREFIX,
    get_current_device,
    hash_device_token,
)
from app.core.security import create_access_token
from app.database.base import Base
from app.main import app
from app.models.device import Device
from app.models.user import User

USER_ONE_EMAIL = "device-owner-one@example.com"
USER_TWO_EMAIL = "device-owner-two@example.com"


@pytest.fixture()
def api(tmp_path):
    """Provide clients backed by a fresh SQLite database with two users."""
    engine = create_engine(
        f"sqlite:///{tmp_path / 'devices.db'}",
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

    with session_factory() as db:
        user_one = User(
            email=USER_ONE_EMAIL,
            hashed_password="not-used-in-these-tests",
            full_name="Device Owner One",
            is_active=True,
        )
        user_two = User(
            email=USER_TWO_EMAIL,
            hashed_password="not-used-in-these-tests",
            full_name="Device Owner Two",
            is_active=True,
        )
        db.add_all([user_one, user_two])
        db.commit()
        user_ids = (user_one.id, user_two.id)

    def override_get_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db_session] = override_get_db

    # Probe application exposing a single device-authenticated route.
    probe_app = FastAPI()

    @probe_app.get("/probe")
    def probe(device: Device = Depends(get_current_device)) -> dict:
        return {"device_id": device.id, "user_id": device.user_id}

    probe_app.dependency_overrides[get_db_session] = override_get_db

    yield SimpleNamespace(
        client=TestClient(app),
        probe=TestClient(probe_app),
        session_factory=session_factory,
        user_one_id=user_ids[0],
        user_two_id=user_ids[1],
    )

    app.dependency_overrides.clear()
    engine.dispose()


def _auth(user_id: int) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


def _device_headers(token: str) -> dict[str, str]:
    return {"X-Device-Token": token}


def _register(api, user_id: int, name: str = "Raj Android Phone") -> dict:
    response = api.client.post(
        "/api/v1/devices/register",
        json={"device_name": name},
        headers=_auth(user_id),
    )
    assert response.status_code == 201, response.text
    return response.json()


def _device_row(api, device_id: int) -> Device:
    with api.session_factory() as db:
        device = db.get(Device, device_id)
        assert device is not None
        return device


def test_registration_without_jwt_is_rejected(api):
    response = api.client.post(
        "/api/v1/devices/register",
        json={"device_name": "No JWT Phone"},
    )
    assert response.status_code == 401

    invalid = api.client.post(
        "/api/v1/devices/register",
        json={"device_name": "Bad JWT Phone"},
        headers={"Authorization": "Bearer not-a-jwt"},
    )
    assert invalid.status_code == 401

    with api.session_factory() as db:
        assert db.execute(select(Device)).scalars().all() == []


def test_valid_jwt_can_register_a_device(api):
    body = _register(api, api.user_one_id)

    assert body["success"] is True
    assert body["token_type"] == "device"
    assert body["device"]["device_name"] == "Raj Android Phone"
    assert body["device"]["is_active"] is True
    assert body["device"]["revoked_at"] is None
    assert body["token"].startswith(DEVICE_TOKEN_PREFIX)
    assert len(body["token"]) > len(DEVICE_TOKEN_PREFIX) + 20

    expires_at = datetime.fromisoformat(body["device"]["expires_at"])
    expected_days = get_settings().device_token_expire_days
    remaining = expires_at - datetime.now(timezone.utc)
    assert timedelta(days=expected_days - 1) < remaining <= timedelta(days=expected_days)


def test_raw_token_is_returned_only_at_registration(api):
    raw_token = _register(api, api.user_one_id)["token"]

    listing = api.client.get("/api/v1/devices", headers=_auth(api.user_one_id))
    assert listing.status_code == 200
    body = listing.json()
    assert body["success"] is True
    assert len(body["devices"]) == 1

    serialized = listing.text
    assert raw_token not in serialized
    assert "token" not in body["devices"][0]
    assert "device_token_hash" not in body["devices"][0]
    assert hash_device_token(raw_token) not in serialized


def test_database_stores_only_the_token_hash(api):
    raw_token = _register(api, api.user_one_id)["token"]

    with api.session_factory() as db:
        device = db.execute(select(Device)).scalar_one()
        stored = device.device_token_hash

        assert stored != raw_token
        assert raw_token not in stored
        assert stored == hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        assert len(stored) == 64
        # No other column may contain the raw credential.
        for column in Device.__table__.columns:
            value = getattr(device, column.name)
            if isinstance(value, str):
                assert raw_token not in value


def test_valid_device_token_authenticates(api):
    body = _register(api, api.user_one_id)

    response = api.probe.get("/probe", headers=_device_headers(body["token"]))
    assert response.status_code == 200
    assert response.json() == {
        "device_id": body["device"]["id"],
        "user_id": api.user_one_id,
    }

    device = _device_row(api, body["device"]["id"])
    assert device.last_used_at is not None


def test_invalid_device_token_is_rejected(api):
    _register(api, api.user_one_id)

    missing = api.probe.get("/probe")
    assert missing.status_code == 401

    unknown = api.probe.get(
        "/probe", headers=_device_headers("ssdev_" + "a" * 43)
    )
    assert unknown.status_code == 401

    malformed = api.probe.get("/probe", headers=_device_headers("not-a-token"))
    assert malformed.status_code == 401

    # A valid user JWT must never be accepted as a device token.
    jwt_token = create_access_token(api.user_one_id)
    wrong_credential = api.probe.get("/probe", headers=_device_headers(jwt_token))
    assert wrong_credential.status_code == 401

    # Errors stay generic.
    assert "detail" in unknown.json()
    assert "ssdev_" not in unknown.text


def test_expired_device_token_is_rejected(api):
    body = _register(api, api.user_one_id)

    with api.session_factory() as db:
        device = db.get(Device, body["device"]["id"])
        device.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()

    response = api.probe.get("/probe", headers=_device_headers(body["token"]))
    assert response.status_code == 401


def test_revoked_device_token_is_rejected(api):
    body = _register(api, api.user_one_id)
    device_id = body["device"]["id"]

    revoked = api.client.delete(
        f"/api/v1/devices/{device_id}", headers=_auth(api.user_one_id)
    )
    assert revoked.status_code == 200
    assert revoked.json()["success"] is True
    assert revoked.json()["revoked_at"] is not None

    assert (
        api.probe.get("/probe", headers=_device_headers(body["token"])).status_code
        == 401
    )

    device = _device_row(api, device_id)
    assert device.revoked_at is not None
    assert device.is_active is False


def test_device_listing_is_user_specific(api):
    one = _register(api, api.user_one_id, "Owner One Phone")
    two = _register(api, api.user_two_id, "Owner Two Phone")

    listing_one = api.client.get(
        "/api/v1/devices", headers=_auth(api.user_one_id)
    ).json()["devices"]
    listing_two = api.client.get(
        "/api/v1/devices", headers=_auth(api.user_two_id)
    ).json()["devices"]

    assert [device["id"] for device in listing_one] == [one["device"]["id"]]
    assert [device["id"] for device in listing_two] == [two["device"]["id"]]
    assert [device["device_name"] for device in listing_one] == ["Owner One Phone"]

    unauthenticated = api.client.get("/api/v1/devices")
    assert unauthenticated.status_code == 401


def test_users_cannot_revoke_other_users_devices(api):
    victim = _register(api, api.user_two_id, "Victim Phone")
    device_id = victim["device"]["id"]

    response = api.client.delete(
        f"/api/v1/devices/{device_id}", headers=_auth(api.user_one_id)
    )
    assert response.status_code == 404

    # The device is untouched and still authenticates.
    device = _device_row(api, device_id)
    assert device.revoked_at is None
    assert device.is_active is True
    assert (
        api.probe.get("/probe", headers=_device_headers(victim["token"])).status_code
        == 200
    )


def test_token_rotation_invalidates_the_previous_token(api):
    body = _register(api, api.user_one_id)
    device_id = body["device"]["id"]
    old_token = body["token"]

    rotated = api.client.post(
        f"/api/v1/devices/{device_id}/rotate", headers=_auth(api.user_one_id)
    )
    assert rotated.status_code == 200
    new_token = rotated.json()["token"]
    assert new_token.startswith(DEVICE_TOKEN_PREFIX)
    assert new_token != old_token

    assert api.probe.get("/probe", headers=_device_headers(old_token)).status_code == 401
    assert api.probe.get("/probe", headers=_device_headers(new_token)).status_code == 200

    device = _device_row(api, device_id)
    assert device.device_token_hash == hash_device_token(new_token)
    assert device.device_token_hash != hash_device_token(old_token)

    # Another user cannot rotate the device.
    forbidden = api.client.post(
        f"/api/v1/devices/{device_id}/rotate", headers=_auth(api.user_two_id)
    )
    assert forbidden.status_code == 404


def test_rotating_a_revoked_device_is_rejected(api):
    body = _register(api, api.user_one_id)
    device_id = body["device"]["id"]
    api.client.delete(f"/api/v1/devices/{device_id}", headers=_auth(api.user_one_id))

    rotated = api.client.post(
        f"/api/v1/devices/{device_id}/rotate", headers=_auth(api.user_one_id)
    )
    assert rotated.status_code == 409


def test_active_device_limit_is_enforced(api, monkeypatch):
    monkeypatch.setattr(get_settings(), "max_active_devices_per_user", 2)

    first = _register(api, api.user_one_id, "Phone One")
    _register(api, api.user_one_id, "Phone Two")

    over_limit = api.client.post(
        "/api/v1/devices/register",
        json={"device_name": "Phone Three"},
        headers=_auth(api.user_one_id),
    )
    assert over_limit.status_code == 409
    assert "limit" in over_limit.json()["detail"].lower()

    # Revoking a device frees a slot.
    api.client.delete(
        f"/api/v1/devices/{first['device']['id']}", headers=_auth(api.user_one_id)
    )
    _register(api, api.user_one_id, "Phone Three")

    # The limit is per user, not global.
    _register(api, api.user_two_id, "Other User Phone")


def test_device_name_validation(api):
    headers = _auth(api.user_one_id)

    for invalid_name in ["", "   ", "bad\x00name", "x" * 101]:
        response = api.client.post(
            "/api/v1/devices/register",
            json={"device_name": invalid_name},
            headers=headers,
        )
        assert response.status_code == 422

    unknown_field = api.client.post(
        "/api/v1/devices/register",
        json={"device_name": "Extra Field Phone", "user_id": api.user_two_id},
        headers=headers,
    )
    assert unknown_field.status_code == 422

    normalized = _register(api, api.user_one_id, "  Raj   Android   Phone  ")
    assert normalized["device"]["device_name"] == "Raj Android Phone"
