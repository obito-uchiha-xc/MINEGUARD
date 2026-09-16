"""Live Telemetry Event Schemas (DTOs).

Phase 5 Scope: Defines the WebSocket message contracts for:
  - LiveTelemetryEvent: server-to-client event carrying accepted telemetry.
  - SubscriptionMessage: client-to-server message to set a node_identifier filter.
  - KeepalivePing: server-to-client keepalive / heartbeat frame.

Design rules:
  - Reuses SensorReadingResponse from Phase 4 (no duplicate representations).
  - event_type field is reserved for future event type discrimination
    (e.g. "telemetry", "alert", "ping" in later phases).
  - No safety thresholds, risk states, or AI scores are included.
"""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.telemetry import SensorReadingResponse


class LiveTelemetryEvent(BaseModel):
    """Server-to-client WebSocket message carrying accepted sensor telemetry.

    Emitted once per successful ingestion transaction after DB commit.
    Reuses SensorReadingResponse from Phase 4 — no new field definitions.

    🟢 SPEC: BE-REQ-007 — Backend must support continuous live telemetry feeds.
    🔵 DECISION D-004: WebSocket transport selected.
    """

    model_config = ConfigDict(from_attributes=True)

    event_type: Literal["telemetry"] = Field(
        default="telemetry",
        description=(
            "Event type discriminator. Reserved for future event type routing "
            "(e.g. 'alert', 'risk_update' in later phases)."
        ),
    )
    node_identifier: str = Field(
        ...,
        description="External identifier of the reporting node.",
    )
    node_id: int = Field(
        ...,
        description="Internal node primary key (for efficient client-side indexing).",
    )
    readings: List[SensorReadingResponse] = Field(
        ...,
        description="Enriched sensor readings from this ingestion batch. Reuses Phase 4 DTO.",
    )
    ingested_at: datetime = Field(
        ...,
        description="UTC timestamp when the backend committed this telemetry batch.",
    )


class SubscriptionMessage(BaseModel):
    """Client-to-server WebSocket message to set an optional node filter.

    Sent by the client as the first message after connecting.
    If omitted, the client receives telemetry from ALL nodes.

    🔵 DECISION D-024: Optional node_identifier subscription filter.
    """

    model_config = ConfigDict(extra="ignore")

    action: Literal["subscribe"] = Field(
        ...,
        description="Must be 'subscribe'.",
    )
    node_identifier: Optional[str] = Field(
        None,
        description=(
            "If set, client receives only telemetry from this node. "
            "If None or omitted, client receives all-node telemetry."
        ),
        max_length=128,
    )


class KeepalivePing(BaseModel):
    """Server-to-client keepalive ping frame.

    Sent every WS_KEEPALIVE_INTERVAL_S seconds to detect stale connections.

    🔵 DECISION D-022: Lightweight keepalive mechanism.
    """

    event_type: Literal["ping"] = Field(default="ping")
    server_time: datetime = Field(..., description="Server UTC time at ping emission.")


class LiveAlertEvent(BaseModel):
    """Server-to-client WebSocket message carrying a newly triggered or resolved alert.

    Phase 6: Reuses Phase 5 WebSocket transport for real-time alert delivery.
    """

    model_config = ConfigDict(from_attributes=True)

    event_type: Literal["alert"] = Field(default="alert")
    node_identifier: str = Field(..., description="Reporting node external identifier.")
    node_id: int = Field(..., description="Internal node primary key.")
    alert_id: int
    alert_type: str
    severity: str
    status: str
    message: str
    context_data: dict = Field(default_factory=dict)
    emitted_at: datetime


class LiveRiskEvent(BaseModel):
    """Server-to-client WebSocket message carrying an updated risk evaluation.

    Phase 6: Broadcasts explainable risk assessments to live monitoring clients.
    """

    model_config = ConfigDict(from_attributes=True)

    event_type: Literal["risk_update"] = Field(default="risk_update")
    node_identifier: str
    node_id: int
    risk_level: str
    factor_count: int
    assessed_at: datetime


class LiveAnomalyEvent(BaseModel):
    """Server-to-client WebSocket message carrying an AI / anomaly detection evaluation.

    Phase 7: Broadcasts assistive statistical anomalies to live monitoring clients.
    """

    model_config = ConfigDict(from_attributes=True)

    event_type: Literal["anomaly"] = Field(default="anomaly")
    node_identifier: str
    node_id: int
    sensor_type: Optional[str] = None
    is_anomaly: bool
    anomaly_score: float
    threshold: float
    model_name: str
    model_version: str
    explanation: str
    detected_at: datetime

