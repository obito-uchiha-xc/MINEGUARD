"""Schemas (DTOs) for Configurable Safety Rules.

Phase 6 Scope: Defines API contracts for viewing and creating threshold
and multi-parameter correlation rules.
"""

from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


OperatorType = Literal["GT", "GTE", "LT", "LTE"]
SeverityType = Literal["WARNING", "CRITICAL"]


class ThresholdRuleCreate(BaseModel):
    """Payload to define a new configurable sensor threshold rule."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1, max_length=128, description="Human-readable rule name.")
    sensor_type: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="Sensor type (e.g. temperature, methane_ch4, displacement).",
    )
    operator: OperatorType = Field(
        default="GT",
        description="Comparison operator: GT (>), GTE (>=), LT (<), LTE (<=).",
    )
    threshold_value: float = Field(
        ...,
        description="Configured numerical threshold limit. 🟡 TBD: Not an official safety standard.",
    )
    severity: SeverityType = Field(
        default="WARNING",
        description="🔵 D-026: Severity tier (WARNING or CRITICAL).",
    )
    is_active: bool = Field(default=True, description="Whether rule evaluation is enabled.")
    description: Optional[str] = Field(None, max_length=255)


class ThresholdRuleResponse(BaseModel):
    """Response DTO for a configured threshold rule."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sensor_type: str
    operator: str
    threshold_value: float
    severity: str
    is_active: bool
    description: Optional[str]
    created_at: datetime


class ConditionItem(BaseModel):
    """Individual sub-condition in a multi-parameter correlation rule."""

    model_config = ConfigDict(extra="forbid")

    sensor_type: str = Field(..., min_length=1, max_length=64)
    operator: OperatorType = Field(default="GT")
    threshold_value: float = Field(...)


class MultiParameterRuleCreate(BaseModel):
    """Payload to define a new multi-parameter correlation rule."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1, max_length=128)
    conditions: List[ConditionItem] = Field(
        ...,
        min_length=2,
        description="At least 2 conditions required for multi-parameter correlation.",
    )
    severity: SeverityType = Field(default="CRITICAL")
    is_active: bool = Field(default=True)
    description: Optional[str] = Field(None, max_length=255)


class MultiParameterRuleResponse(BaseModel):
    """Response DTO for a multi-parameter correlation rule."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    conditions: List[dict]
    severity: str
    is_active: bool
    description: Optional[str]
    created_at: datetime
