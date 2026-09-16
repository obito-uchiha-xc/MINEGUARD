"""Automated tests for Phase 4: Telemetry Processing & Storage.

Tests the three new read endpoints:
  GET /api/v1/telemetry/nodes/{node_identifier}/history
  GET /api/v1/telemetry/nodes/{node_identifier}/latest
  GET /api/v1/telemetry/nodes/{node_identifier}/aggregate
"""

from datetime import datetime, timezone, timedelta

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.db.base import Base
from backend.app.db.session import get_db_session
from backend.app.main import app
from backend.app.models import IntegratedNode, Mine, Sensor, SensorReading, Zone

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


# ---------------------------------------------------------------------------
# Shared fixtures — mirrors Phase 3 test infrastructure
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def db_engine():
    """Create an isolated in-memory test engine and initialize all tables."""
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
    """Return a sessionmaker bound to the test engine."""
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
    """Seed a Mine → Zone → Node + temperature & vibration sensors.

    Returns:
        dict with keys: node_identifier, node_id, temp_sensor_id, vib_sensor_id
    """
    async with session_factory() as session:
        mine = Mine(name="Telemetry Query Mine", code="TQM-01")
        session.add(mine)
        await session.flush()

        zone = Zone(mine_id=mine.id, name="Query Zone A", code="QZA")
        session.add(zone)
        await session.flush()

        node = IntegratedNode(
            zone_id=zone.id,
            node_identifier="NODE-QUERY-01",
            status="ACTIVE",
        )
        session.add(node)
        await session.flush()

        temp_sensor = Sensor(node_id=node.id, sensor_type="temperature", unit="C")
        vib_sensor = Sensor(node_id=node.id, sensor_type="vibration", unit="mm/s")
        session.add_all([temp_sensor, vib_sensor])
        await session.flush()

        result = {
            "node_identifier": node.node_identifier,
            "node_id": node.id,
            "temp_sensor_id": temp_sensor.id,
            "vib_sensor_id": vib_sensor.id,
        }
        await session.commit()

    return result


