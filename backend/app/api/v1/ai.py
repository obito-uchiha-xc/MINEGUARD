"""AI / Anomaly Detection Endpoints.

Phase 7 Scope: REST API for querying statistical anomaly detection results,
historical anomaly records, on-demand evaluation, and model metadata.

🟢 SPEC: BE-REQ-015 — Anomaly detection across sensor streams.
🔵 DECISION D-032: AI acts as assistive intelligence only; no override of Phase 6 rules.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.errors import AppException
from backend.app.db.session import get_db_session
from backend.app.models.node import IntegratedNode
from backend.app.schemas.ai import AIAnomalyRecordResponse, ModelMetadataResponse
from backend.app.services.ai.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Anomaly Detection"])


def _resolve_node_or_404(node: Optional[IntegratedNode], node_identifier: str) -> IntegratedNode:
    """Raise 404 if node is not found."""
    if not node:
        raise AppException(
            code="NODE_NOT_FOUND",
            message=f"Node '{node_identifier}' is not registered.",
            status_code=404,
        )
    return node


@router.get(
    "/nodes/{node_identifier}/latest",
    response_model=List[AIAnomalyRecordResponse],
    summary="Get latest AI anomaly evaluation records for a node",
    description=(
        "Returns the most recent statistical anomaly evaluation records for a node. "
        "IMPORTANT: These are PROTOTYPE ASSISTIVE MODEL outputs from an unsupervised statistical "
        "detector. They do NOT replace deterministic Phase 6 safety rules."
    ),
)
async def get_latest_anomalies(
    node_identifier: str = Path(..., description="External node identifier"),
    limit: int = Query(default=10, ge=1, le=100, description="Max records to return"),
    session: AsyncSession = Depends(get_db_session),
) -> List[AIAnomalyRecordResponse]:
    """Retrieve the most recent anomaly evaluation records for a node."""
    stmt = select(IntegratedNode).where(IntegratedNode.node_identifier == node_identifier)
    res = await session.execute(stmt)
    node = _resolve_node_or_404(res.scalar_one_or_none(), node_identifier)

    ai_service = AIService(session)
    records = await ai_service.get_latest_anomalies_for_node(node_id=node.id, limit=limit)
    return [AIAnomalyRecordResponse.model_validate(r) for r in records]


@router.get(
    "/nodes/{node_identifier}/history",
    response_model=List[AIAnomalyRecordResponse],
    summary="Query historical anomaly evaluation records for a node",
    description=(
        "Returns filtered historical anomaly evaluation records for a node. "
        "Supports filtering by sensor_type, anomaly flag, and time range."
    ),
)
async def get_anomaly_history(
    node_identifier: str = Path(..., description="External node identifier"),
    sensor_type: Optional[str] = Query(None, description="Filter by sensor type"),
    is_anomaly: Optional[bool] = Query(None, description="Filter by anomaly flag"),
    from_dt: Optional[datetime] = Query(None, description="Start of time range (UTC ISO 8601)"),
    to_dt: Optional[datetime] = Query(None, description="End of time range (UTC ISO 8601)"),
    limit: int = Query(default=100, ge=1, le=500, description="Max records to return"),
    session: AsyncSession = Depends(get_db_session),
) -> List[AIAnomalyRecordResponse]:
    """Query historical anomaly records with optional sensor/time/flag filters."""
    stmt = select(IntegratedNode).where(IntegratedNode.node_identifier == node_identifier)
    res = await session.execute(stmt)
    node = _resolve_node_or_404(res.scalar_one_or_none(), node_identifier)

    ai_service = AIService(session)
    records = await ai_service.get_anomaly_history(
        node_id=node.id,
        sensor_type=sensor_type,
        is_anomaly=is_anomaly,
        from_dt=from_dt,
        to_dt=to_dt,
        limit=limit,
    )
    return [AIAnomalyRecordResponse.model_validate(r) for r in records]


@router.get(
    "/models",
    response_model=List[ModelMetadataResponse],
    summary="Describe active AI / anomaly detection prototype models",
    description=(
        "Returns metadata for all active anomaly detection models. "
        "All models are explicitly labeled as PROTOTYPE ASSISTIVE tools. "
        "No model is trained on labeled mine failure data."
    ),
)
async def get_model_metadata(
    session: AsyncSession = Depends(get_db_session),
) -> List[ModelMetadataResponse]:
    """Return metadata for all active anomaly detection models."""
    ai_service = AIService(session)
    return ai_service.get_models_metadata()
