"""Zones Management Endpoints.

Phase 8 Scope: Read-only presentation endpoints for operational mine zones.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.errors import AppException
from backend.app.db.session import get_db_session
from backend.app.models.node import IntegratedNode
from backend.app.models.sensor import Sensor
from backend.app.models.zone import Zone
from backend.app.schemas.dashboard import (
    NodeSummaryResponse,
    ZoneDetailResponse,
    ZoneSummaryResponse,
)

router = APIRouter(prefix="/zones", tags=["Dashboard / Zones"])


@router.get(
    "",
    response_model=List[ZoneSummaryResponse],
    summary="List operational mine zones",
    description="Returns list of operational zones, optionally filtered by mine_id.",
)
async def list_zones(
    mine_id: Optional[int] = Query(None, description="Filter zones by mine facility ID", ge=1),
    session: AsyncSession = Depends(get_db_session),
) -> List[ZoneSummaryResponse]:
    """List operational zones."""
    stmt = (
        select(Zone, func.count(IntegratedNode.id).label("node_count"))
        .outerjoin(IntegratedNode, IntegratedNode.zone_id == Zone.id)
        .group_by(Zone.id)
        .order_by(Zone.name)
    )
    if mine_id is not None:
        stmt = stmt.where(Zone.mine_id == mine_id)

    res = await session.execute(stmt)
    rows = res.all()

    return [
        ZoneSummaryResponse(
            id=zone.id,
            mine_id=zone.mine_id,
            name=zone.name,
            code=zone.code,
            node_count=node_count,
        )
        for zone, node_count in rows
    ]


@router.get(
    "/{zone_id}",
    response_model=ZoneDetailResponse,
    summary="Get operational zone details",
    description="Returns detailed information for a single zone, including its deployed nodes.",
)
async def get_zone(
    zone_id: int = Path(..., description="Internal zone primary key", ge=1),
    session: AsyncSession = Depends(get_db_session),
) -> ZoneDetailResponse:
    """Retrieve zone details with constituent nodes."""
    stmt = select(Zone).where(Zone.id == zone_id)
    res = await session.execute(stmt)
    zone = res.scalar_one_or_none()

    if not zone:
        raise AppException(
            code="ZONE_NOT_FOUND",
            message=f"Zone with ID {zone_id} does not exist.",
            status_code=404,
            details={"zone_id": zone_id},
        )

    # Fetch constituent nodes with their sensor counts
    node_stmt = (
        select(IntegratedNode, func.count(Sensor.id).label("sensor_count"))
        .outerjoin(Sensor, Sensor.node_id == IntegratedNode.id)
        .where(IntegratedNode.zone_id == zone.id)
        .group_by(IntegratedNode.id)
        .order_by(IntegratedNode.node_identifier)
    )
    node_res = await session.execute(node_stmt)
    node_rows = node_res.all()

    nodes_dto = [
        NodeSummaryResponse(
            id=node.id,
            zone_id=node.zone_id,
            node_identifier=node.node_identifier,
            status=node.status,
            last_seen_at=node.last_seen_at,
            sensor_count=sensor_count,
        )
        for node, sensor_count in node_rows
    ]

    return ZoneDetailResponse(
        id=zone.id,
        mine_id=zone.mine_id,
        name=zone.name,
        code=zone.code,
        nodes=nodes_dto,
    )
