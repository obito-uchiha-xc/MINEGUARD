"""Canonical Sensor Data Models & Calibration Contracts.

Phase 27 Reference: Defines structured data representations for sensor observations,
auditable calibration records, and sensor configurations.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field

from backend.app.sensor_framework.enums import (
    CalibrationState,
    HardwareStatus,
    ReadingQuality,
    SensorErrorCode,
    SensorHealthState,
)


class CalibrationRecord(BaseModel):
    """Immutable, auditable calibration metadata record for a specific sensor."""

    model_config = ConfigDict(from_attributes=True)

    record_id: str = Field(..., description="Unique calibration certificate or audit ID")
    sensor_id: str = Field(..., description="Identifier of the physical or simulated sensor")
    calibrated_at: datetime = Field(..., description="UTC timestamp of calibration")
    valid_until: Optional[datetime] = Field(None, description="UTC expiration of calibration validity")
    calibration_source: str = Field(..., description="Laboratory, manufacturer, or automated zero-routine")
    calibration_method: str = Field(..., description="Linear (gain/offset), 2-point, or direct zero")
    operator_id: Optional[str] = Field(None, description="Technician or operator identity")
    reference_instrument: Optional[str] = Field(None, description="Traceable reference standard used")
    reference_value: Optional[float] = Field(None, description="Known physical reference value applied")
    measured_raw: Optional[float] = Field(None, description="Raw transducer output observed at reference")
    gain: float = Field(default=1.0, description="Linear calibration multiplier (default: 1.0)")
    offset: float = Field(default=0.0, description="Additive zero-offset correction (default: 0.0)")
    is_active: bool = Field(default=True, description="Whether this record is currently enforced")


class SensorConfiguration(BaseModel):
    """Configuration profile for an individual sensor channel on a node."""

    model_config = ConfigDict(from_attributes=True)

    sensor_identifier: str = Field(..., description="Unique sensor channel identifier on the node")
    node_identifier: str = Field(..., description="Parent Integrated Node identifier")
    sensor_type: str = Field(..., description="Modality: displacement, vibration, crack_detection, etc.")
    unit: str = Field(..., description="Canonical engineering unit (e.g., mm, mm/s, %, ppm, hPa)")
    hardware_status: HardwareStatus = Field(
        default=HardwareStatus.BLOCKED,
        description="Physical reality status (REAL_HARDWARE, SIMULATED, BLOCKED, etc.)",
    )
    is_enabled: bool = Field(default=True, description="Whether data acquisition is enabled")
    sampling_interval_ms: Optional[int] = Field(
        default=None,
        description="Sampling interval in milliseconds (marked TBD if unspecified)",
    )
    calibration_record: Optional[CalibrationRecord] = Field(
        default=None,
        description="Associated active calibration record if available",
    )


class CanonicalSensorReading(BaseModel):
    """Canonical sensor reading representing a validated observation lifecycle."""

    model_config = ConfigDict(from_attributes=True)

    sensor_identifier: str = Field(..., description="Unique sensor channel identifier")
    node_identifier: str = Field(..., description="Parent node identifier")
    sensor_type: str = Field(..., description="Sensor modality category")
    raw_value: Optional[float] = Field(None, description="Raw uncalibrated observation from transducer")
    engineering_value: Optional[float] = Field(
        None,
        description="Calibrated, validated engineering value in canonical units. None if faulted.",
    )
    unit: str = Field(..., description="Canonical measurement unit")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Observation timestamp in UTC",
    )
    sequence_number: int = Field(default=0, description="Monotonically increasing sequence number")
    quality: ReadingQuality = Field(default=ReadingQuality.VALID, description="Data quality classification")
    health_state: SensorHealthState = Field(
        default=SensorHealthState.READY,
        description="Operational health of the reporting sensor",
    )
    calibration_state: CalibrationState = Field(
        default=CalibrationState.CALIBRATION_NOT_AVAILABLE,
        description="State of sensor calibration at time of observation",
    )
    hardware_status: HardwareStatus = Field(
        default=HardwareStatus.SIMULATED_HARDWARE,
        description="Reality tag: REAL_HARDWARE, SIMULATED_HARDWARE, MOCK_SENSOR, etc.",
    )
    error_code: SensorErrorCode = Field(
        default=SensorErrorCode.NONE,
        description="Specific error code if observation failed",
    )
    error_message: Optional[str] = Field(None, description="Human-readable diagnostics on failure")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic and traceability metadata")
