"""Comprehensive End-to-End System Test for SIH 2026 Integrated Mine Safety Monitoring System.

Phase 10 Scope: Validates the complete integrated lifecycle from field setup
to telemetry ingestion, persistence, risk evaluation, alert generation,
AI anomaly detection, dashboard presentation, and alert resolution.

NOTE: All sensor readings and thresholds used in this test are SYNTHETIC DEMO DATA
created solely for prototype integration verification. They do NOT represent
official mine safety limits or certified sensor calibrations.
"""

from datetime import datetime, timezone, timedelta
import pytest
import pytest_asyncio
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.db.base import Base
from backend.app.db.session import get_db_session
from backend.app.main import app
from backend.app.models import (
    IntegratedNode,
    Mine,
    Sensor,
    Zone,
)

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_engine():
    """Create test engine and initialize clean tables."""
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
async def e2e_facility(session_factory):
    """Seed base facility: 1 mine, 1 zone, 1 node, and 3 multimodal sensors."""
    async with session_factory() as session:
        mine = Mine(name="End-to-End Test Colliery", code="E2E-COL-01")
        session.add(mine)
        await session.flush()

        zone = Zone(mine_id=mine.id, name="Active Extraction Gallery 4", code="EG-04")
        session.add(zone)
        await session.flush()

        node = IntegratedNode(
            zone_id=zone.id,
            node_identifier="NODE-E2E-LIVE",
            status="ACTIVE",
            last_seen_at=datetime.now(timezone.utc),
        )
        session.add(node)
        await session.flush()

        s1 = Sensor(
            node_id=node.id,
            sensor_type="methane_ch4",
            sensor_identifier="ch4_main",
            unit="%",
            is_active=True,
        )
        s2 = Sensor(
            node_id=node.id,
            sensor_type="temperature",
            sensor_identifier="temp_ambient",
            unit="degC",
            is_active=True,
        )
        s3 = Sensor(
            node_id=node.id,
            sensor_type="vibration",
            sensor_identifier="vib_axis_z",
            unit="mm/s",
            is_active=True,
        )
        session.add_all([s1, s2, s3])
        await session.commit()

        return {
            "mine_id": mine.id,
            "zone_id": zone.id,
            "node_identifier": node.node_identifier,
        }


