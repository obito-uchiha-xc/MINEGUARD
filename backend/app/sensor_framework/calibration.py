"""Traceable Sensor Calibration Engine.

Phase 27 Reference: Implements deterministic, traceable calibration transformations.
Strict Anti-Hallucination Policy:
- Only verified linear equations (calibrated = (raw - offset) * gain) are supported.
- Expiration timestamps are rigorously enforced.
- Missing calibration is explicitly tagged CALIBRATION_NOT_AVAILABLE, never silently fabricated.
"""

from datetime import datetime, timezone
from typing import Optional, Tuple

from backend.app.sensor_framework.enums import CalibrationState
from backend.app.sensor_framework.models import CalibrationRecord


class CalibrationEngine:
    """Deterministic calibration transformation processor."""

    @staticmethod
    def apply_calibration(
        raw_value: float,
        record: Optional[CalibrationRecord],
        current_time: Optional[datetime] = None,
    ) -> Tuple[float, CalibrationState]:
        """Apply active calibration record to a raw sensor observation.

        Returns:
            Tuple of (calibrated_value, calibration_state)
        """
        if record is None or not record.is_active:
            return raw_value, CalibrationState.CALIBRATION_NOT_AVAILABLE

        now = current_time or datetime.now(timezone.utc)

        # Check expiration
        if record.valid_until is not None and now > record.valid_until:
            calibrated = (raw_value - record.offset) * record.gain
            return calibrated, CalibrationState.CALIBRATION_EXPIRED

        # Deterministic linear transformation: calibrated = (raw - offset) * gain
        calibrated = (raw_value - record.offset) * record.gain
        return calibrated, CalibrationState.CALIBRATION_VALID

    @staticmethod
    def create_zero_offset_record(
        sensor_id: str,
        current_zero_raw: float,
        operator_id: Optional[str] = None,
        record_id: Optional[str] = None,
    ) -> CalibrationRecord:
        """Create a zero-offset calibration record where current raw reading is defined as 0.0."""
        now = datetime.now(timezone.utc)
        rec_id = record_id or f"CAL-ZERO-{sensor_id}-{int(now.timestamp())}"
        return CalibrationRecord(
            record_id=rec_id,
            sensor_id=sensor_id,
            calibrated_at=now,
            calibration_source="ZERO_POINT_ROUTINE",
            calibration_method="DIRECT_ZERO_OFFSET",
            operator_id=operator_id or "SYSTEM_OPERATOR",
            reference_value=0.0,
            measured_raw=current_zero_raw,
            gain=1.0,
            offset=current_zero_raw,
            is_active=True,
        )
