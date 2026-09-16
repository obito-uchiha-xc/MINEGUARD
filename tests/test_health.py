"""Tests for application startup, health check endpoint, and error handling."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture
def client() -> TestClient:
    """Provide a TestClient instance for the FastAPI application."""
    return TestClient(app)


def test_app_instantiation():
    """Verify the FastAPI application instantiates with expected metadata."""
    assert app.title == "Integrated Mine Safety Monitoring System Backend"
    assert app.version == "0.1.0"


def test_health_endpoint_success(client: TestClient):
    """Verify GET /api/v1/health returns 200 OK and expected status payload."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_not_found_standard_error_envelope(client: TestClient):
    """Verify requests to non-existent endpoints return 404 with standard error envelope."""
    response = client.get("/api/v1/non-existent-path")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "message" in data["error"]


def test_openapi_docs_accessible(client: TestClient):
    """Verify OpenAPI documentation endpoint is reachable in development mode."""
    response = client.get("/docs")
    assert response.status_code == 200