@pytest_asyncio.fixture
async def readings_seeded(session_factory, seeded_node):
    """Insert a controlled set of SensorReading rows for deterministic tests.

    Temperature readings: 10.0, 20.0, 30.0, 40.0 at t+0..+3 minutes
    Vibration readings:   1.0, 2.0 at t+0..+1 minute
    """
    base_time = datetime(2026, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

    async with session_factory() as session:
        temp_readings = [
            SensorReading(
                sensor_id=seeded_node["temp_sensor_id"],
                node_id=seeded_node["node_id"],
                timestamp=base_time + timedelta(minutes=i),
                value=float((i + 1) * 10),  # 10.0, 20.0, 30.0, 40.0
            )
            for i in range(4)
        ]
        vib_readings = [
            SensorReading(
                sensor_id=seeded_node["vib_sensor_id"],
                node_id=seeded_node["node_id"],
                timestamp=base_time + timedelta(minutes=i),
                value=float(i + 1),  # 1.0, 2.0
            )
            for i in range(2)
        ]
        session.add_all(temp_readings + vib_readings)
        await session.commit()

    return {**seeded_node, "base_time": base_time}


# ---------------------------------------------------------------------------
# History endpoint tests
# ---------------------------------------------------------------------------


def test_history_returns_ingested_readings(client: TestClient, readings_seeded):
    """GET /history returns all readings for a node with correct count and values."""
    node_id = readings_seeded["node_identifier"]

    resp = client.get(f"/api/v1/telemetry/nodes/{node_id}/history")
    assert resp.status_code == 200

    data = resp.json()
    assert data["node_identifier"] == node_id
    # 4 temperature + 2 vibration = 6 total
    assert data["returned_count"] == 6
    assert data["total_count"] == 6
    assert len(data["readings"]) == 6


def test_history_filtered_by_sensor_type(client: TestClient, readings_seeded):
    """GET /history?sensor_type=temperature returns only temperature readings."""
    node_id = readings_seeded["node_identifier"]

    resp = client.get(
        f"/api/v1/telemetry/nodes/{node_id}/history",
        params={"sensor_type": "temperature"},
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["sensor_type"] == "temperature"
    assert data["returned_count"] == 4
    assert data["total_count"] == 4
    for reading in data["readings"]:
        assert reading["sensor_type"] == "temperature"


def test_history_date_range_filter(client: TestClient, readings_seeded):
    """GET /history with from_dt/to_dt returns only readings in that window."""
    node_id = readings_seeded["node_identifier"]
    base_time = readings_seeded["base_time"]

    # Window: only t+1min and t+2min → 1 temperature reading at 20.0 and 1 at 30.0
    from_dt = (base_time + timedelta(minutes=1)).isoformat()
    to_dt = (base_time + timedelta(minutes=2)).isoformat()

    resp = client.get(
        f"/api/v1/telemetry/nodes/{node_id}/history",
        params={
            "sensor_type": "temperature",
            "from_dt": from_dt,
            "to_dt": to_dt,
        },
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["returned_count"] == 2
    values = sorted([r["value"] for r in data["readings"]])
    assert values == [20.0, 30.0]


def test_history_limit_respected(client: TestClient, readings_seeded):
    """GET /history?limit=2 returns at most 2 readings even when more exist."""
    node_id = readings_seeded["node_identifier"]

    resp = client.get(
        f"/api/v1/telemetry/nodes/{node_id}/history",
        params={"sensor_type": "temperature", "limit": 2},
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["returned_count"] == 2
    assert len(data["readings"]) == 2
    assert data["limit"] == 2
    # total_count should reflect full dataset, not the limited result
    assert data["total_count"] == 4


def test_history_unknown_node_returns_404(client: TestClient, seeded_node):
    """GET /history for an unregistered node returns 404 with NODE_NOT_FOUND."""
    resp = client.get("/api/v1/telemetry/nodes/GHOST-NODE-999/history")
    assert resp.status_code == 404
    data = resp.json()
    assert "error" in data
    assert data["error"]["code"] == "NODE_NOT_FOUND"


# ---------------------------------------------------------------------------
# Latest endpoint tests
# ---------------------------------------------------------------------------


def test_latest_returns_most_recent_per_sensor(client: TestClient, readings_seeded):
    """GET /latest returns one reading per sensor, each the most-recent value."""
    node_id = readings_seeded["node_identifier"]

    resp = client.get(f"/api/v1/telemetry/nodes/{node_id}/latest")
    assert resp.status_code == 200

    data = resp.json()
    assert data["node_identifier"] == node_id
    assert data["sensor_count"] == 2  # temperature + vibration

    # Build a map by sensor_type for easy assertion
    by_type = {r["sensor_type"]: r for r in data["readings"]}

    assert "temperature" in by_type
    assert "vibration" in by_type

    # Most-recent temperature = 40.0 (t+3 min), vibration = 2.0 (t+1 min)
    assert by_type["temperature"]["value"] == 40.0
    assert by_type["vibration"]["value"] == 2.0


def test_latest_unknown_node_returns_404(client: TestClient, seeded_node):
    """GET /latest for an unregistered node returns 404 with NODE_NOT_FOUND."""
    resp = client.get("/api/v1/telemetry/nodes/GHOST-LATEST-NODE/latest")
    assert resp.status_code == 404
    data = resp.json()
    assert "error" in data
    assert data["error"]["code"] == "NODE_NOT_FOUND"


# ---------------------------------------------------------------------------
# Aggregate endpoint tests
# ---------------------------------------------------------------------------


def test_aggregate_min_max_avg(client: TestClient, readings_seeded):
    """GET /aggregate returns correct min/max/avg for temperature readings (10,20,30,40)."""
    node_id = readings_seeded["node_identifier"]

    resp = client.get(
        f"/api/v1/telemetry/nodes/{node_id}/aggregate",
        params={"sensor_type": "temperature"},
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["node_identifier"] == node_id
    assert data["sensor_type"] == "temperature"
    assert data["reading_count"] == 4
    assert data["min_value"] == 10.0
    assert data["max_value"] == 40.0
    assert abs(data["avg_value"] - 25.0) < 1e-4  # (10+20+30+40)/4 = 25.0


def test_aggregate_unknown_sensor_type_returns_404(client: TestClient, seeded_node):
    """GET /aggregate for a sensor type with no data returns 404 with NO_DATA_FOUND."""
    node_id = seeded_node["node_identifier"]

    resp = client.get(
        f"/api/v1/telemetry/nodes/{node_id}/aggregate",
        params={"sensor_type": "methane_ch4"},  # No readings seeded for this type
    )
    assert resp.status_code == 404
    data = resp.json()
    assert "error" in data
    assert data["error"]["code"] == "NO_DATA_FOUND"
