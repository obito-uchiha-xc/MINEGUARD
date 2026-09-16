"""Data Transfer Objects (DTOs) for Telemetry Ingestion.

Phase 3 Scope: Defines the normalized contract for telemetry received
from the Mother System gateway.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MeasurementItem(BaseModel):
    """Individual measurement reading for a specific sensor capability."""

    model_config = ConfigDict(extra="forbid")

    sensor_type: str = Field(
        ...,
        description=(
            "Sensor capability category: displacement, vibration, "
            "crack_detection, temperature, humidity, pressure, "
            "methane_ch4, carbon_monoxide_co, oxygen_o2, or custom gas."
        ),
        min_length=1,
        max_length=64,
    )
    value: float = Field(
        ...,
        description="Measured numerical sensor observation.",
    )
    sensor_identifier: Optional[str] = Field(
        None,
        description="Optional sub-sensor channel or hardware identifier.",
        max_length=64,
    )


class TelemetryIngestionRequest(BaseModel):
    """Normalized payload structure received from the Mother System."""

    model_config = ConfigDict(extra="forbid")

    node_identifier: str = Field(
        ...,
        description="Unique identifier of the reporting Integrated Node.",
        min_length=1,
        max_length=128,
    )
    timestamp: Optional[datetime] = Field(
        None,
        description=(
            "Observation timestamp in UTC. If omitted by the field gateway, "
            "backend server time will be applied."
        ),
    )
    readings: List[MeasurementItem] = Field(
        ...,
        description=(
            "List of sensor measurements collected in this telemetry frame. "
            "Bounded to a max of 500 items per batch to prevent memory exhaustion (D-037)."
        ),
        min_length=1,
        max_length=500,
    )


class TelemetryIngestionResponse(BaseModel):
    """Response returned upon successful validation and persistence."""

    status: str = Field(default="success")
    node_identifier: str
    readings_persisted: int
    ingested_at: datetime
