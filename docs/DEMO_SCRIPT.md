# SIH 2026 Mine Safety Monitoring System
# DEMO SCRIPT

Version: 1.0 (Phase 20) | Duration: 12-15 min

## PRE-DEMO SETUP
1. Start backend: uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
2. Start frontend: cd frontend && npm run dev
3. Verify: http://localhost:8000/api/v1/health
4. Seed: python scripts/seed_demo_data.py
5. Browser: http://localhost:5173
6. Swagger: http://localhost:8000/docs

## DEMO FLOW

STEP 1 - Problem (1 min)
Show landing page. Explain: continuous distributed mine monitoring.

STEP 2 - Architecture (2 min)
Four layers: Nodes -> LoRa[SIMULATED] -> FastAPI backend -> React dashboard.

STEP 3 - Dashboard (/dashboard)
Active node count, fleet risk, telemetry from selected node.

STEP 4 - Live Map (/live-map)
4 nodes on schematic canvas. Note: positions are illustrative.

STEP 5 - Nodes (/nodes)
4 nodes. NODE-JHR-03 UNRESPONSIVE. Click for Node Details Drawer.

STEP 6 - Historical Trends (/data-trends)
NODE-JHR-01, Methane CH4, 24H. Shows seeded historical data.

STEP 7 - Risk Demo
Open Swagger. POST /api/v1/ingestion/telemetry:
  node_identifier: NODE-JHR-01
  readings: methane_ch4=2.5, temperature=38.0
Return to dashboard. Show updated risk and new alert.

STEP 8 - Alerts (/alerts)
Severity cards, Alert Details Drawer, Resolve button.

STEP 9 - AI Analytics (/analytics)
StatisticalAnomalyDetector, Z-score 3.0, window 30.
READ: Prototype assistive model. Does NOT replace safety rules.

STEP 10 - Reports/Settings
TBD banners on /reports and /settings. Explain deferred scope.

STEP 11 - Scalability
Async FastAPI + PostgreSQL. Docker Compose. 109 backend tests passing.

STEP 12 - Limitations
LoRa hardware, GPS, thresholds, auth (D-006), AI training - all documented.

## RECOVERY

Backend fails: check .venv active. Check port 8000 free. Show /docs as fallback.
No data: run seed_demo_data.py. Send ingestion payload.
Frontend unreachable: verify port 8000. Restart backend then frontend.
WebSocket DISCONNECTED: REST still works. State: live push is best-effort.
No alerts: send methane_ch4=2.5. Reload /alerts.
Stale browser: Ctrl+Shift+R or new incognito at http://localhost:5173