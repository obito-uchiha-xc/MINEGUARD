# SIH 2026 — Integrated Mine Safety Monitoring System
# DEMO GUIDE — Local Setup & Demonstration

**Document Version**: 1.0 (Phase 20 — Final Readiness)
**Classification**: SIH 2026 Prototype Demonstration Guide
**Anti-Hallucination Notice**: All startup commands, endpoints, and environment values documented here are verified against the actual repository. Nothing is invented.

---

## PART A — PREREQUISITES

### Required Software
| Software | Version | Purpose |
| --- | --- | --- |
| Python | 3.12+ | Backend runtime |
| Node.js | 18+ (LTS) | Frontend build & dev server |
| npm | 9+ | Frontend package manager |
| Git | Any | Repository cloning |

### Optional (for containerized run only)
| Software | Purpose |
| --- | --- |
| Docker Desktop | Container runtime |
| Docker Compose v2 | Multi-service orchestration |

> The default local run uses SQLite — NO PostgreSQL installation required for the demo.

---

## PART B — FIRST-TIME SETUP

### B.1 — Clone and Navigate
`powershell
# Clone the repository (use the actual URL)
git clone <repository-url>
cd "sih project"
`

### B.2 — Backend Setup
`powershell
# Create and activate Python virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install backend and dev dependencies
pip install --upgrade pip
pip install -e .[dev]
`

### B.3 — Frontend Setup
`powershell
cd frontend
npm install
cd ..
`

---

## PART C — ENVIRONMENT CONFIGURATION

### C.1 — Backend Environment
The backend requires no mandatory environment variables for local SQLite development.
Copy the example file for reference:
`powershell
copy .env.example .env
`

Default .env values work out of the box:
- DATABASE_URL=sqlite+aiosqlite:///./mine_safety.db (SQLite — no server required)
- DEBUG=true (enables /docs and /redoc at runtime)
- CORS_ALLOWED_ORIGINS=["*"] (open for local dev — restrict in production)

### C.2 — Frontend Environment
`powershell
cd frontend
copy .env.example .env
`

Default values in rontend/.env.example:
- VITE_API_BASE_URL=/api/v1 (uses Vite dev-server proxy to forward to backend port 8000)
- VITE_WS_BASE_URL=ws://localhost:8000/api/v1/ws/telemetry (direct WebSocket connection)
- VITE_ENABLE_MOCK_FALLBACK=false (no mock data)

> Note: The Vite proxy forwards /api/* HTTP requests to http://localhost:8000. WebSocket connections go directly to ws://localhost:8000.

---

## PART D — DATABASE SETUP & MIGRATIONS

### D.1 — Run Alembic Migrations
From the project root (with .venv active):
`powershell
alembic upgrade head
`

This creates the SQLite database file mine_safety.db with the full schema.

### D.2 — Seed Demonstration Data (REQUIRED for a meaningful demo)
`powershell
python scripts/seed_demo_data.py
`

This seeds:
- 2 Mine Facilities (Jharia Deep Colliery No. 5, Raniganj East Shaft Facility)
- 4 Operational Zones (Zone A, Zone B, Zone C, Zone D)
- 4 Integrated Nodes (NODE-JHR-01, NODE-JHR-02, NODE-JHR-03, NODE-RNJ-01)
- 36 Multimodal Sensors (9 types per node)
- 3 Prototype Safety Rules (methane advisory, methane critical, oxygen deficiency)
- 36 Historical Telemetry Readings (12 time steps for NODE-JHR-01)

> NOTICE: All seeded values are SYNTHETIC PROTOTYPE DATA. They do not represent certified sensor readings or statutory safety limits.

### D.3 — Reset Demo State (if needed)
`powershell
# Delete the SQLite database file and re-run migrations + seed
del mine_safety.db
alembic upgrade head
python scripts/seed_demo_data.py
`

---

## PART E — STARTUP SEQUENCE

Run the following commands in separate terminal windows:

### Terminal 1 — Backend
`powershell
# From project root, with .venv active
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
`

Expected output:
`
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000
`

### Terminal 2 — Frontend
`powershell
cd frontend
npm run dev
`

Expected output:
`
VITE v8.x.x  ready in Xms
  Local: http://localhost:5173/
`

---

## PART F — HEALTH CHECKS

After startup, verify the system is running:

### Backend Health
`powershell
# Application health (always returns 200 if process is alive)
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -UseBasicParsing

# Readiness check (verifies live database connectivity)
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health/readiness" -UseBasicParsing
`

### Swagger API Documentation
Open browser: http://localhost:8000/docs

### Frontend
Open browser: http://localhost:5173

---

## PART G — DEMO TELEMETRY INGESTION

To send live telemetry during the demo, use the backend ingestion API directly.

### Method 1 — Swagger UI (Recommended for Demo)
1. Open http://localhost:8000/docs
2. Navigate to POST /api/v1/ingestion/telemetry
3. Use the following example payload:

`json
{
  "node_identifier": "NODE-JHR-01",
  "readings": [
    {"sensor_type": "methane_ch4", "value": 1.8, "unit": "%"},
    {"sensor_type": "temperature", "value": 34.5, "unit": "degC"},
    {"sensor_type": "displacement", "value": 5.2, "unit": "mm"}
  ]
}
`

### Method 2 — PowerShell (for scripted demo ingestion)
`powershell
 = '{"node_identifier":"NODE-JHR-01","readings":[{"sensor_type":"methane_ch4","value":1.8,"unit":"%"},{"sensor_type":"temperature","value":34.5,"unit":"degC"}]}'
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/ingestion/telemetry" -Method POST -ContentType "application/json" -Body 
`

After ingestion:
- Telemetry is persisted to the database
- Risk engine evaluates the new readings
- Alert engine checks thresholds (methane > 1.0% triggers WARNING; > 2.0% triggers CRITICAL)
- All three events are published to the WebSocket broadcaster
- Connected frontend clients receive live updates

---

## PART H — STOPPING EVERYTHING

`powershell
# Stop backend: Ctrl+C in Terminal 1
# Stop frontend: Ctrl+C in Terminal 2
`

---

## PART I — TROUBLESHOOTING

### Backend fails to start
- Check that .venv is activated ((.venv) in prompt)
- Check that pip install -e .[dev] completed without errors
- Check that port 8000 is not already in use: 
etstat -an | findstr 8000
- If DATABASE_URL references PostgreSQL, switch to SQLite for local demo

### Database errors
- Run lembic upgrade head to ensure schema is current
- If mine_safety.db is corrupted: del mine_safety.db then lembic upgrade head

### Frontend cannot reach backend
- Verify backend is running on port 8000
- Verify Vite proxy in rontend/vite.config.ts targets http://localhost:8000
- Check browser console for CORS errors

### WebSocket (live monitoring) fails to connect
- WebSocket connects directly to ws://localhost:8000/api/v1/ws/telemetry
- Backend must be running and the /ws/telemetry endpoint must be accessible
- The Vite dev-server proxy does NOT forward WebSocket connections
- If WS fails, the frontend shows "DISCONNECTED" status in the TopBar but REST data still loads

### No data visible in the frontend
- Run python scripts/seed_demo_data.py to populate demo data
- Then send at least one ingestion payload (see Part G above)
- Verify backend health endpoint returns 200
