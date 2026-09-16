# PHASE 14 — DASHBOARD INTEGRATION REPORT

**Integrated Mine Safety Monitoring System**
*Status: Completed*
*Integration Architecture: React + TypeScript (Vite) ↔ Phase 12 API Client / Services ↔ FastAPI Backend (Phases 0–10)*

---

## 1. Executive Summary

Phase 14 successfully connects the main Operations Dashboard (`DashboardPage`) and its constituent widgets to the completed Phase 0–10 FastAPI backend. The integration adheres strictly to the **"Same UI + Real Data"** principle, preserves the existing design tokens and visual hierarchy, and implements strict anti-hallucination rules:
- **No Synthetic Risk Scores**: The Phase 6 backend risk engine generates explainable categorical risk assessments (`NORMAL`, `ELEVATED`, `HIGH`) and contributing factors. The frontend consumes and presents these real categorical evaluations rather than calculating artificial black-box 0–100 numbers.
- **Real Sourcing for Dashboard Metrics**: Node fleet metrics connect to `GET /dashboard/overview`, while physical sensor metrics (`temperature`, `tilt`, `displacement`, `vibration`, `crack`) bind directly to verified live telemetry readings (`GET /telemetry/nodes/{id}/latest`) for the active node.
- **Zero Silent Fallback**: If the backend is unreachable or the database is unpopulated, the dashboard renders honest loading skeletons, explicit error banners with retry triggers, and clean empty states (`—` / `Awaiting Telemetry`). Fallback to mock data only occurs if `VITE_ENABLE_MOCK_FALLBACK=true` is explicitly configured.

---

## 2. Completed Components & Integrations

| Component | Status | Real Data Source | Primary Role |
| :--- | :--- | :--- | :--- |
| **`DashboardPage`** | 🟢 Fully Connected | `dashboardService.getOverview()`, `alertsService.getActiveAlerts()`, `nodesService.listNodes()`, `telemetryService.getLatestReadings()` | Master dashboard layout, state orchestration, manual polling trigger, node selection synchronization. |
| **`CurrentMineRisk`** | 🟢 Fully Connected | `ZoneRiskSummaryResponse[]` via `deriveFleetRiskLevel()`, `extractRiskIndicators()` | Displays backend worst-case fleet risk level (`NORMAL` / `ELEVATED` / `HIGH`), dynamic status badge, dynamic 4-tier segmented bar, and real explainable risk drivers. |
| **`LiveMineMap`** | 🟢 Fully Connected | `nodesService.listNodes()`, `ZoneRiskSummaryResponse[]` | Monitored node pins with live status (`ACTIVE` / `UNRESPONSIVE`), parent zone risk styling, and interactive inspection flyout. |
| **`MetricCard` (x6)** | 🟢 Fully Connected | `DashboardOverviewResponse` & `telemetryService.getLatestReadings(selectedNodeId)` | 6 KPI cards displaying live node counts and real physical sensor readings for the active node with clean empty states. |
| **`NodeParameterTrends`**| 🟢 Fully Connected | `telemetryService.getHistory(selectedNodeId)` | Multi-parameter mini-trend graphs displaying historical readings for tilt, displacement, vibration, and crack progression. |
| **`RecentAlerts`** | 🟢 Fully Connected | `alertsService.getActiveAlerts()` | Live safety alert cards from Phase 6 rules engine, severity indicators, and operator acknowledgment flow. |
| **`RiskScoreTrend`** | 🟢 Structurally Safe | Point-in-time status callout | Clean presentation acknowledging that 7-day rolling trajectory requires daily snapshot persistence (TBD in backend). |

---

## 3. Dashboard API Mapping

```text
Dashboard Component
       ↓
Frontend Service Layer (Phase 12)
       ↓
HTTP API Client (`src/api/client.ts`)
       ↓
Backend Endpoint (Phases 0–10)
       ↓
Backend DTO / Database
       ↓
Data Transformation Adapter
       ↓
React Presentation Component
```

### Detailed Mapping Table

