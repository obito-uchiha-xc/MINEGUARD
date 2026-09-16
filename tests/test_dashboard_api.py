"""Automated tests for Phase 8: Dashboard APIs.

Validates Mines, Zones, Nodes, mounted Sensors, and consolidated Dashboard Overview endpoints.
"""

from datetime import datetime, timezone, timedelta
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.db.base import Base
from backend.app.db.session import get_db_session
from backend.app.main import app
from backend.app.models import (
    Alert,
    IntegratedNode,
    Mine,
    Sensor,
    SensorReading,
    Zone,
)

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
async def seeded_data(session_factory):
    """Seed comprehensive hierarchy for dashboard testing."""
    async with session_factory() as session:
        # Mine 1
        mine1 = Mine(name="Northern Coalfield", code="NC-01")
        session.add(mine1)
        # Mine 2
        mine2 = Mine(name="Eastern Shaft", code="ES-02")
        session.add(mine2)
        await session.flush()

        # Zones in Mine 1
        zone_a = Zone(mine_id=mine1.id, name="Sector Alpha", code="SEC-A")
        zone_b = Zone(mine_id=mine1.id, name="Sector Beta", code="SEC-B")
        # Zone in Mine 2
        zone_c = Zone(mine_id=mine2.id, name="Deep Gallery", code="DG-01")
        session.add_all([zone_a, zone_b, zone_c])
        await session.flush()

        now = datetime.now(timezone.utc)

        # Node 1: Active in Zone A
        node1 = IntegratedNode(
            zone_id=zone_a.id,
            node_identifier="NODE-DASH-01",
            status="ACTIVE",
            last_seen_at=now,
        )
        # Node 2: Unresponsive in Zone A (last seen 150s ago)
        node2 = IntegratedNode(
            zone_id=zone_a.id,
            node_identifier="NODE-DASH-02",
            status="ACTIVE",
            last_seen_at=now - timedelta(seconds=150),
        )
        # Node 3: Active in Zone B
        node3 = IntegratedNode(
            zone_id=zone_b.id,
            node_identifier="NODE-DASH-03",
            status="ACTIVE",
            last_seen_at=now,
        )
        session.add_all([node1, node2, node3])
        await session.flush()

        # Sensors on Node 1
        s1 = Sensor(
            node_id=node1.id,
            sensor_type="methane_ch4",
            sensor_identifier="ch4_main",
            unit="%",
            is_active=True,
        )
        s2 = Sensor(
            node_id=node1.id,
            sensor_type="temperature",
            sensor_identifier="temp_01",
            unit="degC",
            is_active=True,
        )
        # Sensor on Node 2
        s3 = Sensor(
            node_id=node2.id,
            sensor_type="vibration",
            sensor_identifier="vib_01",
            unit="mm/s",
            is_active=True,
        )
        session.add_all([s1, s2, s3])
        await session.flush()

        # Alerts on Node 1 (1 WARNING, 1 CRITICAL)
        alert1 = Alert(
            node_id=node1.id,
            alert_type="THRESHOLD",
            condition_key="threshold:temperature:high_temp",
            severity="WARNING",
            status="ACTIVE",
            message="Temperature elevated",
            context_data={"temp": 38.5},
            triggered_at=now - timedelta(minutes=5),
        )
        alert2 = Alert(
            node_id=node1.id,
            alert_type="THRESHOLD",
            condition_key="threshold:methane_ch4:crit_gas",
            severity="CRITICAL",
            status="ACTIVE",
            message="Methane level critical",
            context_data={"methane_ch4": 2.5},
            triggered_at=now - timedelta(minutes=2),
        )
        # Resolved alert on Node 1 (should not count towards active breakdown)
        alert_resolved = Alert(
            node_id=node1.id,
            alert_type="THRESHOLD",
            condition_key="threshold:co:old",
            severity="WARNING",
            status="RESOLVED",
            message="Old CO spike resolved",
            context_data={},
            triggered_at=now - timedelta(hours=1),
            resolved_at=now - timedelta(minutes=30),
        )
        session.add_all([alert1, alert2, alert_resolved])
        await session.commit()

        return {
            "mine1_id": mine1.id,
            "mine2_id": mine2.id,
            "zone_a_id": zone_a.id,
            "zone_b_id": zone_b.id,
            "zone_c_id": zone_c.id,
            "node1_id": node1.id,
            "node2_id": node2.id,
            "node3_id": node3.id,
        }


def test_list_mines(client, seeded_data):
    """Verify GET /api/v1/mines returns list of mines with zone counts."""
    response = client.get("/api/v1/mines")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    # Verify Mine 1 has 2 zones, Mine 2 has 1 zone
    m1 = next(m for m in data if m["name"] == "Northern Coalfield")
    assert m1["code"] == "NC-01"
    assert m1["zone_count"] == 2

    m2 = next(m for m in data if m["name"] == "Eastern Shaft")
    assert m2["code"] == "ES-02"
    assert m2["zone_count"] == 1


