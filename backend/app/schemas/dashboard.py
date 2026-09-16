"""Schemas (DTOs) for Dashboard and Spatial Entity APIs.

Phase 8 Scope: Presentation contracts for Mines, Zones, Nodes, Sensors, and
the consolidated Dashboard Overview Snapshot.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.risk import ZoneRiskSummaryResponse


# --- Sensor Presentation DTOs ---

class SensorInfoResponse(BaseModel):
    """Sensor capability presentation model for node detail displays."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    sensor_type: str = Field(..., description="Sensor capability category.")
    sensor_identifier: Optional[str] = Field(
        None, description="Sub-sensor / channel identifier."
    )
    unit: Optional[str] = Field(None, description="Physical unit (TBD per Phase 0).")
    is_active: bool = Field(..., description="Operational status of the sensor.")


# --- Node Presentation DTOs ---

class NodeSummaryResponse(BaseModel):
    """Lightweight node summary for listings."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    zone_id: int
    node_identifier: str = Field(..., description="External unique node identifier.")
    status: str = Field(..., description="Operational status (ACTIVE / UNRESPONSIVE).")
    last_seen_at: Optional[datetime] = Field(
        None, description="Latest telemetry heartbeat timestamp."
    )
    sensor_count: int = Field(default=0, description="Total mounted sensors on this node.")


class NodeDetailResponse(BaseModel):
    """Detailed node configuration and metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    zone_id: int
    zone_name: Optional[str] = Field(None, description="Parent zone name.")
    node_identifier: str = Field(..., description="External unique node identifier.")
    status: str = Field(..., description="Operational status (ACTIVE / UNRESPONSIVE).")
    last_seen_at: Optional[datetime] = Field(
        None, description="Latest telemetry heartbeat timestamp."
    )
    sensors: List[SensorInfoResponse] = Field(
        default_factory=list, description="Mounted sensors on this node."
    )


# --- Zone Presentation DTOs ---

class ZoneSummaryResponse(BaseModel):
    """Lightweight zone summary for listings."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    mine_id: int
    name: str = Field(..., description="Operational zone name.")
    code: Optional[str] = Field(None, description="Operational zone code (e.g. Zone A).")
    node_count: int = Field(default=0, description="Total nodes deployed in this zone.")


class ZoneDetailResponse(BaseModel):
    """Detailed zone configuration with constituent nodes."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    mine_id: int
    name: str = Field(..., description="Operational zone name.")
    code: Optional[str] = Field(None, description="Operational zone code.")
    nodes: List[NodeSummaryResponse] = Field(
        default_factory=list, description="Nodes deployed in this zone."
    )


# --- Mine Presentation DTOs ---

class MineSummaryResponse(BaseModel):
    """Lightweight mine facility summary for listings."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str = Field(..., description="Mine facility name.")
    code: Optional[str] = Field(None, description="Unique facility code.")
    zone_count: int = Field(default=0, description="Number of monitored zones.")


class MineDetailResponse(BaseModel):
    """Detailed mine facility model with operational zones."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str = Field(..., description="Mine facility name.")
    code: Optional[str] = Field(None, description="Unique facility code.")
    zones: List[ZoneSummaryResponse] = Field(
        default_factory=list, description="Operational zones within this mine."
    )


# --- Dashboard Overview / Snapshot DTOs ---

class AlertSeverityCount(BaseModel):
    """Active alerts breakdown by severity level."""

    warning: int = Field(default=0, description="Active WARNING alerts.")
    critical: int = Field(default=0, description="Active CRITICAL alerts.")
    total: int = Field(default=0, description="Total active alerts.")


class DashboardOverviewResponse(BaseModel):
    """Composite system operational overview snapshot for the dashboard."""

    model_config = ConfigDict(from_attributes=True)

    total_mines: int = Field(..., description="Total monitored mine facilities.")
    total_zones: int = Field(..., description="Total monitored zones across all mines.")
    total_nodes: int = Field(..., description="Total registered integrated nodes.")
    active_nodes: int = Field(..., description="Currently active/responsive nodes.")
    unresponsive_nodes: int = Field(..., description="Currently unresponsive/timed-out nodes.")
    alerts: AlertSeverityCount = Field(..., description="Active safety alerts breakdown.")
    zones_overview: List[ZoneRiskSummaryResponse] = Field(
        default_factory=list,
        description="Spatial zone risk rollups for the Mine Risk Map.",
    )
    snapshot_at: datetime = Field(..., description="Timestamp of this snapshot (UTC).")
