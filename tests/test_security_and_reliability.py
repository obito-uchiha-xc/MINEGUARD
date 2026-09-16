"""Automated tests for Phase 9: Security & Reliability Hardening.

Covers:
1. Security response headers (X-Content-Type-Options, X-Frame-Options, etc.)
2. CORS headers
3. Health, liveness, and readiness probes (including failure degradation)
4. Telemetry payload bounding limits (>500 items rejected)
5. Information leakage prevention on unhandled exceptions
6. Graceful shutdown (broadcaster cleanup & engine disposal)
7. Subsystem failure isolation (WebSocket, Risk Engine, AI exceptions)
8. Credential masking in diagnostics
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
import pytest
import pytest_asyncio
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.logging import mask_sensitive_url
from backend.app.db.base import Base
from backend.app.db.session import close_db_engine, get_db_session
from backend.app.main import app
from backend.app.models import IntegratedNode, Mine, Sensor, Zone
from backend.app.services.broadcaster import telemetry_broadcaster

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_engine():
    """Create test engine and initialize tables."""
    engine = create_async_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def session_factory(db_engine):
    """Provide sessionmaker bound to test engine."""
    return async_sessionmaker(
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


@pytest.fixture
def client(session_factory):
    """FastAPI TestClient with overridden get_db_session dependency."""
    async def override_get_db_session():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def seeded_node(session_factory):
    """Seed facility with 1 mine, 1 zone, 1 node, and 1 sensor."""
    async with session_factory() as session:
        mine = Mine(name="Security Test Mine", code="SEC-MINE")
        session.add(mine)
        await session.flush()

        zone = Zone(mine_id=mine.id, name="Security Zone", code="SZ-01")
        session.add(zone)
        await session.flush()

        node = IntegratedNode(
            zone_id=zone.id,
            node_identifier="SEC-NODE-01",
            status="ACTIVE",
            last_seen_at=datetime.now(timezone.utc),
        )
        session.add(node)
        await session.flush()

        sensor = Sensor(
            node_id=node.id,
            sensor_type="methane_ch4",
            sensor_identifier="ch4_main",
            unit="%",
            is_active=True,
        )
        session.add(sensor)
        await session.commit()

        return {
            "node_identifier": "SEC-NODE-01",
            "sensor_type": "methane_ch4",
        }


# --- 1. HTTP Security Headers ---

def test_security_headers_present(client):
    """Verify security headers are injected on all API responses (🔵 D-036)."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


# --- 2. CORS Headers ---

def test_cors_headers_applied(client):
    """Verify CORS headers reflect caller origin when credentials are allowed."""
    headers = {"Origin": "http://localhost:3000"}
    response = client.get("/api/v1/health", headers=headers)
    assert response.status_code == 200
    # With allow_credentials=True, CORSMiddleware reflects the incoming origin
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


# --- 3. Health, Liveness, and Readiness ---

