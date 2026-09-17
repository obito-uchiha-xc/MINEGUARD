"""Sensor Data Validation Engine.

Phase 27 Reference: Enforces structural, temporal, and verified physical plausibility.
Strict Anti-Hallucination Policy:
- Never silently discard or clip extreme values; genuine mine hazards produce extreme telemetry.
- Plausibility limits are applied ONLY where fundamental physical laws dictate (e.g. O2 > 100% is physically impossible).
- Unverified limits are explicitly classified as UNVERIFIED rather than generating false faults.
"""

import math
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from backend.app.sensor_framework.enums import ReadingQuality, SensorErrorCode


class SensorValidator:
    """Rigorous sensor data validator."""

    @staticmethod
    def validate_raw_measurement(
        sensor_type: str,
        raw_value: Optional[float],
        timestamp: datetime,
        current_time: Optional[datetime] = None,
    ) -> Tuple[ReadingQuality, SensorErrorCode, Optional[str]]:
        """Validate raw observation.

        Returns:
            Tuple of (ReadingQuality, SensorErrorCode, failure_reason)
        """
        # 1. Structural check
        if raw_value is None:
            return (
                ReadingQuality.MISSING,
                SensorErrorCode.SENSOR_INVALID_DATA,
                "Measurement value is null/missing",
            )

        if math.isnan(raw_value) or math.isinf(raw_value):
            return (
                ReadingQuality.INVALID,
                SensorErrorCode.SENSOR_INVALID_DATA,
                f"Measurement is non-finite: {raw_value}",
            )

        # 2. Temporal check (Clock skew tolerance: max 60s in future)
        now = current_time or datetime.now(timezone.utc)
        if timestamp > now + timedelta(seconds=60):
            return (
                ReadingQuality.INVALID,
                SensorErrorCode.SENSOR_INVALID_DATA,
                f"Timestamp {timestamp.isoformat()} is in the future relative to {now.isoformat()}",
            )

        # 3. Fundamental physical plausibility checks (Fundamental Physical Invariants ONLY)
        # Note: We do NOT clip displacement, vibration, cracks, or methane because extreme readings
        # represent real structural failure or gas bursts.
        if sensor_type == "oxygen_o2":
            if raw_value < 0.0 or raw_value > 100.0:
                return (
                    ReadingQuality.OUT_OF_BOUNDS,
                    SensorErrorCode.SENSOR_INVALID_DATA,
                    f"Oxygen concentration {raw_value}% is outside physical bound [0, 100]%",
                )

        elif sensor_type == "humidity":
            if raw_value < 0.0 or raw_value > 100.0:
                return (
                    ReadingQuality.OUT_OF_BOUNDS,
                    SensorErrorCode.SENSOR_INVALID_DATA,
                    f"Relative humidity {raw_value}% is outside physical bound [0, 100]%",
                )

        elif sensor_type == "temperature":
            if raw_value < -273.15:  # Absolute zero
                return (
                    ReadingQuality.OUT_OF_BOUNDS,
                    SensorErrorCode.SENSOR_INVALID_DATA,
                    f"Temperature {raw_value}°C is below absolute zero (-273.15°C)",
                )

        elif sensor_type == "pressure":
            if raw_value <= 0.0:  # Absolute pressure cannot be negative or zero
                return (
                    ReadingQuality.OUT_OF_BOUNDS,
                    SensorErrorCode.SENSOR_INVALID_DATA,
                    f"Barometric pressure {raw_value} hPa cannot be non-positive",
                )

        return ReadingQuality.VALID, SensorErrorCode.NONE, None
