"""Dashboard Composite Overview Endpoint.

Phase 8 Scope: Consolidated operational overview snapshot delegating to existing
Risk and Alert services for spatial safety mapping.
"""

from datetime import datetime, timezone
from typing import Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.db.session import get_db_session
from backend.app.models.alert import Alert
from backend.app.models.mine import Mine
from backend.app.models.node import IntegratedNode
from backend.app.models.zone import Zone
from backend.app.schemas.dashboard import (
    AlertSeverityCount,
    DashboardOverviewResponse,
)
from backend.app.schemas.risk import ZoneRiskSummaryResponse
from backend.app.services.risk_service import RiskService, _ensure_utc

router = APIRouter(prefix="/dashboard", tags=["Dashboard / Overview"])
settings = get_settings()


@router.get(
    "/overview",
    response_model=DashboardOverviewResponse,
    summary="Get composite dashboard operational overview",
    description=(
        "Returns a high-level operational overview including facility counts, node liveness, "
        "active alerts categorized by severity, and zone risk summaries for the Mine Risk Map. "
        "Delegates to RiskService and AlertService without duplicating business logic."
    ),
)
async def get_dashboard_overview(
    session: AsyncSession = Depends(get_db_session),
) -> DashboardOverviewResponse:
    """Retrieve operational dashboard overview snapshot."""
    now = datetime.now(timezone.utc)
    timeout_s = settings.NODE_UNRESPONSIVE_TIMEOUT_S

    # 1. Total Mines & Total Zones
    mine_count_res = await session.execute(select(func.count(Mine.id)))
    total_mines = mine_count_res.scalar() or 0

    zone_stmt = select(Zone).order_by(Zone.id)
    zone_res = await session.execute(zone_stmt)
    zones = zone_res.scalars().all()
    total_zones = len(zones)

    # 2. Nodes Liveness Assessment
    node_stmt = select(IntegratedNode)
    node_res = await session.execute(node_stmt)
    nodes = node_res.scalars().all()
    total_nodes = len(nodes)

    active_nodes = 0
    unresponsive_nodes = 0

    for node in nodes:
        last_seen = _ensure_utc(node.last_seen_at)
        if last_seen is None or (now - last_seen).total_seconds() > timeout_s:
            unresponsive_nodes += 1
        else:
            active_nodes += 1

    # 3. Active Alerts Breakdown by Severity
    alert_stmt = (
        select(Alert.severity, func.count(Alert.id))
        .where(Alert.status == "ACTIVE")
        .group_by(Alert.severity)
    )
    alert_res = await session.execute(alert_stmt)
    severity_counts: Dict[str, int] = dict(alert_res.all())

    warning_count = severity_counts.get("WARNING", 0)
    critical_count = severity_counts.get("CRITICAL", 0)
    total_alerts = sum(severity_counts.values())

    alert_summary = AlertSeverityCount(
        warning=warning_count,
        critical=critical_count,
        total=total_alerts,
    )

    # 4. Zone Risk Rollups (Mine Risk Map)
    risk_service = RiskService(session)
    zones_overview: List[ZoneRiskSummaryResponse] = []
    for zone in zones:
        zone_risk = await risk_service.evaluate_zone_risk(zone.id)
        zones_overview.append(zone_risk)

    return DashboardOverviewResponse(
        total_mines=total_mines,
        total_zones=total_zones,
        total_nodes=total_nodes,
        active_nodes=active_nodes,
        unresponsive_nodes=unresponsive_nodes,
        alerts=alert_summary,
        zones_overview=zones_overview,
        snapshot_at=now,
    )