| Dashboard Component | Frontend Service Method | Backend Endpoint | Backend DTO Response | UI Data Transformation |
| :--- | :--- | :--- | :--- | :--- |
| **Overview & Node Fleet Card** | `dashboardService.getOverview()` | `GET /api/v1/dashboard/overview` | `DashboardOverviewResponse` | `overview.active_nodes / overview.total_nodes`, `overview.unresponsive_nodes`, `overview.total_zones` |
| **Selected Node Physical Metrics** | `telemetryService.getLatestReadings(id)` | `GET /api/v1/telemetry/nodes/{id}/latest` | `LatestReadingsResponse` (`SensorReadingResponse[]`) | Matches sensor types (`tilt`, `displacement`, `vibration`, `crack`, `temperature`) to display live reading values and units. |
| **Current Mine Risk Panel** | `dashboardService.getOverview()` | `GET /api/v1/dashboard/overview` | `zones_overview: ZoneRiskSummaryResponse[]` | `deriveFleetRiskLevel()` (worst-case rollup), `mapRiskLevelToStatus()`, dynamic risk badge, dynamic active segment on bar. |
| **Primary Risk Drivers** | `dashboardService.getOverview()` | `GET /api/v1/dashboard/overview` | `ZoneRiskSummaryResponse[]` & `AlertSeverityCount` | Surfaces non-normal zones (`Zone: Assessed HIGH`) and active critical/warning alert counts. |
| **Live Mine Map Pins** | `nodesService.listNodes()` | `GET /api/v1/nodes/` | `NodeSummaryResponse[]` | `adaptNodeSummaryToMapNode()` combining node status (`ACTIVE`/`UNRESPONSIVE`) with schematic coordinates and zone risk. |
| **Recent Alerts Widget** | `alertsService.getActiveAlerts()` | `GET /api/v1/alerts/active` | `AlertResponse[]` | `adaptAlertResponseToDashboardAlert()` mapping backend severity (`CRITICAL`, `WARNING`) to UI alert cards. |
| **Parameter Trends Charts** | `telemetryService.getHistory(id)` | `GET /api/v1/telemetry/nodes/{id}/history` | `TelemetryHistoryResponse` | Filters readings by sensor type, formats UTC timestamps, and renders SVG area/stroke curves. |

---

## 4. Dashboard Metrics Classification

| Metric Card | Classification | Data Source | Behavior When Offline / Empty |
| :--- | :--- | :--- | :--- |
| **Active Nodes** (`nodes`) | 🟢 REAL | `DashboardOverviewResponse.active_nodes` / `total_nodes` | Displays `—` with `Offline` badge when backend is disconnected. |
| **Avg Tilt** (`tilt`) | 🟢 REAL | `telemetryService.getLatestReadings(selectedNodeId)` | Displays `—` with `Awaiting Reading` if node lacks tilt sensor or has no readings. |
| **Laser Displacement** (`displacement`) | 🟢 REAL | `telemetryService.getLatestReadings(selectedNodeId)` | Displays `—` with `Awaiting Reading` if no displacement reading. |
| **Vibration Velocity** (`vibration`) | 🟢 REAL | `telemetryService.getLatestReadings(selectedNodeId)` | Displays `—` with `Awaiting Reading` if no vibration reading. |
| **Crack Aperture** (`crack`) | 🟢 REAL | `telemetryService.getLatestReadings(selectedNodeId)` | Displays `—` with `Awaiting Reading` if no crack reading. |
| **Temperature** (`temperature`) | 🟢 REAL | `telemetryService.getLatestReadings(selectedNodeId)` | Displays `—` with `Awaiting Reading` if no temperature reading. |

> [!NOTE]
> **Fleet Average vs. Active Node Sourcing**: Backend Phase 4/5 exposes node-centric latest readings (`GET /telemetry/nodes/{id}/latest`). The backend does NOT compute fleet-wide arithmetic averages across all deployed nodes in real-time. Accordingly, the physical sensor metrics display the verified latest telemetry for the active/selected node (`Node NODE-JHR-01`), avoiding fabricated fleet-wide averages.

---

## 5. Remaining Mock Data

| File / Variable | Scope | Reason Remaining |
| :--- | :--- | :--- |
| `src/data/mock/dashboardTelemetry.ts` (`DASHBOARD_METRICS`, `MINE_RISK_SUMMARY`) | Dashboard fallback definitions | Retained exclusively as static structural fallback definitions when development mock fallback is explicitly enabled (`VITE_ENABLE_MOCK_FALLBACK=true`). Never shown silently in production. |
| `src/data/mock/nodes.ts` (`MAP_NODES`) | Coordinate schematic definitions | Provides 2D schematic pixel offsets `(xPct, yPct)` for visualization on the SVG underground drift canvas, as the backend node model does not store 2D GIS planar layout coordinates. |
| `src/data/mock/trends.ts` (`RISK_SCORE_7D`) | 7-day risk trajectory | Retained for simulated trajectory demonstration when fallback is active. In live mode, the UI honestly renders the point-in-time assessment status. |

---

## 6. Not Ready / TBD (Backend Capabilities)

1. **Fleet-Wide Telemetry Rollup / Averages**:
   - Backend provides `GET /telemetry/nodes/{id}/aggregate` per node and per sensor type, but does not provide a global endpoint such as `GET /telemetry/aggregate/fleet` computing instantaneous fleet averages across all sensors.
