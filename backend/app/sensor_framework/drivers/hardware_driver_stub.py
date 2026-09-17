"""Physical Hardware Driver Boundary Stub.

Phase 27 Reference: Explicit boundary for unverified physical hardware integration.
Strict Anti-Hallucination Policy:
- Physical sensor drivers must NEVER be fabricated or claimed to function without actual hardware.
- Status is strictly BLOCKED until physical hardware part numbers, electrical schematics,
  and bus addresses are selected and lab-tested in Phase 28.
"""

from backend.app.sensor_framework.base_driver import BaseSensorDriver
from backend.app.sensor_framework.enums import HardwareStatus, SensorHealthState
from backend.app.sensor_framework.models import SensorConfiguration


class BlockedPhysicalHardwareDriver(BaseSensorDriver):
    """Explicitly BLOCKED physical driver stub awaiting verified hardware selection."""

    def __init__(self, config: SensorConfiguration, reason_blocked: str):
        config.hardware_status = HardwareStatus.BLOCKED
        super().__init__(config)
        self.reason_blocked = reason_blocked

    async def initialize(self) -> SensorHealthState:
        """Physical hardware cannot be initialized without verified hardware."""
        self.health_state = SensorHealthState.FAULT
        return self.health_state

    async def acquire_raw(self) -> float:
        """Physical acquisition is BLOCKED."""
        raise RuntimeError(
            f"Physical sensor hardware acquisition is BLOCKED for {self.sensor_identifier}: {self.reason_blocked}"
        )
