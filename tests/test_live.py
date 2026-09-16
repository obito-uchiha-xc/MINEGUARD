"""Automated tests for Phase 5: Live Monitoring & WebSocket Telemetry Delivery."""

import asyncio
from datetime import datetime, timezone
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.db.base import Base
from backend.app.db.session import get_db_session
from backend.app.main import app
from backend.app.models import IntegratedNode, Mine, Sensor, Zone
from backend.app.schemas.live import (
    KeepalivePing,
    LiveTelemetryEvent,
    SubscriptionMessage,
)
from backend.app.schemas.telemetry import SensorReadingResponse
from backend.app.services.broadcaster import TelemetryBroadcaster, telemetry_broadcaster

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
async def setup_nodes(session_factory):
    """Seed test facility with 2 nodes and sensors."""
    async with session_factory() as session:
        mine = Mine(name="Live Test Mine", code="LTM-01")
        session.add(mine)
        await session.flush()

        zone = Zone(mine_id=mine.id, name="Main Drift", code="MD1")
        session.add(zone)
        await session.flush()

        node1 = IntegratedNode(
            zone_id=zone.id,
            node_identifier="NODE-LIVE-01",
            status="ACTIVE",
        )
        node2 = IntegratedNode(
            zone_id=zone.id,
            node_identifier="NODE-LIVE-02",
            status="ACTIVE",
        )
        session.add_all([node1, node2])
        await session.flush()

        s1 = Sensor(node_id=node1.id, sensor_type="temperature", unit="degC")
        s2 = Sensor(node_id=node1.id, sensor_type="methane_ch4", unit="%")
        s3 = Sensor(node_id=node2.id, sensor_type="temperature", unit="degC")
        session.add_all([s1, s2, s3])
        await session.commit()

    return "NODE-LIVE-01", "NODE-LIVE-02"


# ===========================================================================
# 1. Schema Tests (LiveTelemetryEvent, SubscriptionMessage, KeepalivePing)
# ===========================================================================

def test_live_telemetry_event_schema():
    """Verify LiveTelemetryEvent serialization and contract."""
    reading = SensorReadingResponse(
        id=1,
        sensor_id=10,
        sensor_type="temperature",
        sensor_identifier="TEMP-01",
        unit="degC",
        node_id=5,
        node_identifier="NODE-01",
        timestamp=datetime.now(timezone.utc),
        value=24.5,
    )
    event = LiveTelemetryEvent(
        node_identifier="NODE-01",
        node_id=5,
        readings=[reading],
        ingested_at=datetime.now(timezone.utc),
    )
    assert event.event_type == "telemetry"
    assert event.node_identifier == "NODE-01"
    assert len(event.readings) == 1
    assert event.readings[0].value == 24.5

    # Serializes to JSON cleanly
    json_str = event.model_dump_json()
    assert '"event_type":"telemetry"' in json_str
    assert '"node_identifier":"NODE-01"' in json_str


def test_subscription_message_schema():
    """Verify SubscriptionMessage parsing and default handling."""
    # With explicit node filter
    sub1 = SubscriptionMessage.model_validate({"action": "subscribe", "node_identifier": "NODE-01"})
    assert sub1.action == "subscribe"
    assert sub1.node_identifier == "NODE-01"

    # With None / all nodes
    sub2 = SubscriptionMessage.model_validate({"action": "subscribe"})
    assert sub2.action == "subscribe"
    assert sub2.node_identifier is None

    # Extra fields ignored
    sub3 = SubscriptionMessage.model_validate({
        "action": "subscribe",
        "node_identifier": "NODE-02",
        "extra_field": 123,
    })
    assert sub3.node_identifier == "NODE-02"


def test_keepalive_ping_schema():
    """Verify KeepalivePing construction and schema."""
    now = datetime.now(timezone.utc)
    ping = KeepalivePing(server_time=now)
    assert ping.event_type == "ping"
    assert ping.server_time == now
    data = ping.model_dump()
    assert data["event_type"] == "ping"


# ===========================================================================
# 2. Broadcaster Unit Tests (Pub/Sub, Filtering, Backpressure)
# ===========================================================================

@pytest.mark.asyncio
async def test_broadcaster_subscribe_and_unsubscribe():
    """Verify client subscription lifecycle and count tracking."""
    broadcaster = TelemetryBroadcaster(max_queue_size=10)
    assert broadcaster.client_count == 0

    cid1 = await broadcaster.subscribe(node_filter=None)
    assert broadcaster.client_count == 1

    cid2 = await broadcaster.subscribe(node_filter="NODE-A")
    assert broadcaster.client_count == 2

    await broadcaster.unsubscribe(cid1)
    assert broadcaster.client_count == 1

    await broadcaster.unsubscribe(cid2)
    assert broadcaster.client_count == 0

    # Idempotent unsubscribe on unknown id
    await broadcaster.unsubscribe("non-existent-id")
    assert broadcaster.client_count == 0


