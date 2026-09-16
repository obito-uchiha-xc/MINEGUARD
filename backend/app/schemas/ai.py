"""AI / Anomaly Detection Schemas (DTOs).

Phase 7 Scope: Defines request and response models for assistive statistical
anomaly detection evaluation, history querying, and model metadata inspection.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AnomalyEvaluationResult(BaseModel):
    """Result of an anomaly evaluation for a sensor or multi-sensor cluster."""

    model_config = ConfigDict(from_attributes=True)

    node_id: int
    sensor_type: Optional[str] = None
    is_anomaly: bool
    anomaly_score: float
    threshold: float
    model_name: str
    model_version: str
    features: Dict[str, Any] = Field(default_factory=dict)
    explanation: str
    detected_at: datetime


class AIAnomalyRecordResponse(BaseModel):
    """API response DTO for a persisted AI anomaly record."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    node_id: int
    sensor_type: Optional[str] = None
    is_anomaly: bool
    anomaly_score: float
    threshold: float
    model_name: str
    model_version: str
    features: Dict[str, Any]
    explanation: str
    detected_at: datetime


class ModelMetadataResponse(BaseModel):
    """Metadata describing an active AI / anomaly detection model."""

    model_name: str
    model_version: str
    algorithm: str
    parameters: Dict[str, Any]
    description: str
    is_assistive: bool = True
    disclaimer: str = (
        "Prototype assistive model. Does NOT replace deterministic safety rules "
        "or serve as an authoritative safety limit."
    )


class ManualEvaluationRequest(BaseModel):
    """Optional request body for manually triggering an on-demand evaluation."""

    window_size: Optional[int] = Field(
        default=None,
        ge=5,
        le=200,
        description="Optional custom baseline window size for this on-demand evaluation.",
    )
