"""Master API router.

Aggregates versioned route trees into a single router.
"""

from fastapi import APIRouter
from backend.app.api.v1.ai import router as ai_router
from backend.app.api.v1.alerts import router as alerts_router
from backend.app.api.v1.dashboard import router as dashboard_router
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.ingestion import router as ingestion_router
from backend.app.api.v1.mines import router as mines_router
from backend.app.api.v1.nodes import router as nodes_router
from backend.app.api.v1.risk import router as risk_router
from backend.app.api.v1.rules import router as rules_router
from backend.app.api.v1.telemetry import router as telemetry_router
from backend.app.api.v1.ws import router as ws_router
from backend.app.api.v1.zones import router as zones_router
from backend.app.core.config import get_settings

settings = get_settings()

api_router = APIRouter()

# Version 1 Router
v1_router = APIRouter(prefix=settings.API_PREFIX)
v1_router.include_router(health_router)
v1_router.include_router(ingestion_router)
v1_router.include_router(telemetry_router)   # Phase 4: Telemetry Query Layer
v1_router.include_router(ws_router)          # Phase 5: Live Monitoring (WebSocket)
v1_router.include_router(risk_router)        # Phase 6: Risk Engine
v1_router.include_router(alerts_router)      # Phase 6: Alert Engine
v1_router.include_router(rules_router)       # Phase 6: Safety Rules Configuration
v1_router.include_router(ai_router)          # Phase 7: AI / Anomaly Detection
v1_router.include_router(mines_router)       # Phase 8: Dashboard / Mines
v1_router.include_router(zones_router)       # Phase 8: Dashboard / Zones
v1_router.include_router(nodes_router)       # Phase 8: Dashboard / Nodes
v1_router.include_router(dashboard_router)   # Phase 8: Dashboard / Overview


# Mount versioned routers
api_router.include_router(v1_router)

