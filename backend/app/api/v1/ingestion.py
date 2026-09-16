"""Telemetry Ingestion HTTP Transport Adapter.

Exposes the external ingestion boundary for telemetry transmitted
by the Mother System gateway.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db_session
from backend.app.schemas.ingestion import (
    TelemetryIngestionRequest,
    TelemetryIngestionResponse,
)
from backend.app.services.ingestion import TelemetryIngestionService

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])


@router.post(
    "/telemetry",
    response_model=TelemetryIngestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Node Telemetry Frame",
    description=(
        "Receives a multi-sensor telemetry frame forwarded by the Mother System gateway. "
        "Validates the reporting node, maps measurements to active sensors, and persists "
        "observations to historical time-series storage."
    ),
)
async def ingest_telemetry(
    payload: TelemetryIngestionRequest,
    session: AsyncSession = Depends(get_db_session),
) -> TelemetryIngestionResponse:
    """Ingest, validate, and persist telemetry observations from an Integrated Node."""
    return await TelemetryIngestionService.ingest_telemetry(payload, session)