2. **2D/3D Geographic GIS Coordinates on Node Entity**:
   - `IntegratedNode` entity contains `id`, `zone_id`, `node_identifier`, `status`, and `last_seen_at`. Geographic planar coordinates `(x, y)` or GIS geometry are marked as TBD per Phase 0 specification.
3. **Daily Risk Snapshot Persistence (7-Day Rolling History)**:
   - Backend `RiskService` evaluates explainable node and zone risk dynamically upon query. It does not maintain an aggregated daily historical risk rollup table for multi-day trajectory curves.

---

## 7. Error & Loading Behavior

- **Loading States**:
  - `DashboardPage`: Initial mount uses an unmounted-safe asynchronous loading flow.
  - `RecentAlerts`: Renders 3 pulse-animated `LoadingSkeleton` card components during query execution.
  - `NodeParameterTrends`: Renders an awaiting state container with parameter icons until historical telemetry resolves.
- **Empty States**:
  - `RecentAlerts`: When 0 active alerts are returned, displays a green shield with `"All Sectors Clear • Zero active safety alerts"`.
  - `NodeParameterTrends`: If the selected node has no readings, renders `"Awaiting live telemetry"` without throwing or rendering NaN values.
  - `MetricCard`: Displays `"—"` with secondary caption `"Awaiting Reading"`.
- **Error States**:
  - If `GET /dashboard/overview` fails, an `AlertBanner` with `severity="critical"` is rendered at the top of the dashboard with a `"Retry Connection"` action button.
  - Failure of an individual widget (e.g. node latest readings) fails gracefully without unmounting or crashing sibling widgets.
  - Silent fallback to mock data is disabled by default.

---

## 8. Verification & Test Results

### 1. Frontend Test Suite
```bash
npm test
# npx tsx --test test/api-client.test.mjs
```
- **18 passed, 0 failed** across 5 test suites:
  - Query String Builder (2/2)
  - Error Parsing & ApiError Model (3/3)
  - HTTP API Client Execution (4/4)
  - Data Transformation Adapters (6/6 — including `deriveFleetRiskLevel`, `mapRiskLevelToStatus`, `extractRiskIndicators`)
  - UTC Timestamp Utilities (3/3)

### 2. Frontend Linter
```bash
npm run lint
# oxlint
```
- **0 errors, 0 warnings** across 117 files.

### 3. Frontend Production Build
```bash
npm run build
# tsc -b && vite build
```
- **Clean compilation** with zero TypeScript diagnostics.
- Production bundle emitted cleanly in `dist/`.

### 4. Backend Regression Test Suite
```bash
python -m pytest -q
```
- **109 passed, 0 failed, 6 warnings in 11.12s** (zero backend regressions).

---

## 9. Files Changed

- [`frontend/src/services/adapters/riskAdapter.ts`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/src/services/adapters/riskAdapter.ts) — Sourced worst-case fleet risk level, mapped categorical levels to UI status, and added explainable factor extraction.
- [`frontend/src/services/adapters/nodeAdapter.ts`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/src/services/adapters/nodeAdapter.ts) — Added coordinate schematic offsets for backend demonstration nodes (`NODE-JHR-01` through `NODE-RNJ-01`).
- [`frontend/src/components/dashboard/CurrentMineRisk.tsx`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/src/components/dashboard/CurrentMineRisk.tsx) — Made status badges, 4-tier segmented bar, and primary indicators fully dynamic and safe for missing historical rolling data.
- [`frontend/src/components/dashboard/RecentAlerts.tsx`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/src/components/dashboard/RecentAlerts.tsx) — Resolved memoization re-render warning with stable module reference.
- [`frontend/src/pages/DashboardPage.tsx`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/src/pages/DashboardPage.tsx) — Orchestrated real calls to overview, active alerts, node list, and active node latest telemetry; connected KPI cards and node selection.
- [`frontend/src/pages/AlertsPage.tsx`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/src/pages/AlertsPage.tsx) — Corrected AlertSeverity prop to `'critical'`.
- [`frontend/src/pages/DataTrendsPage.tsx`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/src/pages/DataTrendsPage.tsx) — Corrected AlertSeverity prop to `'critical'`.
- [`frontend/src/pages/LiveMapPage.tsx`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/src/pages/LiveMapPage.tsx) — Corrected AlertSeverity prop to `'critical'`.
- [`frontend/src/pages/NodesPage.tsx`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/src/pages/NodesPage.tsx) — Corrected AlertSeverity prop to `'critical'`.
- [`frontend/test/api-client.test.mjs`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/test/api-client.test.mjs) — Added unit tests for Phase 14 risk adapter methods.
- [`docs/PHASE_14.md`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/docs/PHASE_14.md) — Comprehensive integration and audit report.

