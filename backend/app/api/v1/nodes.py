"""Nodes Management Endpoints.

Phase 8 Scope: Read-only presentation endpoints for integrated nodes.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.errors import AppException
from backend.app.db.session import get_db_session
from backend.app.models.node import IntegratedNode
from backend.app.models.sensor import Sensor
from backend.app.models.zone import Zone
from backend.app.schemas.dashboard import (
    NodeDetailResponse,
    NodeSummaryResponse,
    SensorInfoResponse,
)

router = APIRouter(prefix="/nodes", tags=["Dashboard / Nodes"])


@router.get(
    "",
    response_model=List[NodeSummaryResponse],
    summary="List all integrated nodes",
    description="Returns list of nodes with optional filtering by zone_id and operational status.",
)
async def list_nodes(
    zone_id: Optional[int] = Query(None, description="Filter nodes by zone ID", ge=1),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE / UNRESPONSIVE)"),
    session: AsyncSession = Depends(get_db_session),
) -> List[NodeSummaryResponse]:
    """List integrated nodes with optional filters."""
    stmt = (
        select(IntegratedNode, func.count(Sensor.id).label("sensor_count"))
        .outerjoin(Sensor, Sensor.node_id == IntegratedNode.id)
        .group_by(IntegratedNode.id)
        .order_by(IntegratedNode.node_identifier)
    )
    if zone_id is not None:
        stmt = stmt.where(IntegratedNode.zone_id == zone_id)
    if status is not None:
        stmt = stmt.where(IntegratedNode.status == status.upper())

    res = await session.execute(stmt)
    rows = res.all()

    return [
        NodeSummaryResponse(
            id=node.id,
            zone_id=node.zone_id,
            node_identifier=node.node_identifier,
            status=node.status,
            last_seen_at=node.last_seen_at,
            sensor_count=sensor_count,
        )
        for node, sensor_count in rows
    ]


@router.get(
    "/{node_identifier}",
    response_model=NodeDetailResponse,
    summary="Get integrated node details",
    description="Returns detailed node configuration, mounted sensor capabilities, and parent zone.",
)
async def get_node(
    node_identifier: str = Path(..., description="External unique node identifier"),
    session: AsyncSession = Depends(get_db_session),
) -> NodeDetailResponse:
    """Retrieve node details with mounted sensors."""
    stmt = (
        select(IntegratedNode)
        .options(selectinload(IntegratedNode.zone), selectinload(IntegratedNode.sensors))
        .where(IntegratedNode.node_identifier == node_identifier)
    )
    res = await session.execute(stmt)
    node = res.scalar_one_or_none()

    if not node:
        raise AppException(
            code="NODE_NOT_FOUND",
            message=f"Node '{node_identifier}' is not registered.",
            status_code=404,
            details={"node_identifier": node_identifier},
        )

    sensors_dto = [
        SensorInfoResponse(
            id=s.id,
            sensor_type=s.sensor_type,
            sensor_identifier=s.sensor_identifier,
            unit=s.unit,
            is_active=s.is_active,
        )
        for s in (node.sensors or [])
    ]

    return NodeDetailResponse(
        id=node.id,
        zone_id=node.zone_id,
        zone_name=node.zone.name if node.zone else None,
        node_identifier=node.node_identifier,
        status=node.status,
        last_seen_at=node.last_seen_at,
        sensors=sensors_dto,
    )
