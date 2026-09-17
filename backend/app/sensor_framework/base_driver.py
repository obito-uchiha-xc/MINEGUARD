"""Base Sensor Driver Abstraction.

Phase 27 Reference: Defines the standard abstraction layer for sensor interfaces.
Strict Anti-Hallucination Policy:
- Drivers declare their true HardwareStatus (REAL_HARDWARE, SIMULATED_HARDWARE, BLOCKED, etc.).
- When hardware is absent, drivers explicitly report BLOCKED / SENSOR_HARDWARE_ABSENT.
- Never mask failures or simulate real hardware invisibly.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from backend.app.sensor_framework.calibration import CalibrationEngine
from backend.app.sensor_framework.enums import (
    CalibrationState,
    HardwareStatus,
    ReadingQuality,
    SensorErrorCode,
    SensorHealthState,
)
from backend.app.sensor_framework.models import (
    CalibrationRecord,
    CanonicalSensorReading,
    SensorConfiguration,
)
from backend.app.sensor_framework.validation import SensorValidator


class BaseSensorDriver(ABC):
    """Abstract base class for all MineGuard sensor drivers."""

    def __init__(self, config: SensorConfiguration):
        self.config = config
        self.sensor_identifier = config.sensor_identifier
        self.node_identifier = config.node_identifier
        self.sensor_type = config.sensor_type
        self.unit = config.unit
        self.hardware_status = config.hardware_status
        self.health_state = SensorHealthState.NOT_INITIALIZED
        self.calibration_record: Optional[CalibrationRecord] = config.calibration_record
        self.sequence_counter = 0

    @abstractmethod
    async def initialize(self) -> SensorHealthState:
        """Initialize transducer hardware/bus interface."""
        pass

    @abstractmethod
    async def acquire_raw(self) -> float:
        """Acquire raw physical or simulated transducer observation.

        Raises:
            Exception: On hardware read timeout, disconnection, or bus error.
        """
        pass

    async def read(self, current_time: Optional[datetime] = None) -> CanonicalSensorReading:
        """Execute canonical acquisition pipeline: Acquire -> Validate -> Calibrate -> Package."""
        now = current_time or datetime.now(timezone.utc)
        self.sequence_counter += 1

        # Check if driver is blocked / uninitialized
        if self.hardware_status == HardwareStatus.BLOCKED:
            return CanonicalSensorReading(
                sensor_identifier=self.sensor_identifier,
                node_identifier=self.node_identifier,
                sensor_type=self.sensor_type,
                raw_value=None,
                engineering_value=None,
                unit=self.unit,
                timestamp=now,
                sequence_number=self.sequence_counter,
                quality=ReadingQuality.SENSOR_FAULT,
                health_state=SensorHealthState.FAULT,
                calibration_state=CalibrationState.CALIBRATION_NOT_AVAILABLE,
                hardware_status=self.hardware_status,
                error_code=SensorErrorCode.SENSOR_HARDWARE_ABSENT,
                error_message="Physical sensor hardware is not verified or connected (BLOCKED awaiting Phase 28 bench verification)",
            )

        if self.health_state == SensorHealthState.NOT_INITIALIZED:
            await self.initialize()

        # Step 1: Acquire raw measurement
        try:
            raw_val = await self.acquire_raw()
        except Exception as exc:
            self.health_state = SensorHealthState.FAULT
            return CanonicalSensorReading(
                sensor_identifier=self.sensor_identifier,
                node_identifier=self.node_identifier,
                sensor_type=self.sensor_type,
                raw_value=None,
                engineering_value=None,
                unit=self.unit,
                timestamp=now,
                sequence_number=self.sequence_counter,
                quality=ReadingQuality.SENSOR_FAULT,
                health_state=SensorHealthState.FAULT,
                calibration_state=CalibrationState.CALIBRATION_NOT_AVAILABLE,
                hardware_status=self.hardware_status,
                error_code=SensorErrorCode.SENSOR_COMMUNICATION_ERROR,
                error_message=f"Acquisition error: {str(exc)}",
            )

        # Step 2: Validate raw measurement
        quality, err_code, err_msg = SensorValidator.validate_raw_measurement(
            sensor_type=self.sensor_type,
            raw_value=raw_val,
            timestamp=now,
            current_time=now,
        )

        if quality != ReadingQuality.VALID:
            return CanonicalSensorReading(
                sensor_identifier=self.sensor_identifier,
                node_identifier=self.node_identifier,
                sensor_type=self.sensor_type,
                raw_value=raw_val,
                engineering_value=None,  # Do not publish invalid engineering value
                unit=self.unit,
                timestamp=now,
                sequence_number=self.sequence_counter,
                quality=quality,
                health_state=SensorHealthState.DEGRADED,
                calibration_state=CalibrationState.CALIBRATION_NOT_AVAILABLE,
                hardware_status=self.hardware_status,
                error_code=err_code,
                error_message=err_msg,
            )

        # Step 3: Calibrate raw value to engineering value
        eng_val, cal_state = CalibrationEngine.apply_calibration(
            raw_value=raw_val,
            record=self.calibration_record,
            current_time=now,
        )

        # Step 4: Determine final health state
        if cal_state == CalibrationState.CALIBRATION_EXPIRED:
            self.health_state = SensorHealthState.CALIBRATION_REQUIRED
        else:
            self.health_state = SensorHealthState.READY

        return CanonicalSensorReading(
            sensor_identifier=self.sensor_identifier,
            node_identifier=self.node_identifier,
            sensor_type=self.sensor_type,
            raw_value=raw_val,
            engineering_value=eng_val,
            unit=self.unit,
            timestamp=now,
            sequence_number=self.sequence_counter,
            quality=ReadingQuality.VALID,
            health_state=self.health_state,
            calibration_state=cal_state,
            hardware_status=self.hardware_status,
            error_code=SensorErrorCode.NONE,
        )
