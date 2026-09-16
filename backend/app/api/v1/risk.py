"""Risk Assessment Endpoints.

Phase 6 Scope: Provides explainable risk assessment queries for nodes and zones.
"""

from fastapi import APIRouter, Depends, Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.errors import AppException
from backend.app.db.session import get_db_session
from backend.app.models.node import IntegratedNode
from backend.app.schemas.risk import RiskAssessmentResponse, ZoneRiskSummaryResponse
from backend.app.services.risk_service import RiskService

router = APIRouter(prefix="/risk", tags=["Risk Engine"])


@router.get(
    "/nodes/{node_identifier}/latest",
    response_model=RiskAssessmentResponse,
    summary="Get latest explainable risk assessment for a node",
    description=(
        "Evaluates the node's current status against active threshold and correlation rules, "
        "and checks communication liveness. Returns explainable contributing factors."
    ),
)
async def get_node_risk(
    node_identifier: str = Path(..., description="External node identifier"),
    session: AsyncSession = Depends(get_db_session),
) -> RiskAssessmentResponse:
    """Retrieve explainable risk assessment for a specified node."""
    stmt = select(IntegratedNode).where(IntegratedNode.node_identifier == node_identifier)
    res = await session.execute(stmt)
    node = res.scalar_one_or_none()

    if not node:
        raise AppException(
            code="NODE_NOT_FOUND",
            message=f"Node '{node_identifier}' is not registered.",
            status_code=404,
            details={"node_identifier": node_identifier},
        )

    service = RiskService(session)
    return await service.evaluate_node_risk(node, persist=True)


@router.get(
    "/zones/{zone_id}",
    response_model=ZoneRiskSummaryResponse,
    summary="Get aggregated zone risk summary",
    description="Rolls up risk levels and liveness statuses of all nodes belonging to an operational mine zone.",
)
async def get_zone_risk(
    zone_id: int = Path(..., description="Internal zone primary key"),
    session: AsyncSession = Depends(get_db_session),
) -> ZoneRiskSummaryResponse:
    """Retrieve zone-level aggregated risk status."""
    service = RiskService(session)
    return await service.evaluate_zone_risk(zone_id)