def test_complete_end_to_end_lifecycle(client, e2e_facility):
    """Verify the complete end-to-end operational pipeline across Phases 1 through 9."""
    node_id = e2e_facility["node_identifier"]
    zone_id = e2e_facility["zone_id"]
    mine_id = e2e_facility["mine_id"]

    # --- STEP 1: Verify Health & Readiness ---
    health_resp = client.get("/api/v1/health")
    assert health_resp.status_code == 200
    assert health_resp.json() == {"status": "ok"}

    liveness_resp = client.get("/api/v1/health/liveness")
    assert liveness_resp.status_code == 200
    assert liveness_resp.json() == {"status": "alive"}

    readiness_resp = client.get("/api/v1/health/readiness")
    assert readiness_resp.status_code == 200
    assert readiness_resp.json()["database"] == "connected"

    # --- STEP 2: Configure Prototype Safety Rules ---
    # Threshold rule: methane_ch4 > 2.0% -> WARNING (Test configuration only)
    th_rule_payload = {
        "name": "Test Methane Advisory",
        "sensor_type": "methane_ch4",
        "operator": "GT",
        "threshold_value": 2.0,
        "severity": "WARNING",
        "description": "SYNTHETIC TEST: Methane elevation advisory threshold reached.",
        "is_active": True,
    }
    th_resp = client.post("/api/v1/rules/thresholds", json=th_rule_payload)
    assert th_resp.status_code == 201

    # Multi-parameter rule: methane_ch4 > 1.8 AND temperature > 38.0 -> CRITICAL
    multi_rule_payload = {
        "name": "Test Compound Gas and Heat Hazard",
        "severity": "CRITICAL",
        "description": "SYNTHETIC TEST: Compound elevated methane and heat detected.",
        "is_active": True,
        "conditions": [
            {"sensor_type": "methane_ch4", "operator": "GT", "threshold_value": 1.8},
            {"sensor_type": "temperature", "operator": "GT", "threshold_value": 38.0},
        ],
    }
    multi_resp = client.post("/api/v1/rules/correlations", json=multi_rule_payload)
    assert multi_resp.status_code == 201

    # --- STEP 3: Ingest Normal Telemetry Baseline ---
    now = datetime.now(timezone.utc)
    for i in range(10):
        t_stamp = (now - timedelta(minutes=15 - i)).isoformat()
        normal_frame = {
            "node_identifier": node_id,
            "timestamp": t_stamp,
            "readings": [
                {"sensor_type": "methane_ch4", "value": 0.4 + (i * 0.01)},
                {"sensor_type": "temperature", "value": 24.0 + (i * 0.1)},
                {"sensor_type": "vibration", "value": 0.05},
            ],
        }
        ingest_resp = client.post("/api/v1/ingestion/telemetry", json=normal_frame)
        assert ingest_resp.status_code == 201
        assert ingest_resp.json()["status"] == "success"

    # --- STEP 4: Query Historical Telemetry ---
    hist_resp = client.get(f"/api/v1/telemetry/nodes/{node_id}/history?sensor_type=methane_ch4")
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert hist_data["total_count"] == 10
    assert len(hist_data["readings"]) == 10

    # Aggregate check
    agg_resp = client.get(f"/api/v1/telemetry/nodes/{node_id}/aggregate?sensor_type=methane_ch4")
    assert agg_resp.status_code == 200
    assert agg_resp.json()["reading_count"] == 10

    # --- STEP 5: Ingest Compound Breach Telemetry ---
    # Triggering both the threshold rule (methane > 2.0) and multi-parameter rule (methane > 1.8 & temp > 38)
    breach_frame = {
        "node_identifier": node_id,
        "timestamp": now.isoformat(),
        "readings": [
            {"sensor_type": "methane_ch4", "value": 2.5},
            {"sensor_type": "temperature", "value": 41.2},
            {"sensor_type": "vibration", "value": 0.15},
        ],
    }
    breach_resp = client.post("/api/v1/ingestion/telemetry", json=breach_frame)
    assert breach_resp.status_code == 201

    # --- STEP 6: Verify Explainable Risk Assessment ---
    risk_resp = client.get(f"/api/v1/risk/nodes/{node_id}/latest")
    assert risk_resp.status_code == 200
    risk_data = risk_resp.json()
    assert risk_data["risk_level"] == "HIGH"
    assert len(risk_data["contributing_factors"]) >= 2
    factor_types = [f["factor_type"] for f in risk_data["contributing_factors"]]
    assert "THRESHOLD_BREACH" in factor_types
    assert "MULTI_PARAMETER_CORRELATION" in factor_types

    # --- STEP 7: Verify Active Safety Alerts ---
    alerts_resp = client.get(f"/api/v1/alerts/active?node_identifier={node_id}")
    assert alerts_resp.status_code == 200
    active_alerts = alerts_resp.json()
    assert len(active_alerts) >= 2
    severities = [a["severity"] for a in active_alerts]
    assert "CRITICAL" in severities
    assert "WARNING" in severities

    # Grab one alert for manual resolution test
    alert_to_resolve = active_alerts[0]

    # --- STEP 8: Verify AI Anomaly Output (Unsupervised Statistical) ---
    ai_resp = client.get(f"/api/v1/ai/nodes/{node_id}/latest")
    assert ai_resp.status_code == 200
    ai_records = ai_resp.json()
    assert len(ai_records) > 0

    # --- STEP 9: Verify Dashboard APIs ---
    # Mine detail
    mine_resp = client.get(f"/api/v1/mines/{mine_id}")
    assert mine_resp.status_code == 200
    assert mine_resp.json()["name"] == "End-to-End Test Colliery"

    # Zone detail
    zone_resp = client.get(f"/api/v1/zones/{zone_id}")
    assert zone_resp.status_code == 200
    assert zone_resp.json()["name"] == "Active Extraction Gallery 4"

    # Node detail
    node_detail_resp = client.get(f"/api/v1/nodes/{node_id}")
    assert node_detail_resp.status_code == 200
    assert len(node_detail_resp.json()["sensors"]) == 3

    # Consolidated Dashboard Overview Snapshot
    dash_resp = client.get("/api/v1/dashboard/overview")
    assert dash_resp.status_code == 200
    overview = dash_resp.json()
    assert overview["total_mines"] >= 1
    assert overview["total_zones"] >= 1
    assert overview["total_nodes"] >= 1
    assert overview["active_nodes"] >= 1
    assert overview["alerts"]["total"] >= 2
    assert overview["alerts"]["critical"] >= 1

    # --- STEP 10: Verify Alert Manual Resolution Lifecycle ---
    resolve_resp = client.post(
        f"/api/v1/alerts/{alert_to_resolve['id']}/resolve",
        json={"resolution_note": "SYNTHETIC TEST: Operator verified ventilation booster engaged."},
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "RESOLVED"

    # Verify active alerts decreased
    active_after_resp = client.get(f"/api/v1/alerts/active?node_identifier={node_id}")
    assert len(active_after_resp.json()) == len(active_alerts) - 1
