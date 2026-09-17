"""Controlled Simulation Sensor Driver.

Phase 27 Reference: Provides transparent, explicit simulated sensor observations
for testing the acquisition and calibration framework.
Strict Anti-Hallucination Policy:
- Explicitly tags all readings as SIMULATED_HARDWARE or MOCK_SENSOR.
- Allows deterministic injection of values, noise, drift, and faults for test coverage.
"""

from typing import Callable, Optional

from backend.app.sensor_framework.base_driver import BaseSensorDriver
from backend.app.sensor_framework.enums import HardwareStatus, SensorHealthState
from backend.app.sensor_framework.models import SensorConfiguration


class SimulatedSensorDriver(BaseSensorDriver):
    """Simulated sensor driver with explicit simulation status and failure injection."""

    def __init__(
        self,
        config: SensorConfiguration,
        value_generator: Optional[Callable[[], float]] = None,
    ):
        # Enforce that hardware_status is explicitly marked simulated
        if config.hardware_status not in (
            HardwareStatus.SIMULATED_HARDWARE,
            HardwareStatus.MOCK_SENSOR,
            HardwareStatus.TEST_FIXTURE,
        ):
            config.hardware_status = HardwareStatus.SIMULATED_HARDWARE

        super().__init__(config)
        self.value_generator = value_generator or (lambda: 0.0)
        self._inject_failure: Optional[Exception] = None

    async def initialize(self) -> SensorHealthState:
        """Initialize simulated driver."""
        self.health_state = SensorHealthState.READY
        return self.health_state

    def inject_failure(self, exception: Optional[Exception]) -> None:
        """Inject an acquisition failure for testing resilience."""
        self._inject_failure = exception

    async def acquire_raw(self) -> float:
        """Acquire simulated raw value or raise injected failure."""
        if self._inject_failure is not None:
            raise self._inject_failure
        return self.value_generator()
