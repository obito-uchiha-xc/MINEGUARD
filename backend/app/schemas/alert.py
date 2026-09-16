"""Schemas (DTOs) for Safety Alerts.

Phase 6 Scope: Defines API contracts for alert listing, inspection, and manual resolution.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class AlertResponse(BaseModel):
    """Safety alert payload returned to callers and dashboards."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    node_id: int
    node_identifier: str = Field(..., description="Reporting node external identifier.")
    alert_type: str = Field(
        ...,
        description="Category: THRESHOLD, MULTI_PARAMETER, or NODE_UNRESPONSIVE.",
    )
    condition_key: str = Field(..., description="Deduplication key representing the specific trigger.")
    severity: str = Field(..., description="🔵 D-026: Severity tier (WARNING / CRITICAL).")
    status: str = Field(..., description="Lifecycle status (ACTIVE / RESOLVED).")
    message: str = Field(..., description="Factual description of the triggering condition.")
    context_data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Snapshot of telemetry readings or liveness data at time of trigger.",
    )
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    created_at: datetime


class AlertResolveRequest(BaseModel):
    """Payload for manual resolution of an active alert."""

    model_config = ConfigDict(extra="forbid")

    resolution_note: Optional[str] = Field(
        None,
        max_length=255,
        description="Optional operator note explaining resolution.",
    )
