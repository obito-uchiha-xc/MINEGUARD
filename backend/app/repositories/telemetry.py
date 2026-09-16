"""Telemetry Repository.

Encapsulates all time-series database access for SensorReading records.
Phase 4 Scope: Historical queries, latest-per-sensor snapshot, window aggregation.
Does NOT compute risk, generate alerts, or run AI models.

Phase 0 Reference: BE-REQ-004, BE-REQ-005, BE-REQ-006, BE-REQ-021
"""

from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.node import IntegratedNode
from backend.app.models.sensor import Sensor
from backend.app.models.telemetry import SensorReading


class TelemetryRepository:
    """Data-access layer for SensorReading time-series storage.

    All methods are async and accept an injected AsyncSession.
    All queries use indexed columns (node_id, sensor_id, timestamp) from Phase 2.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ------------------------------------------------------------------
    # Node resolution helpers
    # ------------------------------------------------------------------

    async def get_node_by_identifier(
        self, node_identifier: str
    ) -> Optional[IntegratedNode]:
        """Return the IntegratedNode for a given external identifier, or None."""
        stmt = select(IntegratedNode).where(
            IntegratedNode.node_identifier == node_identifier
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    # ------------------------------------------------------------------
    # Historical time-series queries
    # ------------------------------------------------------------------

    async def get_readings_by_node(
        self,
        node_id: int,
        sensor_type: Optional[str] = None,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
        limit: int = 500,
    ) -> List[Tuple[SensorReading, Sensor]]:
        """Return (SensorReading, Sensor) tuples for a node within an optional time window.

        Args:
            node_id:     Internal node primary key.
            sensor_type: If provided, restrict to readings of this sensor type.
            from_dt:     Start of time window (inclusive). UTC expected.
            to_dt:       End of time window (inclusive). UTC expected.
            limit:       Maximum number of records to return (default 500, max 1000).

        Returns:
            List of (SensorReading, Sensor) tuples ordered by timestamp ascending.
        """
        limit = min(limit, 1000)  # Enforce hard cap

        stmt = (
            select(SensorReading, Sensor)
            .join(Sensor, SensorReading.sensor_id == Sensor.id)
            .where(SensorReading.node_id == node_id)
            .order_by(SensorReading.timestamp.asc())
            .limit(limit)
        )

        if sensor_type:
            stmt = stmt.where(Sensor.sensor_type == sensor_type)
        if from_dt:
            stmt = stmt.where(SensorReading.timestamp >= from_dt)
        if to_dt:
            stmt = stmt.where(SensorReading.timestamp <= to_dt)

        result = await self._session.execute(stmt)
        return list(result.tuples().all())

    async def get_readings_by_sensor(
        self,
        sensor_id: int,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
        limit: int = 500,
    ) -> List[SensorReading]:
        """Return SensorReading records for a specific sensor id within an optional window.

        Args:
            sensor_id: Internal sensor primary key.
            from_dt:   Start of time window (inclusive).
            to_dt:     End of time window (inclusive).
            limit:     Maximum records returned.

        Returns:
            List of SensorReading ordered by timestamp ascending.
        """
        limit = min(limit, 1000)

        stmt = (
            select(SensorReading)
            .where(SensorReading.sensor_id == sensor_id)
            .order_by(SensorReading.timestamp.asc())
            .limit(limit)
        )

        if from_dt:
            stmt = stmt.where(SensorReading.timestamp >= from_dt)
        if to_dt:
            stmt = stmt.where(SensorReading.timestamp <= to_dt)

        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def count_readings_in_range(
        self,
        node_id: int,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
        sensor_type: Optional[str] = None,
    ) -> int:
        """Return total count of readings for a node within an optional time window.

        Used for pagination metadata. Joins sensors to allow sensor_type filter.
        """
        stmt = (
            select(func.count(SensorReading.id))
            .join(Sensor, SensorReading.sensor_id == Sensor.id)
            .where(SensorReading.node_id == node_id)
        )

        if sensor_type:
            stmt = stmt.where(Sensor.sensor_type == sensor_type)
        if from_dt:
            stmt = stmt.where(SensorReading.timestamp >= from_dt)
        if to_dt:
            stmt = stmt.where(SensorReading.timestamp <= to_dt)

        result = await self._session.execute(stmt)
        return result.scalar_one() or 0

    # ------------------------------------------------------------------
    # Latest-per-sensor snapshot query
    # ------------------------------------------------------------------

    async def get_latest_reading_per_sensor(
        self, node_id: int
    ) -> List[Tuple[SensorReading, Sensor]]:
        """Return the most-recent SensorReading for each active sensor on a node.

        Implements a correlated subquery pattern to efficiently retrieve
        the latest timestamp per sensor without loading full history.

        Returns:
            List of (SensorReading, Sensor) tuples — one entry per active sensor.
        """
        # Subquery: max timestamp per sensor for this node
        latest_ts_subq = (
            select(
                SensorReading.sensor_id,
                func.max(SensorReading.timestamp).label("max_ts"),
            )
            .where(SensorReading.node_id == node_id)
            .group_by(SensorReading.sensor_id)
            .subquery()
        )

        stmt = (
            select(SensorReading, Sensor)
            .join(Sensor, SensorReading.sensor_id == Sensor.id)
            .join(
                latest_ts_subq,
                (SensorReading.sensor_id == latest_ts_subq.c.sensor_id)
                & (SensorReading.timestamp == latest_ts_subq.c.max_ts),
            )
            .where(SensorReading.node_id == node_id)
            .where(Sensor.is_active.is_(True))
            .order_by(Sensor.sensor_type.asc())
        )

        result = await self._session.execute(stmt)
        return list(result.tuples().all())

    # ------------------------------------------------------------------
    # Window aggregation query
    # ------------------------------------------------------------------

    async def get_window_aggregate(
        self,
        node_id: int,
        sensor_type: str,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
    ) -> Optional[Tuple[float, float, float, int]]:
        """Compute min/max/avg/count for a sensor type over a time window.

        Args:
            node_id:     Internal node id.
            sensor_type: The sensor category to aggregate.
            from_dt:     Start of window (inclusive).
            to_dt:       End of window (inclusive).

        Returns:
            Tuple of (min_value, max_value, avg_value, count) or None if no data.
        """
        stmt = (
            select(
                func.min(SensorReading.value).label("min_val"),
                func.max(SensorReading.value).label("max_val"),
                func.avg(SensorReading.value).label("avg_val"),
                func.count(SensorReading.id).label("cnt"),
            )
            .join(Sensor, SensorReading.sensor_id == Sensor.id)
            .where(SensorReading.node_id == node_id)
            .where(Sensor.sensor_type == sensor_type)
        )

        if from_dt:
            stmt = stmt.where(SensorReading.timestamp >= from_dt)
        if to_dt:
            stmt = stmt.where(SensorReading.timestamp <= to_dt)

        result = await self._session.execute(stmt)
        row = result.one_or_none()

        if row is None or row.cnt == 0:
            return None

        return (
            float(row.min_val),
            float(row.max_val),
            float(row.avg_val),
            int(row.cnt),
        )
