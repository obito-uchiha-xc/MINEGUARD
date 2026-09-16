"""Risk Evaluation Service.

Phase 6 Scope: Orchestrates rule evaluation, node liveness inspection, and explainable
risk assessment generation. Preserves contributing factors without inventing black-box scores.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.core.errors import AppException
from backend.app.core.logging import get_logger
from backend.app.models.alert import Alert
from backend.app.models.node import IntegratedNode
from backend.app.models.risk import RiskAssessmentRecord
from backend.app.models.rule import MultiParameterRule, ThresholdRule
from backend.app.models.zone import Zone
from backend.app.repositories.telemetry import TelemetryRepository
from backend.app.schemas.risk import (
    ContributingFactor,
    RiskAssessmentResponse,
    ZoneRiskSummaryResponse,
)
from backend.app.services.rule_engine import RuleEngine

logger = get_logger(__name__)
settings = get_settings()


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure a datetime object is timezone-aware in UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class RiskService:
    """Service for computing explainable node and zone risk assessments."""

    def __init__(
        self,
        session: AsyncSession,
        repository: Optional[TelemetryRepository] = None,
    ) -> None:
        self.session = session
        self.repo = repository or TelemetryRepository(session)

    async def evaluate_node_risk(
        self,
        node: IntegratedNode,
        now: Optional[datetime] = None,
        persist: bool = True,
    ) -> RiskAssessmentResponse:
        """Evaluate explainable risk for a node against active rules and liveness.

        🟢 SPEC: BE-REQ-016 — Node-level risk scoring and classification.
        🔵 DECISION D-025: Prototype risk classification (NORMAL / ELEVATED / HIGH).
        """
        eval_time = _ensure_utc(now) or datetime.now(timezone.utc)
        factors: List[ContributingFactor] = []

        # 1. Node Liveness / Unresponsiveness Check (BE-REQ-023, D-027)
        timeout_s = settings.NODE_UNRESPONSIVE_TIMEOUT_S
        last_seen = _ensure_utc(node.last_seen_at)
        if last_seen is None:
            factors.append(
                ContributingFactor(
                    factor_type="NODE_UNRESPONSIVE",
                    severity="WARNING",
                    message=(
                        f"Node '{node.node_identifier}' has not reported any telemetry since deployment."
                    ),
                )
            )
        else:
            delta_s = (eval_time - last_seen).total_seconds()
            if delta_s > timeout_s:
                factors.append(
                    ContributingFactor(
                        factor_type="NODE_UNRESPONSIVE",
                        severity="WARNING",
                        message=(
                            f"Node '{node.node_identifier}' has not reported telemetry for "
                            f"{int(delta_s)}s (exceeds configured timeout of {timeout_s}s)."
                        ),
                    )
                )


        # 2. Fetch latest reading per sensor for this node
        latest_pairs = await self.repo.get_latest_reading_per_sensor(node.id)
        latest_by_type: Dict[str, float] = {
            sensor.sensor_type: reading.value for reading, sensor in latest_pairs
        }

        # 3. Load active threshold rules from DB
        stmt_thresh = select(ThresholdRule).where(ThresholdRule.is_active.is_(True))
        thresh_res = await self.session.execute(stmt_thresh)
        threshold_rules = thresh_res.scalars().all()

        for rule in threshold_rules:
            if rule.sensor_type in latest_by_type:
                val = latest_by_type[rule.sensor_type]
                factor = RuleEngine.evaluate_threshold_rule(rule, val)
                if factor is not None:
                    factors.append(factor)

        # 4. Load active multi-parameter correlation rules from DB
        stmt_multi = select(MultiParameterRule).where(MultiParameterRule.is_active.is_(True))
        multi_res = await self.session.execute(stmt_multi)
        multi_rules = multi_res.scalars().all()


        for mrule in multi_rules:
            mfactor = RuleEngine.evaluate_multi_parameter_rule(mrule, latest_by_type)
            if mfactor is not None:
                factors.append(mfactor)

        # 5. Compute Prototype Risk Level (🔵 D-025)
        # Criteria:
        #   - Any CRITICAL factor OR >= 2 factors -> HIGH
        #   - At least 1 WARNING factor -> ELEVATED
        #   - 0 factors -> NORMAL
        has_critical = any(f.severity == "CRITICAL" for f in factors)
        if has_critical or len(factors) >= 2:
            risk_level = "HIGH"
        elif len(factors) == 1:
            risk_level = "ELEVATED"
        else:
            risk_level = "NORMAL"

        # 6. Optional Persistence of Assessment Record
        if persist:
            record = RiskAssessmentRecord(
                node_id=node.id,
                risk_level=risk_level,
                contributing_factors=[f.model_dump() for f in factors],
                assessed_at=eval_time,
            )
            self.session.add(record)
            await self.session.flush()

        logger.debug(
            f"Node '{node.node_identifier}' risk assessed: {risk_level} ({len(factors)} factors)"
        )

        return RiskAssessmentResponse(
            node_id=node.id,
            node_identifier=node.node_identifier,
            risk_level=risk_level,
            contributing_factors=factors,
            assessed_at=eval_time,
            evaluation_metadata={
                "evaluated_sensor_types": list(latest_by_type.keys()),
                "threshold_rules_checked": len(threshold_rules),
                "multi_rules_checked": len(multi_rules),
            },
        )

    async def evaluate_zone_risk(
        self,
        zone_id: int,
    ) -> ZoneRiskSummaryResponse:
        """Aggregate node risk assessments for an operational mine zone.

        🟢 SPEC: BE-REQ-019 — Aggregate and map node risk scores to operational mine zones.
        """
        zone_stmt = select(Zone).where(Zone.id == zone_id)
        zone_res = await self.session.execute(zone_stmt)
        zone = zone_res.scalar_one_or_none()
        if not zone:
            raise AppException(
                code="ZONE_NOT_FOUND",
                message=f"Zone with ID {zone_id} does not exist.",
                status_code=404,
                details={"zone_id": zone_id},
            )

        # Fetch nodes in this zone
        nodes_stmt = select(IntegratedNode).where(IntegratedNode.zone_id == zone_id)
        nodes_res = await self.session.execute(nodes_stmt)
        nodes = nodes_res.scalars().all()

        now = datetime.now(timezone.utc)
        timeout_s = settings.NODE_UNRESPONSIVE_TIMEOUT_S

        active_nodes = 0
        unresponsive_nodes = 0
        highest_level = "NORMAL"

        level_priority = {"NORMAL": 0, "ELEVATED": 1, "HIGH": 2}

        for node in nodes:
            # Check liveness
            last_seen = _ensure_utc(node.last_seen_at)
            if (
                last_seen is None
                or (now - last_seen).total_seconds() > timeout_s
            ):
                unresponsive_nodes += 1
            else:
                active_nodes += 1

            # Evaluate node risk
            node_risk = await self.evaluate_node_risk(node, now=now, persist=False)
            if level_priority.get(node_risk.risk_level, 0) > level_priority.get(highest_level, 0):
                highest_level = node_risk.risk_level

        # Count active alerts in this zone
        alert_stmt = select(Alert).join(IntegratedNode).where(
            IntegratedNode.zone_id == zone_id,
            Alert.status == "ACTIVE",
        )
        alert_res = await self.session.execute(alert_stmt)
        active_alert_count = len(alert_res.scalars().all())


        return ZoneRiskSummaryResponse(
            zone_id=zone.id,
            zone_name=zone.name,
            zone_code=zone.code,
            highest_risk_level=highest_level,
            active_node_count=active_nodes,
            unresponsive_node_count=unresponsive_nodes,
            active_alert_count=active_alert_count,
            assessed_at=now,
        )
