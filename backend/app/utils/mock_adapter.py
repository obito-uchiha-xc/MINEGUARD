"""DEVELOPMENT / TEST ONLY: Mock Ingestion Adapter.

WARNING:
This module is strictly a development and testing utility designed to generate
synthetic telemetry frames matching the normalized ingestion contract.
It does NOT communicate with physical LoRa hardware, LoRaWAN gateways,
or the physical Mother System.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from backend.app.schemas.ingestion import (
    MeasurementItem,
    TelemetryIngestionRequest,
)


class MockMotherSystemAdapter:
    """Mock edge adapter simulating telemetry frames forwarded by the Mother System gateway.

    FOR DEVELOPMENT AND AUTOMATED TESTING PURPOSES ONLY.
    """

    @staticmethod
    def create_mock_telemetry_payload(
        node_identifier: str,
        measurements: Dict[str, float],
        timestamp: Optional[datetime] = None,
    ) -> TelemetryIngestionRequest:
        """Construct a synthetic TelemetryIngestionRequest for testing.

        Args:
            node_identifier: Physical/external identifier of the reporting node.
            measurements: Dictionary mapping sensor_type to measurement float value.
            timestamp: Optional UTC timestamp (defaults to current time).

        Returns:
            TelemetryIngestionRequest: Formatted ingestion DTO.
        """
        readings: List[MeasurementItem] = [
            MeasurementItem(sensor_type=sensor_type, value=val)
            for sensor_type, val in measurements.items()
        ]

        return TelemetryIngestionRequest(
            node_identifier=node_identifier,
            timestamp=timestamp or datetime.now(timezone.utc),
            readings=readings,
        )

    @staticmethod
    def generate_full_multimodal_frame(
        node_identifier: str,
        timestamp: Optional[datetime] = None,
    ) -> TelemetryIngestionRequest:
        """Generate a complete multi-modal sensor frame containing representative readings across all 5 monitored categories (Sec. 4)."""
        sample_values = {
            "displacement": 1.25,
            "vibration": 0.42,
            "crack_detection": 0.85,
            "temperature": 24.5,
            "humidity": 68.0,
            "pressure": 1013.2,
            "methane_ch4": 0.15,
            "carbon_monoxide_co": 12.0,
            "oxygen_o2": 20.8,
        }
        return MockMotherSystemAdapter.create_mock_telemetry_payload(
            node_identifier=node_identifier,
            measurements=sample_values,
            timestamp=timestamp,
        )
