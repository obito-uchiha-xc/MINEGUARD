"""Schemas (DTOs) for Explainable Risk Assessment.

Phase 6 Scope: Defines contracts for node-level and zone-level explainable risk assessments.
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


RiskLevelType = Literal["NORMAL", "ELEVATED", "HIGH"]


class ContributingFactor(BaseModel):
    """Explainable factor contributing to an elevated risk level."""

    model_config = ConfigDict(extra="ignore")

    factor_type: str = Field(
        ...,
        description="Category: THRESHOLD_BREACH, MULTI_PARAMETER_CORRELATION, or NODE_UNRESPONSIVE.",
    )
    sensor_type: Optional[str] = Field(None, description="Sensor type if factor is sensor-specific.")
    observed_value: Optional[float] = Field(None, description="Observed telemetry reading.")
    threshold_value: Optional[float] = Field(None, description="Configured rule threshold value.")
    operator: Optional[str] = Field(None, description="Rule comparison operator.")
    rule_name: Optional[str] = Field(None, description="Name of the triggering rule.")
    message: str = Field(..., description="Human-readable explanation of why this factor was detected.")
    severity: str = Field(default="WARNING", description="Factor severity tier (WARNING / CRITICAL).")


class RiskAssessmentResponse(BaseModel):
    """Explainable risk assessment for a monitored node.

    🟢 SPEC: BE-REQ-016 — Node-level risk scoring and classification.
    🔵 DECISION D-025: Prototype risk classification (NORMAL / ELEVATED / HIGH).
        Not an official or regulatory mine-safety standard.
    """

    model_config = ConfigDict(from_attributes=True)

    node_id: int
    node_identifier: str
    risk_level: RiskLevelType = Field(
        ...,
        description="🔵 D-025: Prototype risk classification (NORMAL / ELEVATED / HIGH).",
    )
    contributing_factors: List[ContributingFactor] = Field(
        default_factory=list,
        description="Explicit list of factors justifying this risk assessment.",
    )
    assessed_at: datetime = Field(..., description="Timestamp of the risk evaluation.")
    evaluation_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Contextual metadata (e.g. active rules evaluated, sensor count).",
    )


class ZoneRiskSummaryResponse(BaseModel):
    """Zone-level aggregated risk summary for spatial mine maps.

    🟢 SPEC: BE-REQ-019 — Aggregate and map node risk scores to operational mine zones.
    """

    zone_id: int
    zone_name: str
    zone_code: Optional[str] = None
    highest_risk_level: RiskLevelType = Field(
        ...,
        description="Worst-case risk level among constituent nodes.",
    )
    active_node_count: int
    unresponsive_node_count: int
    active_alert_count: int
    assessed_at: datetime
