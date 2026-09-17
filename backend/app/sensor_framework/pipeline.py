"""Sensor Acquisition & Telemetry Packaging Pipeline.

Phase 27 Reference: Coordinates multi-sensor acquisition on an Integrated Node,
enforces non-masking fail-safe handling, and maps canonical readings to the
backend TelemetryIngestionRequest contract.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from backend.app.schemas.ingestion import MeasurementItem, TelemetryIngestionRequest
from backend.app.sensor_framework.base_driver import BaseSensorDriver
from backend.app.sensor_framework.enums import ReadingQuality
from backend.app.sensor_framework.models import CanonicalSensorReading


class SensorAcquisitionPipeline:
    """Orchestrator for node sensor acquisition and telemetry frame assembly."""

    def __init__(self, node_identifier: str):
        self.node_identifier = node_identifier
        self.drivers: Dict[str, BaseSensorDriver] = {}

    def register_driver(self, driver: BaseSensorDriver) -> None:
        """Register a sensor driver to this node pipeline."""
        if driver.node_identifier != self.node_identifier:
            raise ValueError(
                f"Driver node '{driver.node_identifier}' does not match pipeline node '{self.node_identifier}'"
            )
        self.drivers[driver.sensor_identifier] = driver

    async def acquire_all(
        self, current_time: Optional[datetime] = None
    ) -> List[CanonicalSensorReading]:
        """Execute acquisition across all registered sensor drivers."""
        now = current_time or datetime.now(timezone.utc)
        readings: List[CanonicalSensorReading] = []

        for sensor_id, driver in self.drivers.items():
            if not driver.config.is_enabled:
                continue

            reading = await driver.read(current_time=now)
            readings.append(reading)

        return readings

    @staticmethod
    def map_to_ingestion_request(
        node_identifier: str,
        readings: List[CanonicalSensorReading],
        timestamp: Optional[datetime] = None,
    ) -> Tuple[Optional[TelemetryIngestionRequest], List[CanonicalSensorReading]]:
        """Map canonical readings to the normalized backend TelemetryIngestionRequest contract.

        Only VALID readings with non-null engineering values are included in the ingestion payload.
        Faulted and invalid readings are returned separately for diagnostics/logging.
        """
        now = timestamp or datetime.now(timezone.utc)
        valid_items: List[MeasurementItem] = []
        faulted_items: List[CanonicalSensorReading] = []

        for r in readings:
            if r.quality == ReadingQuality.VALID and r.engineering_value is not None:
                valid_items.append(
                    MeasurementItem(
                        sensor_type=r.sensor_type,
                        value=r.engineering_value,
                        sensor_identifier=r.sensor_identifier,
                    )
                )
            else:
                faulted_items.append(r)

        if not valid_items:
            return None, faulted_items

        request = TelemetryIngestionRequest(
            node_identifier=node_identifier,
            timestamp=now,
            readings=valid_items,
        )
        return request, faulted_items
