"""Mines Management Endpoints.

Phase 8 Scope: Read-only presentation endpoints for mine facilities.
"""

from typing import List
from fastapi import APIRouter, Depends, Path
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.errors import AppException
from backend.app.db.session import get_db_session
from backend.app.models.mine import Mine
from backend.app.models.node import IntegratedNode
from backend.app.models.zone import Zone
from backend.app.schemas.dashboard import (
    MineDetailResponse,
    MineSummaryResponse,
    ZoneSummaryResponse,
)

router = APIRouter(prefix="/mines", tags=["Dashboard / Mines"])


@router.get(
    "",
    response_model=List[MineSummaryResponse],
    summary="List all monitored mine facilities",
    description="Returns high-level summary of all registered mine facilities including zone counts.",
)
async def list_mines(
    session: AsyncSession = Depends(get_db_session),
) -> List[MineSummaryResponse]:
    """List all registered mines."""
    stmt = (
        select(Mine, func.count(Zone.id).label("zone_count"))
        .outerjoin(Zone, Zone.mine_id == Mine.id)
        .group_by(Mine.id)
        .order_by(Mine.name)
    )
    res = await session.execute(stmt)
    rows = res.all()

    return [
        MineSummaryResponse(
            id=mine.id,
            name=mine.name,
            code=mine.code,
            zone_count=zone_count,
        )
        for mine, zone_count in rows
    ]


@router.get(
    "/{mine_id}",
    response_model=MineDetailResponse,
    summary="Get mine facility details",
    description="Returns detailed information for a single mine facility, including its constituent operational zones.",
)
async def get_mine(
    mine_id: int = Path(..., description="Internal mine facility primary key", ge=1),
    session: AsyncSession = Depends(get_db_session),
) -> MineDetailResponse:
    """Retrieve mine facility detail by ID."""
    stmt = select(Mine).where(Mine.id == mine_id)
    res = await session.execute(stmt)
    mine = res.scalar_one_or_none()

    if not mine:
        raise AppException(
            code="MINE_NOT_FOUND",
            message=f"Mine facility with ID {mine_id} does not exist.",
            status_code=404,
            details={"mine_id": mine_id},
        )

    # Fetch zones with node counts
    zone_stmt = (
        select(Zone, func.count(IntegratedNode.id).label("node_count"))
        .outerjoin(IntegratedNode, IntegratedNode.zone_id == Zone.id)
        .where(Zone.mine_id == mine.id)
        .group_by(Zone.id)
        .order_by(Zone.name)
    )
    zone_res = await session.execute(zone_stmt)
    zone_rows = zone_res.all()

    zones_dto = [
        ZoneSummaryResponse(
            id=z.id,
            mine_id=z.mine_id,
            name=z.name,
            code=z.code,
            node_count=node_count,
        )
        for z, node_count in zone_rows
    ]

    return MineDetailResponse(
        id=mine.id,
        name=mine.name,
        code=mine.code,
        zones=zones_dto,
    )