@pytest.mark.asyncio
async def test_broadcaster_filtering_logic():
    """Verify events are delivered only to matching or unfiltered subscribers."""
    broadcaster = TelemetryBroadcaster(max_queue_size=10)

    # Client A wants ALL nodes
    cid_all = await broadcaster.subscribe(node_filter=None)
    q_all = await broadcaster.get_queue(cid_all)

    # Client B wants NODE-01 only
    cid_node1 = await broadcaster.subscribe(node_filter="NODE-01")
    q_node1 = await broadcaster.get_queue(cid_node1)

    # Client C wants NODE-02 only
    cid_node2 = await broadcaster.subscribe(node_filter="NODE-02")
    q_node2 = await broadcaster.get_queue(cid_node2)

    # Publish event for NODE-01
    event1 = LiveTelemetryEvent(
        node_identifier="NODE-01",
        node_id=1,
        readings=[],
        ingested_at=datetime.now(timezone.utc),
    )
    await broadcaster.publish(event1)

    # Check queues
    assert q_all.qsize() == 1
    assert q_node1.qsize() == 1
    assert q_node2.qsize() == 0

    # Publish event for NODE-02
    event2 = LiveTelemetryEvent(
        node_identifier="NODE-02",
        node_id=2,
        readings=[],
        ingested_at=datetime.now(timezone.utc),
    )
    await broadcaster.publish(event2)

    assert q_all.qsize() == 2
    assert q_node1.qsize() == 1
    assert q_node2.qsize() == 1

    # Cleanup
    await broadcaster.unsubscribe(cid_all)
    await broadcaster.unsubscribe(cid_node1)
    await broadcaster.unsubscribe(cid_node2)


@pytest.mark.asyncio
async def test_broadcaster_filter_update():
    """Verify updating a client's node filter dynamically."""
    broadcaster = TelemetryBroadcaster(max_queue_size=10)
    cid = await broadcaster.subscribe(node_filter="NODE-01")
    q = await broadcaster.get_queue(cid)

    # Event for NODE-02 -> not delivered
    await broadcaster.publish(LiveTelemetryEvent(
        node_identifier="NODE-02",
        node_id=2,
        readings=[],
        ingested_at=datetime.now(timezone.utc),
    ))
    assert q.qsize() == 0

    # Update filter to NODE-02
    await broadcaster.update_filter(cid, "NODE-02")

    # Event for NODE-02 -> now delivered
    await broadcaster.publish(LiveTelemetryEvent(
        node_identifier="NODE-02",
        node_id=2,
        readings=[],
        ingested_at=datetime.now(timezone.utc),
    ))
    assert q.qsize() == 1

    await broadcaster.unsubscribe(cid)


@pytest.mark.asyncio
async def test_broadcaster_backpressure_drop_newest():
    """Verify bounded queue drops newest event on full queue without blocking."""
    # Max size = 2
    broadcaster = TelemetryBroadcaster(max_queue_size=2)
    cid = await broadcaster.subscribe(node_filter=None)
    q = await broadcaster.get_queue(cid)

    for i in range(5):
        event = LiveTelemetryEvent(
            node_identifier="NODE-01",
            node_id=1,
            readings=[],
            ingested_at=datetime.now(timezone.utc),
        )
        # Should not raise QueueFull or block
        await broadcaster.publish(event)

    # Queue should be at max capacity (2)
    assert q.qsize() == 2
    await broadcaster.unsubscribe(cid)


@pytest.mark.asyncio
async def test_broadcaster_publish_with_no_clients():
    """Verify publishing when no clients are subscribed exits cleanly."""
    broadcaster = TelemetryBroadcaster()
    event = LiveTelemetryEvent(
        node_identifier="NODE-01",
        node_id=1,
        readings=[],
        ingested_at=datetime.now(timezone.utc),
    )
    # Must not raise
    await broadcaster.publish(event)
    assert broadcaster.client_count == 0


# ===========================================================================
# 3. Integration Tests: WebSocket Endpoint & Ingestion Pipeline
# ===========================================================================

def test_ws_connection_and_disconnect(client):
    """Verify client connects and disconnects cleanly, updating broadcaster registry."""
    import time
    initial_clients = telemetry_broadcaster.client_count

    with client.websocket_connect("/api/v1/ws/telemetry") as ws:
        # Client count increases
        assert telemetry_broadcaster.client_count == initial_clients + 1

    # On exit from context, pump the TestClient event loop so the background cleanup finishes
    cleaned_up = False
    for _ in range(50):
        client.get("/api/v1/health")
        if telemetry_broadcaster.client_count == initial_clients:
            cleaned_up = True
            break
        time.sleep(0.02)

    assert cleaned_up, f"Expected {initial_clients} clients, but found {telemetry_broadcaster.client_count}"


