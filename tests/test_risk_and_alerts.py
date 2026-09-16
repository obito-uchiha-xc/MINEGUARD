"""Automated tests for Phase 6: Risk & Alert Engine."""

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
    MultiParameterRule,
    Sensor,
    ThresholdRule,
    Zone,
)
from backend.app.services.alert_service import AlertService
from backend.app.services.broadcaster import telemetry_broadcaster
from backend.app.services.risk_service import RiskService
from backend.app.services.rule_engine import RuleEngine, evaluate_comparison

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
async def setup_facility(session_factory):
    """Seed test facility with 1 mine, 1 zone, 2 nodes, and sensors."""
    async with session_factory() as session:
        mine = Mine(name="Risk Test Mine", code="RTM-01")
        session.add(mine)
        await session.flush()

        zone = Zone(mine_id=mine.id, name="Extraction Zone A", code="ZA")
        session.add(zone)
        await session.flush()

        now = datetime.now(timezone.utc)
        node1 = IntegratedNode(
            zone_id=zone.id,
            node_identifier="NODE-RISK-01",
            status="ACTIVE",
            last_seen_at=now,
        )
        node2 = IntegratedNode(
            zone_id=zone.id,
            node_identifier="NODE-RISK-02",
            status="ACTIVE",
            last_seen_at=now - timedelta(seconds=120),  # Past timeout
        )
        session.add_all([node1, node2])
        await session.flush()

        sensors = [
            Sensor(node_id=node1.id, sensor_type="temperature", unit="degC"),
            Sensor(node_id=node1.id, sensor_type="methane_ch4", unit="%"),
            Sensor(node_id=node1.id, sensor_type="displacement", unit="mm"),
            Sensor(node_id=node2.id, sensor_type="temperature", unit="degC"),
        ]
        session.add_all(sensors)
        await session.commit()

    return {
        "zone_id": zone.id,
        "node1": "NODE-RISK-01",
        "node2": "NODE-RISK-02",
    }


# ===========================================================================
# 1. Rule Engine Unit Tests
# ===========================================================================

def test_comparison_operators():
    """Verify numeric comparison helper for GT, GTE, LT, LTE."""
    assert evaluate_comparison(10.0, "GT", 5.0) is True
    assert evaluate_comparison(5.0, "GT", 5.0) is False
    assert evaluate_comparison(5.0, "GTE", 5.0) is True
    assert evaluate_comparison(4.0, "LT", 5.0) is True
    assert evaluate_comparison(5.0, "LT", 5.0) is False
    assert evaluate_comparison(5.0, "LTE", 5.0) is True
    assert evaluate_comparison(5.0, "INVALID", 5.0) is False


def test_threshold_rule_evaluation():
    """Verify evaluate_threshold_rule with active, disabled, and boundary conditions."""
    rule = ThresholdRule(
        name="High Temp",
        sensor_type="temperature",
        operator="GT",
        threshold_value=35.0,
        severity="WARNING",
        is_active=True,
    )
    # Below
    assert RuleEngine.evaluate_threshold_rule(rule, 30.0) is None
    # At
    assert RuleEngine.evaluate_threshold_rule(rule, 35.0) is None
    # Above
    factor = RuleEngine.evaluate_threshold_rule(rule, 36.2)
    assert factor is not None
    assert factor.factor_type == "THRESHOLD_BREACH"
    assert factor.sensor_type == "temperature"
    assert factor.observed_value == 36.2
    assert factor.severity == "WARNING"

    # Disabled rule
    rule.is_active = False
    assert RuleEngine.evaluate_threshold_rule(rule, 40.0) is None


def test_multi_parameter_rule_evaluation():
    """Verify evaluate_multi_parameter_rule joint condition evaluation."""
    rule = MultiParameterRule(
        name="Temp + Gas Correlation",
        conditions=[
            {"sensor_type": "temperature", "operator": "GT", "threshold_value": 35.0},
            {"sensor_type": "methane_ch4", "operator": "GT", "threshold_value": 1.0},
        ],
        severity="CRITICAL",
        is_active=True,
    )

    # Partial 1: only temp is high
    assert RuleEngine.evaluate_multi_parameter_rule(
        rule, {"temperature": 40.0, "methane_ch4": 0.5}
    ) is None

    # Partial 2: only gas is high
    assert RuleEngine.evaluate_multi_parameter_rule(
        rule, {"temperature": 25.0, "methane_ch4": 1.5}
    ) is None

    # Missing sensor
    assert RuleEngine.evaluate_multi_parameter_rule(
        rule, {"temperature": 40.0}
    ) is None

    # Both high -> satisfied!
    factor = RuleEngine.evaluate_multi_parameter_rule(
        rule, {"temperature": 38.0, "methane_ch4": 1.4}
    )
    assert factor is not None
    assert factor.factor_type == "MULTI_PARAMETER_CORRELATION"
    assert factor.severity == "CRITICAL"
    assert "Temp + Gas Correlation" in factor.message


