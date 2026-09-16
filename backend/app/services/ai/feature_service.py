"""AI Feature Extraction Service.

Phase 7 Scope: Extracts sliding baseline windows and numerical features
from historical SensorReading time-series for anomaly detection evaluation.
"""

from typing import Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.sensor import Sensor
from backend.app.models.telemetry import SensorReading


class FeatureService:
    """Service for extracting time-series baselines for anomaly detectors."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_sensor_baseline(
        self,
        node_id: int,
        sensor_type: str,
        window_size: int = 30,
        exclude_reading_id: Optional[int] = None,
    ) -> List[float]:
        """Fetch the most recent N readings for a given sensor on a node.

        Returns values in chronological order (oldest to newest).
        """
        stmt = (
            select(SensorReading.value)
            .join(Sensor, SensorReading.sensor_id == Sensor.id)
            .where(
                SensorReading.node_id == node_id,
                Sensor.sensor_type == sensor_type,
            )
        )
        if exclude_reading_id is not None:
            stmt = stmt.where(SensorReading.id != exclude_reading_id)

        stmt = stmt.order_by(SensorReading.timestamp.desc()).limit(window_size)

        result = await self.session.execute(stmt)
        values = [float(v) for v in result.scalars().all()]
        values.reverse()  # chronological order
        return values

    async def get_all_sensor_baselines(
        self,
        node_id: int,
        window_size: int = 30,
    ) -> Dict[str, List[float]]:
        """Fetch sliding baseline values for all active sensors on a node."""
        stmt = select(Sensor.sensor_type).where(
            Sensor.node_id == node_id,
            Sensor.is_active.is_(True),
        )
        result = await self.session.execute(stmt)
        sensor_types = list(result.scalars().all())

        baselines: Dict[str, List[float]] = {}
        for stype in sensor_types:
            baselines[stype] = await self.get_sensor_baseline(
                node_id=node_id,
                sensor_type=stype,
                window_size=window_size,
            )

        return baselines
