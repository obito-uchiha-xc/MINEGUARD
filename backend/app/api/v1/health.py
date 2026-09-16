"""Health and Readiness Check Endpoints.

Phase 1 Baseline + Phase 9 Hardening:
- /health: Backward-compatible runtime health check.
- /health/liveness: Process liveness probe ("is the process running?").
- /health/readiness: Operational readiness probe ("can the app serve requests?"),
  verifying database connectivity without masking critical failures.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.errors import create_error_response
from backend.app.core.logging import get_logger
from backend.app.db.session import get_db_session
from backend.app.services.broadcaster import telemetry_broadcaster

logger = get_logger(__name__)
router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Application Health Check (Backward Compatible)",
    response_description="Operational status of the backend application",
)
async def health_check() -> Dict[str, str]:
    """Return backend operational status (backward-compatible)."""
    return {"status": "ok"}


@router.get(
    "/health/liveness",
    status_code=status.HTTP_200_OK,
    summary="Process Liveness Probe",
    response_description="Confirms the process is running and accepting HTTP requests.",
)
async def liveness_probe() -> Dict[str, str]:
    """Return process liveness confirmation."""
    return {"status": "alive"}


@router.get(
    "/health/readiness",
    summary="Operational Readiness Probe",
    response_description="Validates mandatory dependencies (database connectivity).",
)
async def readiness_probe(
    session: AsyncSession = Depends(get_db_session),
) -> JSONResponse:
    """Validate backend readiness by testing database connectivity."""
    try:
        # Execute minimal connectivity probe
        await session.execute(text("SELECT 1"))
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "ready",
                "database": "connected",
                "details": {
                    "live_ws_clients": telemetry_broadcaster.client_count,
                },
            },
        )
    except Exception as err:
        logger.error(f"Readiness check failed: Database unreachable — {err}")
        return create_error_response(
            code="DATABASE_UNAVAILABLE",
            message="Database dependency is unreachable.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"error": "Database connectivity check failed"},
        )
