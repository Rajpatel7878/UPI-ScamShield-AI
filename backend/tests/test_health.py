from fastapi.testclient import TestClient

from app.main import app
from app.services.detection.gemini_service import is_gemini_configured

client = TestClient(app)


def test_root_returns_service_metadata() -> None:
    """Root endpoint returns service metadata."""
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "status": "running",
        "service": "UPI ScamShield AI",
        "version": "1.0.0",
    }


def test_health_reports_database_connectivity() -> None:
    """Health endpoint reports real database connectivity."""
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "database": "connected",
        "ai_analysis": "configured" if is_gemini_configured() else "not_configured",
        "service": "UPI ScamShield AI",
        "environment": "development",
    }


def test_cors_allows_the_configured_frontend_origin() -> None:
    """CORS allows the configured frontend origin."""
    response = client.get("/api/v1/health", headers={"Origin": "http://localhost:5173"})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_unknown_route_uses_structured_error_shape() -> None:
    """Unknown routes return structured error response with 404."""
    response = client.get("/api/v1/does-not-exist")

    assert response.status_code == 404
    assert response.json()["status"] == "error"
    assert response.json()["path"] == "/api/v1/does-not-exist"


def test_openapi_schema_is_available() -> None:
    """OpenAPI schema is available at /api/v1/openapi.json."""
    response = client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    assert "/api/v1/health" in response.json()["paths"]