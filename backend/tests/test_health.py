from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_returns_service_metadata() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "UPI ScamShield AI API",
        "version": "0.1.0",
    }


def test_health_reports_database_as_not_configured() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "database": "not_configured",
        "service": "UPI ScamShield AI",
    }


def test_cors_allows_the_configured_frontend_origin() -> None:
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_unknown_route_uses_structured_error_shape() -> None:
    response = client.get("/does-not-exist")

    assert response.status_code == 404
    assert response.json()["status"] == "error"
    assert response.json()["path"] == "/does-not-exist"


def test_openapi_schema_is_available() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "/health" in response.json()["paths"]
