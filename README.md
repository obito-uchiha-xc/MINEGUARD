# SIH 2026 — Integrated Mine Safety Monitoring System (Backend)

An AI-enabled, distributed mine safety monitoring backend designed to continuously ingest, validate, store, correlate, and analyze multi-parameter sensor telemetry (displacement, vibration, cracks, environmental conditions, and hazardous gases) originating from field-deployed Integrated Nodes via a central Mother System gateway.

---

## 1. System Architecture

```text
[ Physical Mine Sensors ]
  - Displacement / Deformation (mm)
  - Vibration Disturbances (mm/s)
  - Crack Progression (mm)
  - Environmental (Temp, Humidity, Pressure)
  - Hazardous Gases (CH4, CO, O2, Extensible)
           │
           ▼
[ Integrated Nodes (1..N) ]
           │  (LoRa Radio)
           ▼
[ Mother System Gateway ]
           │  (HTTPS REST Ingestion Adapter)
           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND ARCHITECTURE                         │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ 1. Ingestion Layer: POST /api/v1/ingestion/telemetry         │     │
│   │    - Node Resolution & Health Liveness Check                 │     │
│   │    - Extensible Sensor Mapping & Payload Validation          │     │
│   └──────────────────────────────┬───────────────────────────────┘     │
│                                  │                                     │
│                                  ▼                                     │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ 2. Storage & Persistence: PostgreSQL / SQLite via SQLAlchemy │     │
│   │    - Atomic Time-Series Observation Storage                  │     │
│   │    - Relational Hierarchy: Mine -> Zone -> Node -> Sensor   │     │
│   └───────┬──────────────────────┬──────────────────────┬────────┘     │
│           │                      │                      │              │
│           ▼                      ▼                      ▼              │
│   ┌───────────────┐      ┌───────────────┐      ┌───────────────┐      │
│   │ 3. Live Stream│      │ 4. Risk Engine│      │ 5. AI Anomaly │      │
│   │ (WebSocket)   │      │ (Explainable) │      │ (Statistical) │      │
│   │ /ws/telemetry │      │ - Thresholds  │      │ - Rolling     │      │
│   │ Backpressure  │      │ - Compound    │      │   Z-Score     │      │
│   │ Node Filters  │      │ - Deduplicatn │      │ - Compound RMS│      │
│   └───────────────┘      └───────┬───────┘      └───────┬───────┘      │
│                                  │                      │              │
│                                  ▼                      ▼              │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ 6. Presentation APIs (Dashboard Facade Layer)                │     │
│   │    - /mines, /zones, /nodes (Spatial Hierarchy)              │     │
│   │    - /telemetry/history, /telemetry/aggregate                │     │
│   │    - /dashboard/overview (Composite Operational Snapshot)    │     │
│   └──────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase Implementation Status

All 10 project phases are **100% completed, verified, and documented**:

| Phase | Milestone Name | Status | Key Deliverables |
|---|---|---|---|
| **Phase 0** | Requirements Freeze | **COMPLETED** | Authoritative requirements, traceability matrix, unknowns register. |
| **Phase 1** | Backend Foundation | **COMPLETED** | FastAPI factory, centralized settings, standard error envelope. |
| **Phase 2** | Database & Data Model | **COMPLETED** | SQLAlchemy 2.0 models (Mine, Zone, Node, Sensor, Reading), Alembic migrations. |
| **Phase 3** | Ingestion Layer | **COMPLETED** | Multi-sensor payload validation, node liveness tracking, atomic commit. |
| **Phase 4** | Telemetry Processing & Storage | **COMPLETED** | Historical time-series queries, window aggregations (min/max/avg). |
| **Phase 5** | Live Monitoring | **COMPLETED** | Asyncio WebSocket broadcaster (`/ws/telemetry`), keepalive ping, backpressure. |
| **Phase 6** | Risk & Alert Engine | **COMPLETED** | Explainable risk scoring (NORMAL/ELEVATED/HIGH), alert deduplication, manual resolution. |
| **Phase 7** | AI / Anomaly Detection | **COMPLETED** | Unsupervised statistical anomaly detection (3σ Z-score & Euclidean compound deviation). |
| **Phase 8** | Dashboard APIs | **COMPLETED** | RESTful spatial hierarchy endpoints (`/mines`, `/zones`, `/nodes`) & dashboard overview snapshot. |
| **Phase 9** | Security & Reliability | **COMPLETED** | CORS, security headers, payload bounds, connection pooling, readiness probe (`/health/readiness`). |
| **Phase 10** | Testing & Deployment | **COMPLETED** | 109 automated tests (100% pass rate), Dockerfile, Docker Compose, CI workflow, demo seeder. |

---

## 3. Technology Stack

- **Language & Runtime**: Python 3.12+
- **Web Framework**: FastAPI (ASGI asynchronous runtime)
- **Database ORM**: SQLAlchemy 2.0 (Async declarative mapping with `aiosqlite` and `psycopg`)
- **Database Migrations**: Alembic
- **Validation & Settings**: Pydantic v2 & `pydantic-settings`
- **Real-Time Push**: WebSockets (`asyncio.Queue` in-process fan-out)
- **Containerization**: Docker (Python 3.12-slim, non-root user) & Docker Compose
- **Continuous Integration**: GitHub Actions
- **Testing**: Pytest & `pytest-asyncio` & HTTPX TestClient (109 passing tests)

---

## 4. API Endpoints Reference

All endpoints are versioned under `/api/v1` and expose automatic interactive documentation at `/docs` (Swagger UI) and `/redoc` (ReDoc).

### Health & Diagnostics
- `GET /api/v1/health` — Backward-compatible application health check.
- `GET /api/v1/health/liveness` — Process heartbeat confirmation.
- `GET /api/v1/health/readiness` — Operational readiness check (verifies live database connectivity).

### Telemetry Ingestion (Mother System Gateway)
- `POST /api/v1/ingestion/telemetry` — Ingest, validate, and persist multimodal node observations.

### Telemetry Queries & Analytics
- `GET /api/v1/telemetry/nodes/{id}/latest` — Latest sensor readings snapshot for a node.
- `GET /api/v1/telemetry/nodes/{id}/history` — Historical time-series readings with sensor & time filters.
- `GET /api/v1/telemetry/nodes/{id}/aggregate` — Window statistical aggregate (min, max, avg, count).

### Live Monitoring (WebSockets)
- `WS /api/v1/ws/telemetry` — Real-time telemetry, alert, and anomaly stream with node subscription filtering.

### Explainable Risk Engine
- `GET /api/v1/risk/nodes/{id}/latest` — Node-level explainable risk assessment with contributing factors.
- `GET /api/v1/risk/zones/{id}` — Operational zone risk rollup for the spatial Mine Risk Map.

### Safety Alerts
- `GET /api/v1/alerts/active` — List currently active alerts (supports node filtering).
- `GET /api/v1/alerts/history` — Query historical alerts with status, severity, and type filters.
- `POST /api/v1/alerts/{id}/resolve` — Manually resolve an active alert with operator resolution note.

### Configurable Safety Rules
- `GET /api/v1/rules/thresholds` / `POST /api/v1/rules/thresholds` — CRUD for sensor threshold rules.
- `GET /api/v1/rules/correlations` / `POST /api/v1/rules/correlations` — CRUD for multi-parameter joint rules.

### Assistive AI / Anomaly Detection
- `GET /api/v1/ai/nodes/{id}/latest` — Recent statistical anomaly evaluation records for a node.
- `GET /api/v1/ai/nodes/{id}/history` — Historical anomaly evaluation logs with anomaly/sensor filters.
- `GET /api/v1/ai/models` — Active assistive prototype model metadata and disclaimers.

### Dashboard Presentation APIs
- `GET /api/v1/mines` / `GET /api/v1/mines/{id}` — Monitored mine facilities with zone listings.
- `GET /api/v1/zones` / `GET /api/v1/zones/{id}` — Operational zones with constituent nodes.
- `GET /api/v1/nodes` / `GET /api/v1/nodes/{id}` — Integrated node configurations with mounted sensor suites.
- `GET /api/v1/dashboard/overview` — Consolidated operational snapshot (facility counts, node liveness, alert breakdown, zone risk rollups).

---

## 5. Local Setup & Execution

### 5.1 Local Virtualenv Run (SQLite)

1. **Clone the repository and create virtual environment**:
   ```powershell
   git clone <repo-url>
   cd "sih project"
   python -m venv .venv
   .venv\Scripts\activate
   ```

2. **Install application and development dependencies**:
   ```powershell
   pip install --upgrade pip
   pip install -e .[dev]
   ```

3. **Run database migrations**:
   ```powershell
   alembic upgrade head
   ```

4. **Seed synthetic demonstration data (Optional)**:
   ```powershell
   python scripts/seed_demo_data.py
   ```

5. **Start the ASGI server**:
   ```powershell
   uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Open `http://localhost:8000/docs` in your browser.

---

### 5.2 Containerized Run (Docker Compose with PostgreSQL)

1. **Build and launch services**:
   ```bash
   docker compose up --build -d
   ```
2. **Verify container health**:
   ```bash
   docker compose ps
   curl http://localhost:8000/api/v1/health/readiness
   ```
3. **Shutdown services**:
   ```bash
   docker compose down
   ```

---

## 6. Running Automated Tests

Run the complete test suite (109 tests across all 10 phases):
```powershell
pytest
```
To run tests with verbose test case listing:
```powershell
pytest -v
```

---

## 7. Anti-Hallucination Disclaimers

> [!WARNING]
> - **Synthetic Test & Demo Data**: All telemetry readings, sensor calibrations, and test rules provided in automated tests and `scripts/seed_demo_data.py` are **synthetic prototype test data**. They do not represent statutory safety limits or certified industrial sensor readings.
> - **Assistive AI Role**: The AI anomaly detection component is an unsupervised statistical baseline model. It does not replace deterministic safety rules, does not automate emergency shutdown, and does not claim certified accuracy.
> - **Open Decisions (TBD)**: User authentication mechanisms (BE-REQ-030), gateway transport security, and data retention policies remain intentionally deferred (**🟡 TBD**) per the Phase 0 requirements freeze.
