"""Tests for MineGuard Sensor Integration & Calibration Framework (Phase 27).

Validates:
- Validation rules (structural, temporal, physical invariants).
- Calibration engine (linear gain/offset, expiration, missing metadata).
- Fail-safe non-masking behavior (failures never replaced with zero).
- Simulation vs Real hardware status tagging.
- Multi-sensor acquisition pipeline and ingestion mapping.
"""

from datetime import datetime, timedelta, timezone
import pytest

from backend.app.sensor_framework.calibration import CalibrationEngine
from backend.app.sensor_framework.drivers.hardware_driver_stub import BlockedPhysicalHardwareDriver
from backend.app.sensor_framework.drivers.simulation_driver import SimulatedSensorDriver
from backend.app.sensor_framework.enums import (
    CalibrationState,
    HardwareStatus,
    ReadingQuality,
    SensorErrorCode,
    SensorHealthState,
)
from backend.app.sensor_framework.models import (
    CalibrationRecord,
    SensorConfiguration,
)
from backend.app.sensor_framework.pipeline import SensorAcquisitionPipeline
from backend.app.sensor_framework.validation import SensorValidator


# ============================================================================
# 1. VALIDATION TESTS
# ============================================================================

def test_validation_valid_readings():
    """Verify that physically normal readings pass validation."""
    now = datetime.now(timezone.utc)
    quality, err_code, msg = SensorValidator.validate_raw_measurement(
        sensor_type="displacement",
        raw_value=12.45,
        timestamp=now,
    )
    assert quality == ReadingQuality.VALID
    assert err_code == SensorErrorCode.NONE
    assert msg is None


def test_validation_rejects_nan_and_inf():
    """Verify that NaN and Inf are flagged as invalid."""
    now = datetime.now(timezone.utc)
    quality, err_code, _ = SensorValidator.validate_raw_measurement(
        sensor_type="vibration",
        raw_value=float("nan"),
        timestamp=now,
    )
    assert quality == ReadingQuality.INVALID
    assert err_code == SensorErrorCode.SENSOR_INVALID_DATA

    quality_inf, _, _ = SensorValidator.validate_raw_measurement(
        sensor_type="vibration",
        raw_value=float("inf"),
        timestamp=now,
    )
    assert quality_inf == ReadingQuality.INVALID


def test_validation_rejects_future_timestamps():
    """Verify that observations from the future are rejected."""
    now = datetime.now(timezone.utc)
    future_time = now + timedelta(minutes=5)
    quality, err_code, msg = SensorValidator.validate_raw_measurement(
        sensor_type="temperature",
        raw_value=24.0,
        timestamp=future_time,
        current_time=now,
    )
    assert quality == ReadingQuality.INVALID
    assert "future" in msg.lower()


def test_validation_physical_invariants():
    """Verify physical impossibility checks (O2 > 100%, negative Kelvin)."""
    now = datetime.now(timezone.utc)

    # O2 > 100% is physically impossible
    q1, err1, _ = SensorValidator.validate_raw_measurement("oxygen_o2", 105.0, now)
    assert q1 == ReadingQuality.OUT_OF_BOUNDS
    assert err1 == SensorErrorCode.SENSOR_INVALID_DATA

    # O2 < 0% is physically impossible
    q2, _, _ = SensorValidator.validate_raw_measurement("oxygen_o2", -2.0, now)
    assert q2 == ReadingQuality.OUT_OF_BOUNDS

    # Temp below absolute zero
    q3, _, _ = SensorValidator.validate_raw_measurement("temperature", -300.0, now)
    assert q3 == ReadingQuality.OUT_OF_BOUNDS

    # Negative pressure is impossible
    q4, _, _ = SensorValidator.validate_raw_measurement("pressure", -10.0, now)
    assert q4 == ReadingQuality.OUT_OF_BOUNDS


def test_validation_preserves_extreme_hazard_readings():
    """Anti-hallucination test: Do NOT discard extreme values for safety parameters!
    
    A severe ground displacement (e.g. 50mm) or dangerous methane level (e.g. 4.5%)
    must NOT be rejected as out-of-bounds, because it may represent an impending collapse.
    """
    now = datetime.now(timezone.utc)
    q_disp, _, _ = SensorValidator.validate_raw_measurement("displacement", 85.0, now)
    assert q_disp == ReadingQuality.VALID

    q_ch4, _, _ = SensorValidator.validate_raw_measurement("methane_ch4", 5.0, now)
    assert q_ch4 == ReadingQuality.VALID


# ============================================================================
# 2. CALIBRATION TESTS
# ============================================================================

def test_calibration_linear_correction():
    """Verify standard linear calibration: calibrated = (raw - offset) * gain."""
    now = datetime.now(timezone.utc)
    record = CalibrationRecord(
        record_id="CAL-DISP-001",
        sensor_id="disp_ch1",
        calibrated_at=now,
        calibration_source="LAB_BENCH",
        calibration_method="TWO_POINT",
        gain=1.05,
        offset=0.20,
    )

    # (10.20 - 0.20) * 1.05 = 10.0 * 1.05 = 10.50
    calibrated, state = CalibrationEngine.apply_calibration(10.20, record, current_time=now)
    assert state == CalibrationState.CALIBRATION_VALID
    assert pytest.approx(calibrated, 0.001) == 10.50


def test_calibration_zero_offset_routine():
    """Verify zero-offset creation and application."""
    record = CalibrationEngine.create_zero_offset_record(
        sensor_id="crack_gauge_01",
        current_zero_raw=1.52,
    )
    assert record.offset == 1.52
    assert record.gain == 1.0

    # Applying the record to the same raw value yields 0.0
    calibrated, state = CalibrationEngine.apply_calibration(1.52, record)
    assert state == CalibrationState.CALIBRATION_VALID
    assert pytest.approx(calibrated, 0.0001) == 0.0


