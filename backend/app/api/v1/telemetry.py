"""Telemetry Query HTTP Endpoints.

Exposes historical and analytical telemetry retrieval APIs.
Phase 4 Scope: Read-only query layer over the sensor_readings table.
Does NOT expose real-time feeds, risk scores, or alerts.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db_session
from backend.app.schemas.telemetry import (
    LatestReadingsResponse,
    TelemetryHistoryResponse,
    WindowAggregateResponse,
)
from backend.app.services.telemetry import TelemetryService

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.get(
    "/nodes/{node_identifier}/history",
    response_model=TelemetryHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Node Telemetry History",
    description=(
        "Returns a paginated list of historical sensor readings for the specified node. "
        "Supports optional filtering by sensor_type, time window (from_dt / to_dt), "
        "and record limit (max 1000)."
    ),
)
async def get_node_history(
    node_identifier: str,
    sensor_type: Optional[str] = Query(
        None,
        description="Filter readings to a specific sensor type (e.g. 'temperature', 'methane_ch4').",
        max_length=64,
    ),
    from_dt: Optional[datetime] = Query(
        None,
        description="Start of time window (inclusive, ISO 8601 UTC). Example: 2024-01-01T00:00:00Z",
    ),
    to_dt: Optional[datetime] = Query(
        None,
        description="End of time window (inclusive, ISO 8601 UTC). Example: 2024-01-02T00:00:00Z",
    ),
    limit: int = Query(
        500,
        ge=1,
        le=1000,
        description="Maximum number of readings to return. Default 500, max 1000.",
    ),
    session: AsyncSession = Depends(get_db_session),
) -> TelemetryHistoryResponse:
    """Retrieve historical sensor readings for a node with optional filters."""
    service = TelemetryService(session)
    return await service.get_history(
        node_identifier=node_identifier,
        sensor_type=sensor_type,
        from_dt=from_dt,
        to_dt=to_dt,
        limit=limit,
    )


@router.get(
    "/nodes/{node_identifier}/latest",
    response_model=LatestReadingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Latest Reading Per Sensor",
    description=(
        "Returns the most-recent sensor reading for each active sensor on the specified node. "
        "Intended for dashboard snapshot / live-view displays. "
        "One reading is returned per active sensor type."
    ),
)
async def get_node_latest(
    node_identifier: str,
    session: AsyncSession = Depends(get_db_session),
) -> LatestReadingsResponse:
    """Return the most-recent reading per active sensor for a node."""
    service = TelemetryService(session)
    return await service.get_latest(node_identifier=node_identifier)


@router.get(
    "/nodes/{node_identifier}/aggregate",
    response_model=WindowAggregateResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Telemetry Window Aggregate",
    description=(
        "Returns statistical aggregates (min, max, avg, count) for a specific sensor type "
        "on the specified node, optionally constrained to a time window. "
        "Returns 404 if no data is found for the sensor type in the given window."
    ),
)
async def get_node_aggregate(
    node_identifier: str,
    sensor_type: str = Query(
        ...,
        description="Sensor type to aggregate (e.g. 'temperature', 'vibration').",
        min_length=1,
        max_length=64,
    ),
    from_dt: Optional[datetime] = Query(
        None,
        description="Start of aggregation window (inclusive, ISO 8601 UTC).",
    ),
    to_dt: Optional[datetime] = Query(
        None,
        description="End of aggregation window (inclusive, ISO 8601 UTC).",
    ),
    session: AsyncSession = Depends(get_db_session),
) -> WindowAggregateResponse:
    """Compute min/max/avg for a sensor type over an optional time window."""
    service = TelemetryService(session)
    return await service.get_aggregate(
        node_identifier=node_identifier,
        sensor_type=sensor_type,
        from_dt=from_dt,
        to_dt=to_dt,
    )