# ===========================================================================
# 2. Rule Configuration API Tests
# ===========================================================================

def test_create_and_list_threshold_rules(client):
    """Test creating and retrieving configurable threshold rules."""
    payload = {
        "name": "Methane Critical Limit",
        "sensor_type": "methane_ch4",
        "operator": "GT",
        "threshold_value": 1.25,
        "severity": "CRITICAL",
        "is_active": True,
        "description": "Prototype methane alert threshold",
    }
    create_res = client.post("/api/v1/rules/thresholds", json=payload)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["name"] == "Methane Critical Limit"
    assert data["threshold_value"] == 1.25
    rule_id = data["id"]

    list_res = client.get("/api/v1/rules/thresholds")
    assert list_res.status_code == 200
    rules = list_res.json()
    assert any(r["id"] == rule_id for r in rules)


def test_create_and_list_correlation_rules(client):
    """Test creating and retrieving multi-parameter correlation rules."""
    payload = {
        "name": "Compound Ground + Gas",
        "conditions": [
            {"sensor_type": "displacement", "operator": "GT", "threshold_value": 10.0},
            {"sensor_type": "methane_ch4", "operator": "GT", "threshold_value": 0.8},
        ],
        "severity": "CRITICAL",
        "is_active": True,
        "description": "Multi-parameter ground movement + gas correlation",
    }
    create_res = client.post("/api/v1/rules/correlations", json=payload)
    assert create_res.status_code == 201
    data = create_res.json()
    assert len(data["conditions"]) == 2

    list_res = client.get("/api/v1/rules/correlations")
    assert list_res.status_code == 200
    assert any(r["id"] == data["id"] for r in list_res.json())


# ===========================================================================
# 3. Node & Zone Risk Evaluation Tests
# ===========================================================================

def test_node_risk_evaluation_normal(client, setup_facility):
    """Verify node with normal telemetry and active heartbeat reports NORMAL."""
    node1 = setup_facility["node1"]
    # Ingest normal reading
    client.post(
        "/api/v1/ingestion/telemetry",
        json={"node_identifier": node1, "readings": [{"sensor_type": "temperature", "value": 22.0}]},
    )

    res = client.get(f"/api/v1/risk/nodes/{node1}/latest")
    assert res.status_code == 200
    data = res.json()
    assert data["node_identifier"] == node1
    assert data["risk_level"] == "NORMAL"
    assert len(data["contributing_factors"]) == 0


def test_node_risk_evaluation_threshold_breach(client, setup_facility):
    """Verify node crossing a configured threshold reports elevated risk with explainable factors."""
    node1 = setup_facility["node1"]

    # Configure rule: temperature > 35.0 (WARNING)
    client.post(
        "/api/v1/rules/thresholds",
        json={
            "name": "High Temp Warning",
            "sensor_type": "temperature",
            "operator": "GT",
            "threshold_value": 35.0,
            "severity": "WARNING",
            "is_active": True,
        },
    )

    # Ingest reading crossing threshold
    client.post(
        "/api/v1/ingestion/telemetry",
        json={"node_identifier": node1, "readings": [{"sensor_type": "temperature", "value": 38.5}]},
    )

    res = client.get(f"/api/v1/risk/nodes/{node1}/latest")
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "ELEVATED"
    assert len(data["contributing_factors"]) == 1
    factor = data["contributing_factors"][0]
    assert factor["factor_type"] == "THRESHOLD_BREACH"
    assert factor["sensor_type"] == "temperature"
    assert factor["observed_value"] == 38.5


