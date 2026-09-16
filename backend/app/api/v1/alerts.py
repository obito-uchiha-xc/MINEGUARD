"""Alert Management Endpoints.

Phase 6 Scope: Query active/historical alerts and manually resolve active alerts.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db_session
from backend.app.schemas.alert import AlertResolveRequest, AlertResponse
from backend.app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alert Engine"])


@router.get(
    "/active",
    response_model=List[AlertResponse],
    summary="List currently active safety alerts",
    description="Returns all active alerts, optionally filtered by node_identifier.",
)
async def list_active_alerts(
    node_identifier: Optional[str] = Query(None, description="Filter by node identifier"),
    session: AsyncSession = Depends(get_db_session),
) -> List[AlertResponse]:
    """Retrieve active safety alerts."""
    return await AlertService.get_active_alerts(session, node_identifier)


@router.get(
    "/history",
    response_model=List[AlertResponse],
    summary="List historical alerts with filters",
    description="Query alerts with optional status, alert_type, and node_identifier filters.",
)
async def list_historical_alerts(
    node_identifier: Optional[str] = Query(None, description="Filter by node identifier"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE / RESOLVED)"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    session: AsyncSession = Depends(get_db_session),
) -> List[AlertResponse]:
    """Retrieve historical alert log."""
    return await AlertService.get_historical_alerts(
        session,
        node_identifier=node_identifier,
        alert_type=alert_type,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/{alert_id}/resolve",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    summary="Manually resolve an active alert",
    description="Transition an active alert to RESOLVED with an optional resolution note.",
)
async def resolve_alert(
    alert_id: int = Path(..., description="Alert internal primary key"),
    payload: Optional[AlertResolveRequest] = None,
    session: AsyncSession = Depends(get_db_session),
) -> AlertResponse:
    """Manually resolve an alert."""
    note = payload.resolution_note if payload else None
    return await AlertService.resolve_alert(session, alert_id, resolution_note=note)
