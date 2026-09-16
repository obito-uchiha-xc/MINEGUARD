"""Alert Management & Lifecycle Service.

Phase 6 Scope: Handles alert generation, deduplication, auto-resolution, and manual
resolution. Reuses Phase 5 WebSocket broadcaster for live alert event delivery.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.core.errors import AppException
from backend.app.core.logging import get_logger
from backend.app.models.alert import Alert
from backend.app.models.node import IntegratedNode
from backend.app.schemas.alert import AlertResponse
from backend.app.schemas.live import LiveAlertEvent
from backend.app.schemas.risk import ContributingFactor
from backend.app.services.broadcaster import telemetry_broadcaster

logger = get_logger(__name__)
settings = get_settings()


def build_condition_key(factor: ContributingFactor) -> str:
    """Derive a deterministic deduplication key for a risk factor."""
    if factor.factor_type == "THRESHOLD_BREACH":
        return f"threshold:{factor.sensor_type}:{factor.rule_name}"
    if factor.factor_type == "MULTI_PARAMETER_CORRELATION":
        return f"multi:{factor.rule_name}"
    if factor.factor_type == "NODE_UNRESPONSIVE":
        return "node_unresponsive"
    return f"factor:{factor.factor_type}"


class AlertService:
    """Service managing safety alerts, deduplication, and lifecycle transitions."""

    @staticmethod
    async def sync_alerts_for_node(
        session: AsyncSession,
        node: IntegratedNode,
        factors: List[ContributingFactor],
        now: Optional[datetime] = None,
        broadcast: bool = True,
    ) -> List[Alert]:
        """Synchronize active alerts for a node against current risk factors.

        🔵 DECISION D-028: Alert Deduplication Policy:
          - An active factor with no corresponding ACTIVE alert triggers a new Alert record.
          - An active factor that already has an ACTIVE alert does NOT create duplicates.
          - A previously active alert whose condition is no longer present in factors is auto-resolved.

        Returns list of newly triggered or modified alerts.
        """
        current_time = now or datetime.now(timezone.utc)

        # 1. Fetch currently ACTIVE alerts for this node
        stmt = select(Alert).where(
            Alert.node_id == node.id,
            Alert.status == "ACTIVE",
        )
        res = await session.execute(stmt)
        active_alerts: Dict[str, Alert] = {
            a.condition_key: a for a in res.scalars().all()
        }

        # 2. Map current factors by condition key
        current_factor_map: Dict[str, ContributingFactor] = {
            build_condition_key(f): f for f in factors
        }

        alerts_to_broadcast: List[Alert] = []

        # 3. Detect new conditions -> create alerts
        for cond_key, factor in current_factor_map.items():
            if cond_key not in active_alerts:
                # Map factor_type to alert_type
                if factor.factor_type == "THRESHOLD_BREACH":
                    alert_type = "THRESHOLD"
                elif factor.factor_type == "MULTI_PARAMETER_CORRELATION":
                    alert_type = "MULTI_PARAMETER"
                elif factor.factor_type == "NODE_UNRESPONSIVE":
                    alert_type = "NODE_UNRESPONSIVE"
                else:
                    alert_type = "GENERAL"

                new_alert = Alert(
                    node_id=node.id,
                    alert_type=alert_type,
                    condition_key=cond_key,
                    severity=factor.severity,
                    status="ACTIVE",
                    message=factor.message,
                    context_data={
                        "sensor_type": factor.sensor_type,
                        "observed_value": factor.observed_value,
                        "threshold_value": factor.threshold_value,
                        "operator": factor.operator,
                        "rule_name": factor.rule_name,
                    },
                    triggered_at=current_time,
                )
                session.add(new_alert)
                alerts_to_broadcast.append(new_alert)
                logger.warning(
                    f"NEW ALERT triggered for node '{node.node_identifier}': "
                    f"[{alert_type}] {factor.message}"
                )

        # 4. Auto-resolve cleared conditions
        for cond_key, alert in active_alerts.items():
            if cond_key not in current_factor_map:
                alert.status = "RESOLVED"
                alert.resolved_at = current_time
                alerts_to_broadcast.append(alert)
                logger.info(
                    f"ALERT RESOLVED for node '{node.node_identifier}': "
                    f"condition '{cond_key}' cleared."
                )

        await session.flush()

        # 5. Broadcast live alert events via Phase 5 WebSocket channel
        if broadcast and alerts_to_broadcast:
            for a in alerts_to_broadcast:
                try:
                    event = LiveAlertEvent(
                        node_identifier=node.node_identifier,
                        node_id=node.id,
                        alert_id=a.id,
                        alert_type=a.alert_type,
                        severity=a.severity,
                        status=a.status,
                        message=a.message,
                        context_data=a.context_data,
                        emitted_at=current_time,
                    )
                    await telemetry_broadcaster.publish(event)
                except Exception as b_err:
                    logger.warning(f"Failed to broadcast live alert: {b_err}")

        return alerts_to_broadcast

    @staticmethod
    async def resolve_alert(
        session: AsyncSession,
        alert_id: int,
        resolution_note: Optional[str] = None,
    ) -> AlertResponse:
        """Manually resolve an active alert."""
        stmt = select(Alert).where(Alert.id == alert_id)
        res = await session.execute(stmt)
        alert = res.scalar_one_or_none()

        if not alert:
            raise AppException(
                code="ALERT_NOT_FOUND",
                message=f"Alert with ID {alert_id} does not exist.",
                status_code=404,
                details={"alert_id": alert_id},
            )

        if alert.status == "RESOLVED":
            # Already resolved — idempotent
            return AlertResponse(
                id=alert.id,
                node_id=alert.node_id,
                node_identifier=alert.node.node_identifier,
                alert_type=alert.alert_type,
                condition_key=alert.condition_key,
                severity=alert.severity,
                status=alert.status,
                message=alert.message,
                context_data=alert.context_data,
                triggered_at=alert.triggered_at,
                resolved_at=alert.resolved_at,
                created_at=alert.created_at,
            )

        now = datetime.now(timezone.utc)
        alert.status = "RESOLVED"
        alert.resolved_at = now
        if resolution_note:
            ctx = dict(alert.context_data)
            ctx["resolution_note"] = resolution_note
            alert.context_data = ctx

        await session.commit()

        # Broadcast manual resolution
        try:
            event = LiveAlertEvent(
                node_identifier=alert.node.node_identifier,
                node_id=alert.node_id,
                alert_id=alert.id,
                alert_type=alert.alert_type,
                severity=alert.severity,
                status=alert.status,
                message=f"Alert manually resolved: {alert.message}",
                context_data=alert.context_data,
                emitted_at=now,
            )
            await telemetry_broadcaster.publish(event)
        except Exception as b_err:
            logger.warning(f"Failed to broadcast manual alert resolution: {b_err}")

        return AlertResponse(
            id=alert.id,
            node_id=alert.node_id,
            node_identifier=alert.node.node_identifier,
            alert_type=alert.alert_type,
            condition_key=alert.condition_key,
            severity=alert.severity,
            status=alert.status,
            message=alert.message,
            context_data=alert.context_data,
            triggered_at=alert.triggered_at,
            resolved_at=alert.resolved_at,
            created_at=alert.created_at,
        )

    @staticmethod
    async def get_active_alerts(
        session: AsyncSession,
        node_identifier: Optional[str] = None,
    ) -> List[AlertResponse]:
        """Query currently ACTIVE alerts."""
        query = select(Alert).join(IntegratedNode).where(Alert.status == "ACTIVE")
        if node_identifier:
            query = query.where(IntegratedNode.node_identifier == node_identifier)

        query = query.order_by(desc(Alert.triggered_at))
        res = await session.execute(query)
        alerts = res.scalars().all()

        return [
            AlertResponse(
                id=a.id,
                node_id=a.node_id,
                node_identifier=a.node.node_identifier,
                alert_type=a.alert_type,
                condition_key=a.condition_key,
                severity=a.severity,
                status=a.status,
                message=a.message,
                context_data=a.context_data,
                triggered_at=a.triggered_at,
                resolved_at=a.resolved_at,
                created_at=a.created_at,
            )
            for a in alerts
        ]

    @staticmethod
    async def get_historical_alerts(
        session: AsyncSession,
        node_identifier: Optional[str] = None,
        alert_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AlertResponse]:
        """Query alert history with pagination and filters."""
        query = select(Alert).join(IntegratedNode)
        if node_identifier:
            query = query.where(IntegratedNode.node_identifier == node_identifier)
        if alert_type:
            query = query.where(Alert.alert_type == alert_type)
        if status:
            query = query.where(Alert.status == status)

        query = query.order_by(desc(Alert.triggered_at)).offset(offset).limit(min(limit, 500))
        res = await session.execute(query)
        alerts = res.scalars().all()

        return [
            AlertResponse(
                id=a.id,
                node_id=a.node_id,
                node_identifier=a.node.node_identifier,
                alert_type=a.alert_type,
                condition_key=a.condition_key,
                severity=a.severity,
                status=a.status,
                message=a.message,
                context_data=a.context_data,
                triggered_at=a.triggered_at,
                resolved_at=a.resolved_at,
                created_at=a.created_at,
            )
            for a in alerts
        ]
