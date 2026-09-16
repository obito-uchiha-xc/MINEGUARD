"""AI Anomaly Detection Service.

Phase 7 Scope: Orchestrates feature extraction, statistical model execution,
anomaly persistence, live anomaly WebSocket broadcasting, and historical querying.

🟢 SPEC: BE-REQ-015 — Anomaly detection across sensor streams.
🔵 DECISION D-029: Statistical unsupervised anomaly detection (rolling Z-score).
🔵 DECISION D-030: Decision threshold distinct from engineering safety limits.
🔵 DECISION D-031: AI anomaly persistence in dedicated table (ai_anomalies).
🔵 DECISION D-032: Strict assistive role — no override of Phase 6 deterministic rules.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.core.logging import get_logger
from backend.app.models.ai import AIAnomalyRecord
from backend.app.models.node import IntegratedNode
from backend.app.models.sensor import Sensor
from backend.app.models.telemetry import SensorReading
from backend.app.schemas.ai import (
    AIAnomalyRecordResponse,
    AnomalyEvaluationResult,
    ModelMetadataResponse,
)
from backend.app.schemas.live import LiveAnomalyEvent
from backend.app.services.ai.detector import (
    MultiVariateAnomalyDetector,
    StatisticalAnomalyDetector,
)
from backend.app.services.ai.feature_service import FeatureService
from backend.app.services.broadcaster import telemetry_broadcaster

logger = get_logger(__name__)
settings = get_settings()


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure a datetime object is timezone-aware in UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class AIService:
    """Service orchestrating AI / anomaly detection evaluation and queries."""

    def __init__(
        self,
        session: AsyncSession,
        feature_service: Optional[FeatureService] = None,
    ) -> None:
        self.session = session
        self.feature_service = feature_service or FeatureService(session)
        self.statistical_detector = StatisticalAnomalyDetector(
            threshold=settings.AI_ANOMALY_ZSCORE_THRESHOLD,
            min_samples=settings.AI_MIN_SAMPLES_FOR_INFERENCE,
        )
        self.multivariate_detector = MultiVariateAnomalyDetector(
            threshold=settings.AI_ANOMALY_ZSCORE_THRESHOLD,
            min_samples=settings.AI_MIN_SAMPLES_FOR_INFERENCE,
        )

    async def evaluate_telemetry_batch(
        self,
        node: IntegratedNode,
        readings_with_sensors: List[tuple[SensorReading, Sensor]],
        persist: bool = True,
        broadcast: bool = True,
    ) -> List[AIAnomalyRecord]:
        """Evaluate a newly ingested batch of sensor readings for anomalies.

        Executes:
          1. Univariate rolling Z-score anomaly evaluation per reading.
          2. Multivariate compound anomaly evaluation across the batch.
          3. Persists evaluations to ai_anomalies if persist=True.
          4. Emits LiveAnomalyEvent over WebSocket if broadcast=True and is_anomaly=True.
        """
        eval_records: List[AIAnomalyRecord] = []
        current_readings_map: Dict[str, float] = {}
        history_by_sensor: Dict[str, List[float]] = {}
        now = datetime.now(timezone.utc)

        # 1. Univariate evaluations
        for reading, sensor in readings_with_sensors:
            sensor_type = sensor.sensor_type
            current_val = float(reading.value)
            current_readings_map[sensor_type] = current_val

            # Fetch historical baseline excluding the current reading
            baseline_vals = await self.feature_service.get_sensor_baseline(
                node_id=node.id,
                sensor_type=sensor_type,
                window_size=settings.AI_BASELINE_WINDOW_SIZE,
                exclude_reading_id=reading.id,
            )
            history_by_sensor[sensor_type] = baseline_vals

            obs_time = _ensure_utc(reading.timestamp) or now
            eval_res = self.statistical_detector.evaluate(
                node_id=node.id,
                sensor_type=sensor_type,
                current_value=current_val,
                history_values=baseline_vals,
                timestamp=obs_time,
            )

            record = AIAnomalyRecord(
                node_id=node.id,
                sensor_type=sensor_type,
                is_anomaly=eval_res.is_anomaly,
                anomaly_score=eval_res.anomaly_score,
                threshold=eval_res.threshold,
                model_name=eval_res.model_name,
                model_version=eval_res.model_version,
                features=eval_res.features,
                explanation=eval_res.explanation,
                detected_at=eval_res.detected_at,
            )
            eval_records.append(record)

            if broadcast and eval_res.is_anomaly:
                await self._broadcast_anomaly(node, eval_res)

        # 2. Multivariate compound evaluation
        mv_res = self.multivariate_detector.evaluate_cluster(
            node_id=node.id,
            current_readings=current_readings_map,
            history_by_sensor=history_by_sensor,
            timestamp=now,
        )
        if mv_res is not None:
            mv_record = AIAnomalyRecord(
                node_id=node.id,
                sensor_type=mv_res.sensor_type,
                is_anomaly=mv_res.is_anomaly,
                anomaly_score=mv_res.anomaly_score,
                threshold=mv_res.threshold,
                model_name=mv_res.model_name,
                model_version=mv_res.model_version,
                features=mv_res.features,
                explanation=mv_res.explanation,
                detected_at=mv_res.detected_at,
            )
            eval_records.append(mv_record)

            if broadcast and mv_res.is_anomaly:
                await self._broadcast_anomaly(node, mv_res)

        # 3. Persistence
        if persist and eval_records:
            self.session.add_all(eval_records)
            await self.session.commit()
            for r in eval_records:
                await self.session.refresh(r)

        return eval_records

    async def _broadcast_anomaly(
        self,
        node: IntegratedNode,
        eval_res: AnomalyEvaluationResult,
    ) -> None:
        """Helper to broadcast an anomaly over live WebSocket."""
        try:
            event = LiveAnomalyEvent(
                node_identifier=node.node_identifier,
                node_id=node.id,
                sensor_type=eval_res.sensor_type,
                is_anomaly=eval_res.is_anomaly,
                anomaly_score=eval_res.anomaly_score,
                threshold=eval_res.threshold,
                model_name=eval_res.model_name,
                model_version=eval_res.model_version,
                explanation=eval_res.explanation,
                detected_at=eval_res.detected_at,
            )
            await telemetry_broadcaster.publish(event)
        except Exception as exc:
            logger.warning(
                f"Failed to broadcast live anomaly event for node={node.node_identifier}: {exc}"
            )

    async def get_latest_anomalies_for_node(
        self,
        node_id: int,
        limit: int = 10,
    ) -> List[AIAnomalyRecord]:
        """Fetch the most recent anomaly evaluation records for a node."""
        stmt = (
            select(AIAnomalyRecord)
            .where(AIAnomalyRecord.node_id == node_id)
            .order_by(AIAnomalyRecord.detected_at.desc())
            .limit(min(limit, 100))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_anomaly_history(
        self,
        node_id: int,
        sensor_type: Optional[str] = None,
        is_anomaly: Optional[bool] = None,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[AIAnomalyRecord]:
        """Query historical anomaly records with filtering."""
        stmt = (
            select(AIAnomalyRecord)
            .where(AIAnomalyRecord.node_id == node_id)
            .order_by(AIAnomalyRecord.detected_at.desc())
            .limit(min(limit, 500))
        )
        if sensor_type is not None:
            stmt = stmt.where(AIAnomalyRecord.sensor_type == sensor_type)
        if is_anomaly is not None:
            stmt = stmt.where(AIAnomalyRecord.is_anomaly == is_anomaly)
        if from_dt is not None:
            stmt = stmt.where(AIAnomalyRecord.detected_at >= from_dt)
        if to_dt is not None:
            stmt = stmt.where(AIAnomalyRecord.detected_at <= to_dt)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    def get_models_metadata(self) -> List[ModelMetadataResponse]:
        """Return explainable metadata for all active prototype anomaly models."""
        return [
            ModelMetadataResponse(
                model_name=self.statistical_detector.model_name,
                model_version=self.statistical_detector.model_version,
                algorithm="Rolling Baseline Univariate Z-Score with Variance Floor",
                parameters={
                    "threshold_sigma": self.statistical_detector.threshold,
                    "min_samples": self.statistical_detector.min_samples,
                    "variance_floor": self.statistical_detector.variance_floor,
                    "baseline_window_size": settings.AI_BASELINE_WINDOW_SIZE,
                },
                description=(
                    "Computes normalized deviation of real-time sensor observations against "
                    "a rolling baseline window of recent historical readings."
                ),
            ),
            ModelMetadataResponse(
                model_name=self.multivariate_detector.model_name,
                model_version=self.multivariate_detector.model_version,
                algorithm="Normalized Euclidean Root-Mean-Square Cross-Sensor Deviation",
                parameters={
                    "threshold_compound": self.multivariate_detector.threshold,
                    "min_samples": self.multivariate_detector.min_samples,
                    "variance_floor": self.multivariate_detector.variance_floor,
                    "baseline_window_size": settings.AI_BASELINE_WINDOW_SIZE,
                },
                description=(
                    "Evaluates compound cross-sensor departures across multiple telemetry "
                    "streams on the same integrated node, identifying primary contributors."
                ),
            ),
        ]
