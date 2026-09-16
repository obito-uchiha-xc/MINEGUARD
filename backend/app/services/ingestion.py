"""Telemetry Ingestion Service.

Implements the controlled ingestion pipeline:
Validation -> Node Resolution -> Sensor Mapping -> Persistence.
Phase 3 Scope: Strictly handles ingestion, validation, and storage.
Does NOT compute risk scores, trigger alerts, or run AI models.
Phase 5 Addition: After successful DB commit, publishes a LiveTelemetryEvent
to the TelemetryBroadcaster for connected WebSocket clients.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.errors import AppException
from backend.app.core.logging import get_logger
from backend.app.models import IntegratedNode, Sensor, SensorReading
from backend.app.schemas.ingestion import (
    TelemetryIngestionRequest,
    TelemetryIngestionResponse,
)
from backend.app.schemas.live import LiveTelemetryEvent
from backend.app.schemas.telemetry import SensorReadingResponse
from backend.app.services.ai.ai_service import AIService
from backend.app.services.alert_service import AlertService
from backend.app.services.broadcaster import telemetry_broadcaster
from backend.app.services.risk_service import RiskService

logger = get_logger(__name__)


class TelemetryIngestionService:
    """Service for processing incoming telemetry frames from the Mother System."""

    @staticmethod
    async def ingest_telemetry(
        payload: TelemetryIngestionRequest,
        session: AsyncSession,
    ) -> TelemetryIngestionResponse:
        """Validate, resolve, and persist telemetry observations for a reporting node.

        Raises:
            AppException: If the node or specified sensor is not registered.
        """
        now = datetime.now(timezone.utc)
        observation_time = payload.timestamp or now

        # 1. Resolve IntegratedNode
        stmt = select(IntegratedNode).where(
            IntegratedNode.node_identifier == payload.node_identifier
        )
        res = await session.execute(stmt)
        node: Optional[IntegratedNode] = res.scalar_one_or_none()

        if not node:
            logger.warning(
                f"Ingestion rejected: Unregistered node '{payload.node_identifier}'"
            )
            raise AppException(
                code="NODE_NOT_FOUND",
                message=f"Node '{payload.node_identifier}' is not registered in the system.",
                status_code=404,
                details={"node_identifier": payload.node_identifier},
            )

        # 2. Update Node liveness and status
        node.last_seen_at = now
        node.status = "ACTIVE"

        # 3. Fetch all active sensors for this node
        sensor_stmt = select(Sensor).where(
            Sensor.node_id == node.id,
            Sensor.is_active.is_(True),
        )
        sensor_res = await session.execute(sensor_stmt)
        active_sensors: List[Sensor] = list(sensor_res.scalars().all())

        # Index active sensors by sensor_type and optional sensor_identifier
        # Key format: (sensor_type, sensor_identifier)
        sensor_map: Dict[tuple, Sensor] = {}
        sensor_map_by_id: Dict[int, Sensor] = {}  # id → Sensor, for Phase 5 enrichment
        for s in active_sensors:
            sensor_map[(s.sensor_type, s.sensor_identifier)] = s
            sensor_map_by_id[s.id] = s
            # Also allow fallback match by sensor_type alone if single instance
            if s.sensor_type not in sensor_map:
                sensor_map[s.sensor_type] = s

        # 4. Map readings to registered sensors
        readings_to_persist: List[SensorReading] = []
        matched_sensors: List[Sensor] = []  # Parallel list for Phase 5 event enrichment
        for item in payload.readings:
            matched_sensor: Optional[Sensor] = None

            if item.sensor_identifier:
                matched_sensor = sensor_map.get((item.sensor_type, item.sensor_identifier))

            if not matched_sensor:
                matched_sensor = sensor_map.get(item.sensor_type)

            if not matched_sensor:
                logger.warning(
                    f"Ingestion rejected: Sensor '{item.sensor_type}' not found on node '{payload.node_identifier}'"
                )
                raise AppException(
                    code="SENSOR_NOT_FOUND",
                    message=(
                        f"Sensor of type '{item.sensor_type}' is not registered or active "
                        f"on node '{payload.node_identifier}'."
                    ),
                    status_code=404,
                    details={
                        "node_identifier": payload.node_identifier,
                        "sensor_type": item.sensor_type,
                    },
                )

            # Construct immutable observation record
            reading = SensorReading(
                sensor_id=matched_sensor.id,
                node_id=node.id,
                timestamp=observation_time,
                value=item.value,
            )
            readings_to_persist.append(reading)
            matched_sensors.append(matched_sensor)

        # 5. Persist records atomically
        session.add_all(readings_to_persist)
        await session.commit()
        # Refresh to populate auto-generated IDs (needed for AI baseline exclusion)
        for r in readings_to_persist:
            await session.refresh(r)

        logger.info(
            f"Successfully ingested {len(readings_to_persist)} readings from node '{payload.node_identifier}'"
        )

        # 6. Publish live telemetry event AFTER successful commit (Phase 5).
        #    This is a best-effort delivery — broadcaster failures are isolated
        #    and must NEVER roll back the DB commit or return an error to the
        #    Mother System caller.
        try:
            enriched_readings = [
                SensorReadingResponse(
                    id=r.id,
                    sensor_id=r.sensor_id,
                    sensor_type=matched_sensors[i].sensor_type,
                    sensor_identifier=matched_sensors[i].sensor_identifier,
                    unit=matched_sensors[i].unit,
                    node_id=node.id,
                    node_identifier=payload.node_identifier,
                    timestamp=r.timestamp,
                    value=r.value,
                )
                for i, r in enumerate(readings_to_persist)
            ]
            live_event = LiveTelemetryEvent(
                node_identifier=payload.node_identifier,
                node_id=node.id,
                readings=enriched_readings,
                ingested_at=now,
            )
            await telemetry_broadcaster.publish(live_event)
        except Exception as broadcast_err:  # noqa: BLE001
            # Broadcast failure is non-fatal — telemetry is already safely persisted.
            logger.warning(
                f"Live broadcast failed for node '{payload.node_identifier}': {broadcast_err}"
            )

        # 7. Evaluate Risk & Alert Engine (Phase 6).
        #    Executed after DB persistence of the raw telemetry.
        #    Any rule evaluation or alert sync failure is isolated to guarantee
        #    that persistence is never compromised.
        try:
            risk_service = RiskService(session)
            risk_assessment = await risk_service.evaluate_node_risk(
                node, now=now, persist=True
            )
            await AlertService.sync_alerts_for_node(
                session,
                node,
                risk_assessment.contributing_factors,
                now=now,
                broadcast=True,
            )
            await session.commit()
        except Exception as risk_err:  # noqa: BLE001
            logger.warning(
                f"Risk & Alert evaluation failed for node '{payload.node_identifier}': {risk_err}"
            )

        # 8. Evaluate AI / Anomaly Detection (Phase 7).
        #    Executed after all previous steps have committed.
        #    AI failure MUST NEVER impact telemetry persistence, Phase 6 rules,
        #    or the response returned to the Mother System caller.
        try:
            ai_service = AIService(session)
            # Build (SensorReading, Sensor) tuples from ingested batch
            reading_sensor_pairs = list(zip(readings_to_persist, matched_sensors))
            await ai_service.evaluate_telemetry_batch(
                node=node,
                readings_with_sensors=reading_sensor_pairs,
                persist=True,
                broadcast=True,
            )
        except Exception as ai_err:  # noqa: BLE001
            logger.warning(
                f"AI anomaly evaluation failed (non-fatal) for node "
                f"'{payload.node_identifier}': {ai_err}"
            )

        return TelemetryIngestionResponse(
            status="success",
            node_identifier=payload.node_identifier,
            readings_persisted=len(readings_to_persist),
            ingested_at=now,
        )