def test_get_mine_detail_and_404(client, seeded_data):
    """Verify GET /api/v1/mines/{id} returns detail with zones and 404 for missing."""
    m1_id = seeded_data["mine1_id"]
    response = client.get(f"/api/v1/mines/{m1_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == m1_id
    assert data["name"] == "Northern Coalfield"
    assert len(data["zones"]) == 2

    # Verify 404 error envelope
    resp_404 = client.get("/api/v1/mines/99999")
    assert resp_404.status_code == 404
    err = resp_404.json()
    assert err["error"]["code"] == "MINE_NOT_FOUND"


def test_list_zones_and_filter(client, seeded_data):
    """Verify GET /api/v1/zones lists all zones and supports mine_id filtering."""
    # List all zones
    response = client.get("/api/v1/zones")
    assert response.status_code == 200
    all_zones = response.json()
    assert len(all_zones) == 3

    # Filter by mine1_id
    m1_id = seeded_data["mine1_id"]
    resp_m1 = client.get(f"/api/v1/zones?mine_id={m1_id}")
    assert resp_m1.status_code == 200
    m1_zones = resp_m1.json()
    assert len(m1_zones) == 2
    assert all(z["mine_id"] == m1_id for z in m1_zones)

    # Filter by mine2_id
    m2_id = seeded_data["mine2_id"]
    resp_m2 = client.get(f"/api/v1/zones?mine_id={m2_id}")
    assert resp_m2.status_code == 200
    m2_zones = resp_m2.json()
    assert len(m2_zones) == 1
    assert m2_zones[0]["mine_id"] == m2_id


def test_get_zone_detail_and_404(client, seeded_data):
    """Verify GET /api/v1/zones/{id} returns detail with nodes and 404 for missing."""
    za_id = seeded_data["zone_a_id"]
    response = client.get(f"/api/v1/zones/{za_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == za_id
    assert data["name"] == "Sector Alpha"
    assert len(data["nodes"]) == 2

    # Verify 404 error envelope
    resp_404 = client.get("/api/v1/zones/99999")
    assert resp_404.status_code == 404
    err = resp_404.json()
    assert err["error"]["code"] == "ZONE_NOT_FOUND"


def test_list_nodes_and_filter(client, seeded_data):
    """Verify GET /api/v1/nodes lists nodes and supports zone_id & status filtering."""
    # List all nodes
    response = client.get("/api/v1/nodes")
    assert response.status_code == 200
    nodes = response.json()
    assert len(nodes) == 3

    # Filter by zone_a_id
    za_id = seeded_data["zone_a_id"]
    resp_za = client.get(f"/api/v1/nodes?zone_id={za_id}")
    assert resp_za.status_code == 200
    za_nodes = resp_za.json()
    assert len(za_nodes) == 2
    assert all(n["zone_id"] == za_id for n in za_nodes)

    # Filter by status
    resp_status = client.get("/api/v1/nodes?status=ACTIVE")
    assert resp_status.status_code == 200
    assert len(resp_status.json()) == 3


def test_get_node_detail_and_404(client, seeded_data):
    """Verify GET /api/v1/nodes/{identifier} returns full detail with sensors."""
    response = client.get("/api/v1/nodes/NODE-DASH-01")
    assert response.status_code == 200
    data = response.json()
    assert data["node_identifier"] == "NODE-DASH-01"
    assert data["zone_name"] == "Sector Alpha"
    assert len(data["sensors"]) == 2
    sensor_types = [s["sensor_type"] for s in data["sensors"]]
    assert "methane_ch4" in sensor_types
    assert "temperature" in sensor_types

    # Verify 404 error envelope
    resp_404 = client.get("/api/v1/nodes/UNKNOWN-NODE-XYZ")
    assert resp_404.status_code == 404
    err = resp_404.json()
    assert err["error"]["code"] == "NODE_NOT_FOUND"


def test_dashboard_overview(client, seeded_data):
    """Verify GET /api/v1/dashboard/overview snapshot aggregations."""
    response = client.get("/api/v1/dashboard/overview")
    assert response.status_code == 200
    data = response.json()

    # Facility counts
    assert data["total_mines"] == 2
    assert data["total_zones"] == 3
    assert data["total_nodes"] == 3

    # Node liveness: NODE-DASH-01 and NODE-DASH-03 are fresh, NODE-DASH-02 was seen 150s ago (>60s timeout)
    assert data["active_nodes"] == 2
    assert data["unresponsive_nodes"] == 1

    # Active alerts breakdown (1 WARNING, 1 CRITICAL, total 2)
    assert data["alerts"]["warning"] == 1
    assert data["alerts"]["critical"] == 1
    assert data["alerts"]["total"] == 2

    # Zones overview list (should have entries for all 3 zones)
    assert len(data["zones_overview"]) == 3
    zone_names = [z["zone_name"] for z in data["zones_overview"]]
    assert "Sector Alpha" in zone_names
    assert "Sector Beta" in zone_names
    assert "Deep Gallery" in zone_names

    # Snapshot timestamp
    assert data["snapshot_at"] is not None
