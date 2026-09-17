"""Sensor Framework Enumerations and Classifications.

Phase 27 Reference: Defines explicit, non-overlapping labels for hardware reality,
reading quality, sensor health, calibration states, and error codes.
Strict Anti-Hallucination Policy: Never conflate simulated readings with real hardware.
"""

from enum import Enum


class HardwareStatus(str, Enum):
    """Hardware reality classification.
    
    Strictly distinguishes physical field hardware from test fixtures and simulations.
    """
    REAL_HARDWARE = "REAL_HARDWARE"
    VERIFIED_HARDWARE = "VERIFIED_HARDWARE"
    SIMULATED_HARDWARE = "SIMULATED_HARDWARE"
    MOCK_SENSOR = "MOCK_SENSOR"
    TEST_FIXTURE = "TEST_FIXTURE"
    PLACEHOLDER = "PLACEHOLDER"
    TBD = "TBD"
    BLOCKED = "BLOCKED"


class ReadingQuality(str, Enum):
    """Quality and integrity classification for an individual sensor reading."""
    VALID = "VALID"
    INVALID = "INVALID"
    MISSING = "MISSING"
    STALE = "STALE"
    SENSOR_FAULT = "SENSOR_FAULT"
    CALIBRATION_REQUIRED = "CALIBRATION_REQUIRED"
    COMMUNICATION_ERROR = "COMMUNICATION_ERROR"
    OUT_OF_BOUNDS = "OUT_OF_BOUNDS"
    UNVERIFIED = "UNVERIFIED"


class SensorHealthState(str, Enum):
    """Observable operational lifecycle health state of a physical or simulated sensor."""
    NOT_INITIALIZED = "NOT_INITIALIZED"
    INITIALIZING = "INITIALIZING"
    READY = "READY"
    DEGRADED = "DEGRADED"
    FAULT = "FAULT"
    DISCONNECTED = "DISCONNECTED"
    CALIBRATION_REQUIRED = "CALIBRATION_REQUIRED"


class CalibrationState(str, Enum):
    """Traceable calibration status for a specific sensor entity."""
    CALIBRATION_VALID = "CALIBRATION_VALID"
    CALIBRATION_REQUIRED = "CALIBRATION_REQUIRED"
    CALIBRATION_EXPIRED = "CALIBRATION_EXPIRED"
    CALIBRATION_FAILED = "CALIBRATION_FAILED"
    CALIBRATION_NOT_AVAILABLE = "CALIBRATION_NOT_AVAILABLE"


class SensorErrorCode(str, Enum):
    """Standardized error taxonomy for sensor acquisition and interface failures."""
    NONE = "NONE"
    SENSOR_INIT_FAILED = "SENSOR_INIT_FAILED"
    SENSOR_TIMEOUT = "SENSOR_TIMEOUT"
    SENSOR_COMMUNICATION_ERROR = "SENSOR_COMMUNICATION_ERROR"
    SENSOR_INVALID_DATA = "SENSOR_INVALID_DATA"
    SENSOR_CALIBRATION_REQUIRED = "SENSOR_CALIBRATION_REQUIRED"
    SENSOR_CALIBRATION_INVALID = "SENSOR_CALIBRATION_INVALID"
    SENSOR_DISCONNECTED = "SENSOR_DISCONNECTED"
    SENSOR_UNSUPPORTED = "SENSOR_UNSUPPORTED"
    SENSOR_HARDWARE_ABSENT = "SENSOR_HARDWARE_ABSENT"
    ELECTRICAL_FAULT = "ELECTRICAL_FAULT"
