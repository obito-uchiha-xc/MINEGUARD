"""Telemetry Processing Service.

Orchestrates the telemetry query pipeline:
  TelemetryRepository → enrichment → normalized response DTOs.

Phase 4 Scope: Historical queries, latest-per-sensor snapshots, window aggregates.
Does NOT compute risk scores, trigger alerts, or run AI models.

Phase 0 Reference: BE-REQ-004, BE-REQ-005, BE-REQ-006, BE-REQ-021
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.errors import AppException
from backend.app.core.logging import get_logger
from backend.app.repositories.telemetry import TelemetryRepository
from backend.app.schemas.telemetry import (
    LatestReadingsResponse,
    SensorReadingResponse,
    TelemetryHistoryResponse,
    WindowAggregateResponse,
)

logger = get_logger(__name__)


class TelemetryService:
    """Service layer for telemetry processing and historical-data retrieval."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = TelemetryRepository(session)

    # ------------------------------------------------------------------
    # Historical readings
    # ------------------------------------------------------------------

    async def get_history(
        self,
        node_identifier: str,
        sensor_type: Optional[str] = None,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
        limit: int = 500,
    ) -> TelemetryHistoryResponse:
        """Return paginated historical readings for a node.

        Args:
            node_identifier: External node identifier string.
            sensor_type:     Optional filter — only readings of this sensor type.
            from_dt:         Optional range start (inclusive, UTC).
            to_dt:           Optional range end (inclusive, UTC).
            limit:           Max readings to return (capped at 1000).

        Returns:
            TelemetryHistoryResponse with enriched readings.

        Raises:
            AppException: 404 if node not found.
        """
        node = await self._repo.get_node_by_identifier(node_identifier)
        if not node:
            raise AppException(
                code="NODE_NOT_FOUND",
                message=f"Node '{node_identifier}' is not registered in the system.",
                status_code=404,
                details={"node_identifier": node_identifier},
            )

        # Total count (for pagination metadata)
        total = await self._repo.count_readings_in_range(
            node_id=node.id,
            from_dt=from_dt,
            to_dt=to_dt,
            sensor_type=sensor_type,
        )

        # Fetch records
        pairs = await self._repo.get_readings_by_node(
            node_id=node.id,
            sensor_type=sensor_type,
            from_dt=from_dt,
            to_dt=to_dt,
            limit=limit,
        )

        readings = [
            _enrich_reading(reading, sensor, node.node_identifier)
            for reading, sensor in pairs
        ]

        logger.info(
            f"History query: node='{node_identifier}', sensor_type={sensor_type!r}, "
            f"returned={len(readings)}, total={total}"
        )

        return TelemetryHistoryResponse(
            node_identifier=node_identifier,
            sensor_type=sensor_type,
            from_dt=from_dt,
            to_dt=to_dt,
            total_count=total,
            returned_count=len(readings),
            limit=min(limit, 1000),
            readings=readings,
        )

    # ------------------------------------------------------------------
    # Latest-per-sensor snapshot
    # ------------------------------------------------------------------

    async def get_latest(self, node_identifier: str) -> LatestReadingsResponse:
        """Return the most-recent reading per active sensor for a node.

        Used for live-view dashboards and status snapshots.

        Args:
            node_identifier: External node identifier string.

        Returns:
            LatestReadingsResponse with one reading per active sensor.

        Raises:
            AppException: 404 if node not found.
        """
        node = await self._repo.get_node_by_identifier(node_identifier)
        if not node:
            raise AppException(
                code="NODE_NOT_FOUND",
                message=f"Node '{node_identifier}' is not registered in the system.",
                status_code=404,
                details={"node_identifier": node_identifier},
            )

        pairs = await self._repo.get_latest_reading_per_sensor(node_id=node.id)

        readings = [
            _enrich_reading(reading, sensor, node.node_identifier)
            for reading, sensor in pairs
        ]

        now = datetime.now(timezone.utc)
        logger.info(
            f"Latest snapshot: node='{node_identifier}', sensors={len(readings)}"
        )

        return LatestReadingsResponse(
            node_identifier=node_identifier,
            snapshot_at=now,
            sensor_count=len(readings),
            readings=readings,
        )

    # ------------------------------------------------------------------
    # Window aggregation
    # ------------------------------------------------------------------

    async def get_aggregate(
        self,
        node_identifier: str,
        sensor_type: str,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
    ) -> WindowAggregateResponse:
        """Return min/max/avg for a sensor type over an optional time window.

        Args:
            node_identifier: External node identifier string.
            sensor_type:     Sensor category to aggregate.
            from_dt:         Optional window start (inclusive, UTC).
            to_dt:           Optional window end (inclusive, UTC).

        Returns:
            WindowAggregateResponse with statistical summary.

        Raises:
            AppException: 404 if node not found or no data for this sensor_type.
        """
        node = await self._repo.get_node_by_identifier(node_identifier)
        if not node:
            raise AppException(
                code="NODE_NOT_FOUND",
                message=f"Node '{node_identifier}' is not registered in the system.",
                status_code=404,
                details={"node_identifier": node_identifier},
            )

        result = await self._repo.get_window_aggregate(
            node_id=node.id,
            sensor_type=sensor_type,
            from_dt=from_dt,
            to_dt=to_dt,
        )

        if result is None:
            raise AppException(
                code="NO_DATA_FOUND",
                message=(
                    f"No readings found for sensor type '{sensor_type}' "
                    f"on node '{node_identifier}' in the specified window."
                ),
                status_code=404,
                details={
                    "node_identifier": node_identifier,
                    "sensor_type": sensor_type,
                },
            )

        min_val, max_val, avg_val, count = result

        logger.info(
            f"Aggregate: node='{node_identifier}', sensor_type='{sensor_type}', "
            f"count={count}, min={min_val}, max={max_val}, avg={avg_val:.4f}"
        )

        return WindowAggregateResponse(
            node_identifier=node_identifier,
            sensor_type=sensor_type,
            from_dt=from_dt,
            to_dt=to_dt,
            reading_count=count,
            min_value=min_val,
            max_value=max_val,
            avg_value=round(avg_val, 6),
        )


# ------------------------------------------------------------------
# Private enrichment helper
# ------------------------------------------------------------------

def _enrich_reading(
    reading,
    sensor,
    node_identifier: str,
) -> SensorReadingResponse:
    """Map a (SensorReading, Sensor) pair into an enriched response DTO.

    Normalizes the timestamp to UTC and attaches sensor metadata (type,
    identifier, unit) so callers never need to perform additional queries.
    """
    ts = reading.timestamp
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    return SensorReadingResponse(
        id=reading.id,
        sensor_id=reading.sensor_id,
        sensor_type=sensor.sensor_type,
        sensor_identifier=sensor.sensor_identifier,
        unit=sensor.unit,
        node_id=reading.node_id,
        node_identifier=node_identifier,
        timestamp=ts,
        value=reading.value,
    )
