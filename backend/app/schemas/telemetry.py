"""Telemetry Query & Response Schemas (DTOs).

Phase 4 Scope: Defines the normalized response contracts for historical
telemetry queries, latest-per-sensor snapshots, and window aggregates.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SensorReadingResponse(BaseModel):
    """Enriched single sensor reading — joins SensorReading + Sensor metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique reading primary key.")
    sensor_id: int = Field(..., description="Internal sensor primary key.")
    sensor_type: str = Field(..., description="Sensor capability category.")
    sensor_identifier: Optional[str] = Field(
        None, description="Optional sub-sensor / channel identifier."
    )
    unit: Optional[str] = Field(None, description="Physical unit of measurement (TBD per Phase 0).")
    node_id: int = Field(..., description="Internal node primary key.")
    node_identifier: str = Field(..., description="External node identifier string.")
    timestamp: datetime = Field(..., description="Observation timestamp in UTC.")
    value: float = Field(..., description="Measured numerical sensor observation.")


class TelemetryHistoryResponse(BaseModel):
    """Paginated historical readings response for a node."""

    model_config = ConfigDict(from_attributes=True)

    node_identifier: str = Field(..., description="Reporting node external identifier.")
    sensor_type: Optional[str] = Field(
        None, description="Sensor type filter applied, if any."
    )
    from_dt: Optional[datetime] = Field(None, description="Query window start, if applied.")
    to_dt: Optional[datetime] = Field(None, description="Query window end, if applied.")
    total_count: int = Field(
        ..., description="Total matching records in the database (before limit)."
    )
    returned_count: int = Field(..., description="Records returned in this response.")
    limit: int = Field(..., description="Limit applied to this query.")
    readings: List[SensorReadingResponse] = Field(
        ..., description="Ordered list of enriched sensor readings (asc timestamp)."
    )


class LatestReadingsResponse(BaseModel):
    """Latest-per-sensor snapshot for a node — one reading per active sensor."""

    model_config = ConfigDict(from_attributes=True)

    node_identifier: str = Field(..., description="Reporting node external identifier.")
    snapshot_at: datetime = Field(
        ..., description="Timestamp when this snapshot was generated (server UTC)."
    )
    sensor_count: int = Field(..., description="Number of active sensors with readings.")
    readings: List[SensorReadingResponse] = Field(
        ..., description="Most-recent reading per active sensor."
    )


class WindowAggregateResponse(BaseModel):
    """Min/max/avg aggregation for a sensor type over a time window."""

    model_config = ConfigDict(from_attributes=True)

    node_identifier: str = Field(..., description="Reporting node external identifier.")
    sensor_type: str = Field(..., description="Sensor type that was aggregated.")
    from_dt: Optional[datetime] = Field(None, description="Aggregation window start.")
    to_dt: Optional[datetime] = Field(None, description="Aggregation window end.")
    reading_count: int = Field(..., description="Total readings included in the aggregate.")
    min_value: float = Field(..., description="Minimum observed value in window.")
    max_value: float = Field(..., description="Maximum observed value in window.")
    avg_value: float = Field(..., description="Mean observed value in window.")