def test_health_backward_compatible(client):
    """Verify GET /api/v1/health preserves Phase 1 contract."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_liveness_probe(client):
    """Verify GET /api/v1/health/liveness returns process alive status."""
    response = client.get("/api/v1/health/liveness")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


def test_readiness_probe_healthy(client):
    """Verify GET /api/v1/health/readiness returns 200 when database is connected."""
    response = client.get("/api/v1/health/readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"


def test_readiness_probe_unhealthy_when_db_fails(session_factory):
    """Verify readiness returns 503 DATABASE_UNAVAILABLE when database is unreachable."""
    async def broken_db_session():
        session = AsyncMock()
        session.execute.side_effect = ConnectionRefusedError("Database unreachable")
        yield session

    app.dependency_overrides[get_db_session] = broken_db_session
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/health/readiness")
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        err = response.json()
        assert err["error"]["code"] == "DATABASE_UNAVAILABLE"
    app.dependency_overrides.clear()


# --- 4. Input Bounding / Payload Limiting ---

def test_payload_reading_limit_rejected(client, seeded_node):
    """Verify payload with >500 readings is rejected with 422 (🔵 D-037)."""
    node_id = seeded_node["node_identifier"]
    oversized_readings = [
        {"sensor_type": "methane_ch4", "value": 1.0} for _ in range(501)
    ]
    payload = {
        "node_identifier": node_id,
        "readings": oversized_readings,
    }
    response = client.post("/api/v1/ingestion/telemetry", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_payload_node_identifier_length_validation(client):
    """Verify node_identifier bounds are enforced."""
    # Empty string
    response_empty = client.post(
        "/api/v1/ingestion/telemetry",
        json={"node_identifier": "", "readings": [{"sensor_type": "methane_ch4", "value": 1.0}]},
    )
    assert response_empty.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Oversized (>128 chars)
    response_long = client.post(
        "/api/v1/ingestion/telemetry",
        json={"node_identifier": "A" * 129, "readings": [{"sensor_type": "methane_ch4", "value": 1.0}]},
    )
    assert response_long.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# --- 5. Information Leakage Prevention ---

def test_unhandled_exception_sanitized():
    """Verify unexpected internal errors do not leak stack traces or internals."""
    # Test via dependency failure that raises an unhandled RuntimeError
    async def crash_dependency():
        raise RuntimeError("Secret internal database password or error")
        yield None

    app.dependency_overrides[get_db_session] = crash_dependency
    with TestClient(app, raise_server_exceptions=False) as test_client:
        response = test_client.get("/api/v1/health/readiness")
        assert response.status_code == 500
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "INTERNAL_SERVER_ERROR"
        assert "Secret internal database password or error" not in str(data)
    app.dependency_overrides.clear()


# --- 6. Graceful Lifecycle Resource Shutdown ---

@pytest.mark.asyncio
async def test_broadcaster_shutdown_cleans_clients():
    """Verify broadcaster.shutdown() disconnects and clears all registered client queues."""
    cid = await telemetry_broadcaster.subscribe()
    assert telemetry_broadcaster.client_count >= 1
    await telemetry_broadcaster.shutdown()
    assert telemetry_broadcaster.client_count == 0


@pytest.mark.asyncio
async def test_close_db_engine_executes_safely():
    """Verify close_db_engine cleanly disposes engine."""
    await close_db_engine()


# --- 7. Dependency Failure Isolation ---

def test_ingestion_persists_even_when_broadcaster_fails(client, seeded_node):
    """Verify telemetry persists successfully even if WebSocket broadcaster fails."""
    node_id = seeded_node["node_identifier"]
    payload = {
        "node_identifier": node_id,
        "readings": [{"sensor_type": "methane_ch4", "value": 0.5}],
    }
    with patch.object(telemetry_broadcaster, "publish", side_effect=RuntimeError("Broadcaster down")):
        response = client.post("/api/v1/ingestion/telemetry", json=payload)
        assert response.status_code == 201
        assert response.json()["status"] == "success"
        assert response.json()["readings_persisted"] == 1


def test_ingestion_persists_even_when_risk_engine_fails(client, seeded_node):
    """Verify telemetry persists successfully even if Risk/Alert engine crashes."""
    node_id = seeded_node["node_identifier"]
    payload = {
        "node_identifier": node_id,
        "readings": [{"sensor_type": "methane_ch4", "value": 0.8}],
    }
    with patch("backend.app.services.risk_service.RiskService.evaluate_node_risk", side_effect=RuntimeError("Risk crash")):
        response = client.post("/api/v1/ingestion/telemetry", json=payload)
        assert response.status_code == 201
        assert response.json()["status"] == "success"
        assert response.json()["readings_persisted"] == 1


def test_ingestion_persists_even_when_ai_engine_fails(client, seeded_node):
    """Verify telemetry persists successfully even if AI anomaly evaluation crashes."""
    node_id = seeded_node["node_identifier"]
    payload = {
        "node_identifier": node_id,
        "readings": [{"sensor_type": "methane_ch4", "value": 0.9}],
    }
    with patch("backend.app.services.ai.ai_service.AIService.evaluate_telemetry_batch", side_effect=RuntimeError("AI crash")):
        response = client.post("/api/v1/ingestion/telemetry", json=payload)
        assert response.status_code == 201
        assert response.json()["status"] == "success"
        assert response.json()["readings_persisted"] == 1


# --- 8. Credential Masking in Diagnostics ---

def test_credential_masking():
    """Verify mask_sensitive_url hides embedded passwords."""
    raw_url = "postgresql+psycopg://mine_admin:MySuperSecretP@ss@db.internal:5432/mine_safety"
    masked = mask_sensitive_url(raw_url)
    assert "MySuperSecretP@ss" not in masked
    assert "mine_admin:***@" in masked
    assert mask_sensitive_url(None) == ""
