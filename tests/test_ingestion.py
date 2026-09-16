"""Automated tests for Phase 3: Node + Mother System Telemetry Ingestion."""

from datetime import datetime, timezone, timedelta
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from backend.app.db.base import Base
from backend.app.db.session import get_db_session
from backend.app.main import app
from backend.app.models import IntegratedNode, Mine, Sensor, SensorReading, Zone
from backend.app.utils.mock_adapter import MockMotherSystemAdapter

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
async def setup_test_hierarchy(session_factory):
    """Seed test facility with 1 mine, 1 zone, 1 node, and multi-modal sensors."""
    async with session_factory() as session:
        mine = Mine(name="Ingestion Test Mine", code="ITM-01")
        session.add(mine)
        await session.flush()

        zone = Zone(mine_id=mine.id, name="Shaft 4", code="S4")
        session.add(zone)
        await session.flush()

        node = IntegratedNode(
            zone_id=zone.id,
            node_identifier="NODE-INGEST-01",
            status="ACTIVE",
            last_seen_at=None,
        )
        session.add(node)
        await session.flush()

        sensors = [
            Sensor(node_id=node.id, sensor_type="displacement"),
            Sensor(node_id=node.id, sensor_type="vibration"),
            Sensor(node_id=node.id, sensor_type="crack_detection"),
            Sensor(node_id=node.id, sensor_type="temperature"),
            Sensor(node_id=node.id, sensor_type="humidity"),
            Sensor(node_id=node.id, sensor_type="pressure"),
            Sensor(node_id=node.id, sensor_type="methane_ch4"),
            Sensor(node_id=node.id, sensor_type="carbon_monoxide_co"),
            Sensor(node_id=node.id, sensor_type="oxygen_o2"),
        ]
        session.add_all(sensors)
        await session.commit()

    return "NODE-INGEST-01"


def test_valid_telemetry_ingestion(client: TestClient, setup_test_hierarchy):
    """Verify valid multi-sensor telemetry frame is accepted and persisted with 201 Created."""
    node_id = setup_test_hierarchy
    payload = {
        "node_identifier": node_id,
        "timestamp": "2026-09-09T14:30:00Z",
        "readings": [
            {"sensor_type": "displacement", "value": 3.12},
            {"sensor_type": "temperature", "value": 26.4},
            {"sensor_type": "methane_ch4", "value": 0.45},
        ],
    }

    response = client.post("/api/v1/ingestion/telemetry", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["node_identifier"] == node_id
    assert data["readings_persisted"] == 3
    assert "ingested_at" in data


def test_full_multimodal_mock_frame_ingestion(client: TestClient, setup_test_hierarchy):
    """Verify mock adapter can generate and ingest all 9 monitored capabilities in a single burst."""
    node_id = setup_test_hierarchy
    mock_payload = MockMotherSystemAdapter.generate_full_multimodal_frame(node_identifier=node_id)
    payload_dict = mock_payload.model_dump(mode="json")

    response = client.post("/api/v1/ingestion/telemetry", json=payload_dict)
    assert response.status_code == 201
    assert response.json()["readings_persisted"] == 9


def test_unknown_node_rejection(client: TestClient, setup_test_hierarchy):
    """Verify telemetry from an unregistered node is rejected with 404 and NODE_NOT_FOUND error code."""
    payload = {
        "node_identifier": "UNREGISTERED-GHOST-NODE",
        "readings": [{"sensor_type": "temperature", "value": 25.0}],
    }

    response = client.post("/api/v1/ingestion/telemetry", json=payload)
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "NODE_NOT_FOUND"
    assert "UNREGISTERED-GHOST-NODE" in data["error"]["message"]


def test_unknown_sensor_rejection(client: TestClient, setup_test_hierarchy):
    """Verify measurement for an unmapped sensor capability is rejected with 404 and SENSOR_NOT_FOUND."""
    node_id = setup_test_hierarchy
    payload = {
        "node_identifier": node_id,
        "readings": [{"sensor_type": "radiation_gamma_ray", "value": 150.0}],
    }

    response = client.post("/api/v1/ingestion/telemetry", json=payload)
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "SENSOR_NOT_FOUND"


def test_malformed_payload_rejection(client: TestClient, setup_test_hierarchy):
    """Verify malformed requests (missing fields, wrong types) return 422 Unprocessable Entity."""
    # Missing required readings field
    bad_payload = {"node_identifier": setup_test_hierarchy}
    response = client.post("/api/v1/ingestion/telemetry", json=bad_payload)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_dangerous_extreme_values_accepted(client: TestClient, setup_test_hierarchy):
    """Verify ingestion accepts dangerous sensor readings without rejection (safety logic is decoupled from ingestion)."""
    node_id = setup_test_hierarchy
    # Highly dangerous gas level (50.0% volume CH4)
    payload = {
        "node_identifier": node_id,
        "readings": [{"sensor_type": "methane_ch4", "value": 50.0}],
    }

    response = client.post("/api/v1/ingestion/telemetry", json=payload)
    assert response.status_code == 201
    assert response.json()["readings_persisted"] == 1


@pytest.mark.asyncio
async def test_node_last_seen_updated_and_persisted(session_factory, client: TestClient, setup_test_hierarchy):
    """Verify ingestion updates node.last_seen_at timestamp and persists readings to database."""
    node_id = setup_test_hierarchy
    payload = {
        "node_identifier": node_id,
        "readings": [{"sensor_type": "vibration", "value": 1.75}],
    }

    res = client.post("/api/v1/ingestion/telemetry", json=payload)
    assert res.status_code == 201

    # Check database directly
    async with session_factory() as session:
        node_stmt = select(IntegratedNode).where(IntegratedNode.node_identifier == node_id)
        node_res = await session.execute(node_stmt)
        node = node_res.scalar_one()

        assert node.last_seen_at is not None
        assert node.status == "ACTIVE"

        reading_stmt = select(SensorReading).where(SensorReading.node_id == node.id)
        reading_res = await session.execute(reading_stmt)
        readings = reading_res.scalars().all()
        assert len(readings) == 1
        assert readings[0].value == 1.75