def test_ws_receives_live_telemetry_on_ingestion(client, setup_nodes):
    """Verify that posting ingestion telemetry delivers live frame to connected WS."""
    node1, _ = setup_nodes

    with client.websocket_connect("/api/v1/ws/telemetry") as ws:
        # Ingest payload for node 1
        payload = {
            "node_identifier": node1,
            "readings": [
                {"sensor_type": "temperature", "value": 26.8},
                {"sensor_type": "methane_ch4", "value": 0.4},
            ],
        }
        res = client.post("/api/v1/ingestion/telemetry", json=payload)
        assert res.status_code == 201

        # Receive WebSocket message
        frame = ws.receive_json()
        assert frame["event_type"] == "telemetry"
        assert frame["node_identifier"] == node1
        assert len(frame["readings"]) == 2
        sensor_types = {r["sensor_type"] for r in frame["readings"]}
        assert "temperature" in sensor_types
        assert "methane_ch4" in sensor_types
        assert "ingested_at" in frame


def test_ws_node_filter_receives_only_target_node(client, setup_nodes):
    """Verify a filtered WS client receives only matching node telemetry."""
    node1, node2 = setup_nodes

    with client.websocket_connect("/api/v1/ws/telemetry") as ws_filtered:
        # Subscribe specifically to node2
        ws_filtered.send_json({"action": "subscribe", "node_identifier": node2})
        ack = ws_filtered.receive_json()
        assert ack["event_type"] == "subscribed"
        assert ack["node_identifier"] == node2

        # Post data for node1
        res1 = client.post(
            "/api/v1/ingestion/telemetry",
            json={"node_identifier": node1, "readings": [{"sensor_type": "temperature", "value": 20.0}]},
        )
        assert res1.status_code == 201

        # Post data for node2
        res2 = client.post(
            "/api/v1/ingestion/telemetry",
            json={"node_identifier": node2, "readings": [{"sensor_type": "temperature", "value": 31.5}]},
        )
        assert res2.status_code == 201

        # The filtered client should immediately receive node2 telemetry (not node1)
        frame = ws_filtered.receive_json()
        assert frame["event_type"] == "telemetry"
        assert frame["node_identifier"] == node2
        assert frame["readings"][0]["value"] == 31.5


def test_ws_multiple_clients_fanout(client, setup_nodes):
    """Verify multiple connected clients both receive the broadcast."""
    node1, _ = setup_nodes

    with client.websocket_connect("/api/v1/ws/telemetry") as ws1:
        with client.websocket_connect("/api/v1/ws/telemetry") as ws2:
            payload = {
                "node_identifier": node1,
                "readings": [{"sensor_type": "temperature", "value": 28.3}],
            }
            res = client.post("/api/v1/ingestion/telemetry", json=payload)
            assert res.status_code == 201

            frame1 = ws1.receive_json()
            frame2 = ws2.receive_json()

            assert frame1["event_type"] == "telemetry"
            assert frame2["event_type"] == "telemetry"
            assert frame1["node_identifier"] == node1
            assert frame2["node_identifier"] == node1
            assert frame1["readings"][0]["value"] == 28.3
            assert frame2["readings"][0]["value"] == 28.3


def test_ws_invalid_message_gracefully_ignored(client, setup_nodes):
    """Verify invalid JSON or unrecognized action does not disconnect WS."""
    node1, _ = setup_nodes

    with client.websocket_connect("/api/v1/ws/telemetry") as ws:
        # Send garbage string
        ws.send_text("NOT_JSON")
        # Send unknown action
        ws.send_json({"action": "unknown_action", "foo": "bar"})

        # Now send valid ingestion to check connection is still healthy
        payload = {
            "node_identifier": node1,
            "readings": [{"sensor_type": "temperature", "value": 19.9}],
        }
        res = client.post("/api/v1/ingestion/telemetry", json=payload)
        assert res.status_code == 201

        frame = ws.receive_json()
        assert frame["event_type"] == "telemetry"
        assert frame["node_identifier"] == node1


@pytest.mark.asyncio
async def test_broadcast_failure_isolated_from_ingestion_transaction(session_factory, setup_nodes, monkeypatch):
    """Verify that if live broadcast raises an unexpected error, DB persistence still succeeds."""
    node1, _ = setup_nodes
    from backend.app.services.ingestion import TelemetryIngestionService
    from backend.app.schemas.ingestion import TelemetryIngestionRequest, MeasurementItem

    # Mock broadcaster.publish to raise an error
    async def mock_fail_publish(event):
        raise RuntimeError("Simulated network/queue broadcaster failure")

    monkeypatch.setattr(telemetry_broadcaster, "publish", mock_fail_publish)

    payload = TelemetryIngestionRequest(
        node_identifier=node1,
        readings=[MeasurementItem(sensor_type="temperature", value=22.0)],
    )

    async with session_factory() as session:
        # Ingestion must succeed without raising exception
        resp = await TelemetryIngestionService.ingest_telemetry(payload, session)
        assert resp.status == "success"
        assert resp.readings_persisted == 1