def test_calibration_expiration():
    """Verify expired calibration is flagged."""
    past = datetime.now(timezone.utc) - timedelta(days=400)
    expired_time = past + timedelta(days=365)  # Expired 35 days ago
    record = CalibrationRecord(
        record_id="CAL-EXP-001",
        sensor_id="temp_01",
        calibrated_at=past,
        valid_until=expired_time,
        calibration_source="FACTORY",
        calibration_method="LINEAR",
        gain=1.0,
        offset=0.0,
    )

    now = datetime.now(timezone.utc)
    calibrated, state = CalibrationEngine.apply_calibration(25.0, record, current_time=now)
    assert state == CalibrationState.CALIBRATION_EXPIRED
    assert calibrated == 25.0  # Formula still applied, but status explicitly flagged


def test_calibration_missing_metadata():
    """Verify uncalibrated sensor returns CALIBRATION_NOT_AVAILABLE."""
    calibrated, state = CalibrationEngine.apply_calibration(18.5, None)
    assert state == CalibrationState.CALIBRATION_NOT_AVAILABLE
    assert calibrated == 18.5


# ============================================================================
# 3. DRIVER LIFECYCLE & FAIL-SAFE HANDLING TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_simulated_driver_acquisition():
    """Verify normal acquisition from a simulated driver."""
    config = SensorConfiguration(
        sensor_identifier="disp_axis_z",
        node_identifier="NODE-TEST-01",
        sensor_type="displacement",
        unit="mm",
        hardware_status=HardwareStatus.SIMULATED_HARDWARE,
    )
    driver = SimulatedSensorDriver(config, value_generator=lambda: 1.45)
    reading = await driver.read()

    assert reading.quality == ReadingQuality.VALID
    assert reading.engineering_value == 1.45
    assert reading.hardware_status == HardwareStatus.SIMULATED_HARDWARE
    assert reading.health_state == SensorHealthState.READY


@pytest.mark.asyncio
async def test_driver_failure_injection_does_not_mask_with_zero():
    """Critical fail-safe test: Acquisition failure must produce SENSOR_FAULT, NOT 0.0!"""
    config = SensorConfiguration(
        sensor_identifier="ch4_toxic",
        node_identifier="NODE-TEST-01",
        sensor_type="methane_ch4",
        unit="%",
        hardware_status=HardwareStatus.SIMULATED_HARDWARE,
    )
    driver = SimulatedSensorDriver(config, value_generator=lambda: 0.8)
    driver.inject_failure(TimeoutError("Hardware bus timed out after 500ms"))

    reading = await driver.read()
    assert reading.quality == ReadingQuality.SENSOR_FAULT
    assert reading.health_state == SensorHealthState.FAULT
    assert reading.engineering_value is None  # MUST NOT be 0.0!
    assert reading.error_code == SensorErrorCode.SENSOR_COMMUNICATION_ERROR
    assert "timed out" in reading.error_message


@pytest.mark.asyncio
async def test_blocked_physical_driver():
    """Verify blocked physical driver explicitly flags absence of verified hardware."""
    config = SensorConfiguration(
        sensor_identifier="vib_real_01",
        node_identifier="NODE-TEST-01",
        sensor_type="vibration",
        unit="mm/s",
        hardware_status=HardwareStatus.BLOCKED,
    )
    driver = BlockedPhysicalHardwareDriver(
        config,
        reason_blocked="No physical geophone transducer selected in BOM",
    )
    reading = await driver.read()

    assert reading.quality == ReadingQuality.SENSOR_FAULT
    assert reading.hardware_status == HardwareStatus.BLOCKED
    assert reading.error_code == SensorErrorCode.SENSOR_HARDWARE_ABSENT
    assert reading.engineering_value is None


# ============================================================================
# 4. PIPELINE & INGESTION CONTRACT MAPPING TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_pipeline_acquisition_and_ingestion_mapping():
    """Verify multi-sensor pipeline aggregates readings and maps valid items to TelemetryIngestionRequest."""
    pipeline = SensorAcquisitionPipeline(node_identifier="NODE-TEST-01")

    # Sensor 1: Healthy displacement
    c1 = SensorConfiguration(
        sensor_identifier="disp_1",
        node_identifier="NODE-TEST-01",
        sensor_type="displacement",
        unit="mm",
    )
    d1 = SimulatedSensorDriver(c1, value_generator=lambda: 2.10)
    pipeline.register_driver(d1)

    # Sensor 2: Faulted methane
    c2 = SensorConfiguration(
        sensor_identifier="ch4_1",
        node_identifier="NODE-TEST-01",
        sensor_type="methane_ch4",
        unit="%",
    )
    d2 = SimulatedSensorDriver(c2, value_generator=lambda: 0.5)
    d2.inject_failure(RuntimeError("I2C Bus Hung"))
    pipeline.register_driver(d2)

    # Acquire all
    readings = await pipeline.acquire_all()
    assert len(readings) == 2

    # Map to ingestion request
    request, faulted = SensorAcquisitionPipeline.map_to_ingestion_request(
        node_identifier="NODE-TEST-01",
        readings=readings,
    )

    # Ingestion request contains ONLY valid items (disp_1)
    assert request is not None
    assert request.node_identifier == "NODE-TEST-01"
    assert len(request.readings) == 1
    assert request.readings[0].sensor_type == "displacement"
    assert request.readings[0].value == 2.10

    # Faulted items isolated for diagnostic audit
    assert len(faulted) == 1
    assert faulted[0].sensor_identifier == "ch4_1"
    assert faulted[0].quality == ReadingQuality.SENSOR_FAULT