def test_node_risk_unresponsive_detection(client, setup_facility):
    """Verify node with last_seen_at past timeout reports NODE_UNRESPONSIVE factor."""
    node2 = setup_facility["node2"]  # Seeded with last_seen_at = 120s ago (> 60s timeout)

    res = client.get(f"/api/v1/risk/nodes/{node2}/latest")
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] in ("ELEVATED", "HIGH")
    unresp_factors = [f for f in data["contributing_factors"] if f["factor_type"] == "NODE_UNRESPONSIVE"]
    assert len(unresp_factors) == 1
    assert "timeout" in unresp_factors[0]["message"].lower()


def test_zone_risk_aggregation(client, setup_facility):
    """Verify zone risk rollup aggregates highest node risk level."""
    zone_id = setup_facility["zone_id"]
    res = client.get(f"/api/v1/risk/zones/{zone_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["zone_id"] == zone_id
    assert data["highest_risk_level"] in ("NORMAL", "ELEVATED", "HIGH")
    assert data["active_node_count"] >= 1
    assert data["unresponsive_node_count"] >= 1


# ===========================================================================
# 4. Alert Engine: Deduplication, Lifecycle & Resolution Tests
# ===========================================================================

def test_alert_generation_and_deduplication(client, setup_facility):
    """Verify alerts are created on breach, but NOT duplicated on repeated readings."""
    node1 = setup_facility["node1"]

    # Configure rule
    client.post(
        "/api/v1/rules/thresholds",
        json={
            "name": "Gas Threshold",
            "sensor_type": "methane_ch4",
            "operator": "GT",
            "threshold_value": 1.0,
            "severity": "CRITICAL",
            "is_active": True,
        },
    )

    # Ingest breach 1
    res1 = client.post(
        "/api/v1/ingestion/telemetry",
        json={"node_identifier": node1, "readings": [{"sensor_type": "methane_ch4", "value": 1.5}]},
    )
    assert res1.status_code == 201

    # Check active alerts: should be 1
    alerts_res1 = client.get(f"/api/v1/alerts/active?node_identifier={node1}")
    assert alerts_res1.status_code == 200
    active_alerts1 = alerts_res1.json()
    assert len(active_alerts1) == 1
    alert_id = active_alerts1[0]["id"]
    assert active_alerts1[0]["severity"] == "CRITICAL"
    assert active_alerts1[0]["status"] == "ACTIVE"

    # Ingest breach 2 (same condition)
    res2 = client.post(
        "/api/v1/ingestion/telemetry",
        json={"node_identifier": node1, "readings": [{"sensor_type": "methane_ch4", "value": 1.7}]},
    )
    assert res2.status_code == 201

    # Check active alerts: should STILL be exactly 1 (deduplication!)
    alerts_res2 = client.get(f"/api/v1/alerts/active?node_identifier={node1}")
    active_alerts2 = alerts_res2.json()
    assert len(active_alerts2) == 1
    assert active_alerts2[0]["id"] == alert_id


def test_alert_auto_resolution_on_recovery(client, setup_facility):
    """Verify an active alert automatically transitions to RESOLVED when condition clears."""
    node1 = setup_facility["node1"]

    # Configure rule
    client.post(
        "/api/v1/rules/thresholds",
        json={
            "name": "Displacement Warning",
            "sensor_type": "displacement",
            "operator": "GT",
            "threshold_value": 5.0,
            "severity": "WARNING",
            "is_active": True,
        },
    )

    # Trigger alert
    client.post(
        "/api/v1/ingestion/telemetry",
        json={"node_identifier": node1, "readings": [{"sensor_type": "displacement", "value": 7.2}]},
    )
    active_alerts = client.get(f"/api/v1/alerts/active?node_identifier={node1}").json()
    assert len(active_alerts) == 1
    alert_id = active_alerts[0]["id"]

    # Send normal reading -> clears breach
    client.post(
        "/api/v1/ingestion/telemetry",
        json={"node_identifier": node1, "readings": [{"sensor_type": "displacement", "value": 3.0}]},
    )

    # Active alerts should now be empty
    active_after = client.get(f"/api/v1/alerts/active?node_identifier={node1}").json()
    assert len(active_after) == 0

    # History should show resolved alert
    history = client.get(f"/api/v1/alerts/history?node_identifier={node1}").json()
    resolved_alert = next(a for a in history if a["id"] == alert_id)
    assert resolved_alert["status"] == "RESOLVED"
    assert resolved_alert["resolved_at"] is not None


def test_manual_alert_resolution(client, setup_facility):
    """Verify manual alert resolution endpoint."""
    node1 = setup_facility["node1"]

    # Trigger an alert
    client.post(
        "/api/v1/rules/thresholds",
        json={
            "name": "Temp Alert",
            "sensor_type": "temperature",
            "operator": "GT",
            "threshold_value": 30.0,
            "severity": "WARNING",
            "is_active": True,
        },
    )
    client.post(
        "/api/v1/ingestion/telemetry",
        json={"node_identifier": node1, "readings": [{"sensor_type": "temperature", "value": 32.0}]},
    )

    active = client.get(f"/api/v1/alerts/active?node_identifier={node1}").json()
    assert len(active) >= 1
    alert_id = active[0]["id"]

    # Manually resolve
    resolve_res = client.post(
        f"/api/v1/alerts/{alert_id}/resolve",
        json={"resolution_note": "Sensor re-calibrated by technician"},
    )
    assert resolve_res.status_code == 200
    data = resolve_res.json()
    assert data["status"] == "RESOLVED"
    assert data["resolved_at"] is not None
    assert data["context_data"].get("resolution_note") == "Sensor re-calibrated by technician"


# ===========================================================================
# 5. Live Alert WebSocket Integration Tests
# ===========================================================================

def test_live_alert_broadcast_over_websocket(client, setup_facility):
    """Verify WebSocket clients receive real-time LiveAlertEvent when an alert triggers."""
    node1 = setup_facility["node1"]

    # Configure rule
    client.post(
        "/api/v1/rules/thresholds",
        json={
            "name": "Live Methane Alert",
            "sensor_type": "methane_ch4",
            "operator": "GT",
            "threshold_value": 0.5,
            "severity": "CRITICAL",
            "is_active": True,
        },
    )

    with client.websocket_connect("/api/v1/ws/telemetry") as ws:
        # Ingest reading that triggers alert
        res = client.post(
            "/api/v1/ingestion/telemetry",
            json={"node_identifier": node1, "readings": [{"sensor_type": "methane_ch4", "value": 0.9}]},
        )
        assert res.status_code == 201

        # First message is telemetry
        frame1 = ws.receive_json()
        assert frame1["event_type"] == "telemetry"

        # Second message is the live alert!
        frame2 = ws.receive_json()
        assert frame2["event_type"] == "alert"
        assert frame2["node_identifier"] == node1
        assert frame2["severity"] == "CRITICAL"
        assert frame2["status"] == "ACTIVE"


# ===========================================================================
# 6. Safety Anti-Hallucination & Failure Isolation Tests
# ===========================================================================

def test_unconfigured_sensor_fails_safely(client, setup_facility):
    """Verify sensors with NO configured rules report NORMAL and do NOT invent safety limits."""
    node1 = setup_facility["node1"]

    # Ingest a reading for an unconfigured sensor
    client.post(
        "/api/v1/ingestion/telemetry",
        json={"node_identifier": node1, "readings": [{"sensor_type": "displacement", "value": 999.0}]},
    )

    res = client.get(f"/api/v1/risk/nodes/{node1}/latest")
    assert res.status_code == 200
    data = res.json()
    # No displacement rules configured -> NO displacement factor generated!
    disp_factors = [f for f in data["contributing_factors"] if f.get("sensor_type") == "displacement"]
    assert len(disp_factors) == 0


@pytest.mark.asyncio
async def test_alert_sync_failure_isolated_from_ingestion(session_factory, setup_facility, monkeypatch):
    """Verify error in alert sync does not abort or roll back raw telemetry ingestion."""
    from backend.app.schemas.ingestion import MeasurementItem, TelemetryIngestionRequest
    from backend.app.services.ingestion import TelemetryIngestionService

    node1 = setup_facility["node1"]

    # Mock AlertService.sync_alerts_for_node to raise an error
    async def mock_fail_sync(*args, **kwargs):
        raise RuntimeError("Simulated alert database failure")

    monkeypatch.setattr(AlertService, "sync_alerts_for_node", mock_fail_sync)

    payload = TelemetryIngestionRequest(
        node_identifier=node1,
        readings=[MeasurementItem(sensor_type="temperature", value=25.0)],
    )

    async with session_factory() as session:
        resp = await TelemetryIngestionService.ingest_telemetry(payload, session)
        assert resp.status == "success"
        assert resp.readings_persisted == 1
