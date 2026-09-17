"""MineGuard Sensor Integration & Calibration Framework (Phase 27).

Provides modular, traceable abstractions for sensor acquisition, calibration,
validation, and telemetry formatting with strict simulation-vs-hardware isolation.
"""

from backend.app.sensor_framework.base_driver import BaseSensorDriver
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
from backend.app.sensor_framework.pipeline import SensorAcquisitionPipeline
from backend.app.sensor_framework.validation import SensorValidator

__all__ = [
    "BaseSensorDriver",
    "CalibrationEngine",
    "CalibrationRecord",
    "CalibrationState",
    "CanonicalSensorReading",
    "HardwareStatus",
    "ReadingQuality",
    "SensorAcquisitionPipeline",
    "SensorConfiguration",
    "SensorErrorCode",
    "SensorHealthState",
    "SensorValidator",
]
