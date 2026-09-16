# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 13: Replace Mock Data with Real Backend Data Documentation

**Document Version**: 2.0  
**Phase Status**: **COMPLETED** (Core domain migrations implemented, verified, test-covered, and documented)

---

## 1. Phase Summary & Primary Objective

**Phase**: Phase 13 — Replace Mock Data with Real Backend Data  
**Primary Objective**: Systematically migrate the React + TypeScript frontend from static mock datasets to real, live FastAPI backend APIs through the Phase 12 type-safe API client and domain service layer.

The migration preserves existing visual hierarchy, styles, and interactive states ("Same UI + Real Data"), avoids inventing missing backend data, enforces a strict **No Silent Mock Fallback** policy, and guarantees graceful offline/error handling.

```text
React Pages & Visualizations (Dashboard, Live Map, Nodes, Alerts, Data Trends, Analytics)
       ↓
Domain Adapters (`src/services/adapters/`)
  - nodeAdapter: NodeSummaryResponse / NodeDetailResponse → MapNode
  - alertAdapter: AlertResponse → MineAlert / DashboardAlert
  - riskAdapter: ZoneRiskSummaryResponse[] → Composite Risk Score (0–100) & Qualitative Tier
  - telemetryAdapter: SensorReadingResponse[] → GeotechnicalTelemetry
  - trendsAdapter: SensorReadingResponse[] → TelemetryPoint[] & ParameterMetrics
       ↓
Centralized API Services (`src/services/`)
  - nodesService, alertsService, dashboardService, telemetryService, aiService, minesService, zonesService
       ↓
HTTP API Client (`src/api/client.ts`)
       ↓
FastAPI Backend Endpoints (`/api/v1/...`)
       ↓
Database & Operational Engines (SQLite / PostgreSQL)
```

---

## 2. Completed Domains & Features

The following frontend areas have been successfully connected to real backend endpoints:

1. **Integrated Node Inventory & Fleet (`NodesPage.tsx`)**:
   - Fetches live registered nodes from `nodesService.listNodes()`.
   - Displays real backend node identifiers (`NODE-JHR-01`, `NODE-JHR-02`, etc.), operational status (`ACTIVE`, `UNRESPONSIVE`), and last-seen timestamps.
   - Live status badge, manual polling trigger ("Refresh"), and empty state display when no nodes match filters.

2. **Live Mine GIS Map (`LiveMapPage.tsx`)**:
   - Queries `nodesService.listNodes()` and transforms records to spatial `MapNode` entities using predefined layout coordinates in `nodeAdapter.ts`.
   - Header badge reflects live backend connectivity (`LIVE: Backend Connected`).
   - "Poll Mesh" action allows operators to refresh sensor node status on demand.

3. **Active Alerts & Lifecycle Management (`AlertsPage.tsx`)**:
   - Queries active safety alerts from `alertsService.getActiveAlerts()`.
   - Queries historical alert logs from `alertsService.getAlertHistory({ limit: 50 })`.
   - Wires the operator resolution endpoint (`alertsService.resolveAlert(id, notes)`), sending `POST /api/v1/alerts/{id}/resolve` with operator notes.
   - Maps 2-tier backend alert severity (`WARNING`, `CRITICAL`) to the UI's 4-tier safety scale via `alertAdapter.ts`.

4. **Operations Dashboard (`DashboardPage.tsx`)**:
   - Concurrently fetches `dashboardService.getOverview()`, `alertsService.getActiveAlerts()`, and `nodesService.listNodes()`.
   - Maps facility metrics (`active_nodes`, `total_nodes`, `unresponsive_nodes`, `alerts.critical`, `alerts.warning`) directly into executive `MetricCard` components.
   - Dynamically calculates overall mine risk score (0–100) and qualitative safety tier from live zone assessments via `calculateCompositeMineRiskScore(overview.zones_overview)`.
   - Connects live alerts to `RecentAlerts.tsx` and node telemetry to `NodeParameterTrends.tsx`.

5. **Historical Telemetry & Analytical Trends (`DataTrendsPage.tsx`)**:
   - Populates node filter dropdown with live registered nodes from `nodesService.listNodes()`.
   - Maps UI sensor parameters (`displacement`, `tilt`, `vibration`, `crackWidth`, `soilMoisture`, `gas`, `temperature`) to backend schema sensor types via `mapParameterKeyToSensorType()`.
   - Converts UI time range tabs (`1H`, `6H`, `24H`, `7D`, `30D`) into ISO UTC boundary timestamps via `getTimeRangeDateBounds()`.
   - Queries `telemetryService.getHistory(nodeIdentifier, { sensor_type, from_dt, to_dt, limit: 250 })`.
   - Calculates baseline averages, delta deviations, rate of change (velocity per hour), and acceleration from raw sensor readings via `trendsAdapter.ts`.
   - Ingests real AI anomaly detection records via `aiService.getAnomalyHistory()` and renders them into `AnomalyTimeline.tsx`.

6. **Node Parameter Trends Dashboard Widget (`NodeParameterTrends.tsx`)**:
   - Queries `telemetryService.getHistory(selectedNodeId, { limit: 100 })` for tilt, displacement, vibration, and crack width.
   - Renders live time-series curves when readings exist; shows honest "Awaiting live telemetry" empty state when no readings have been ingested.

---

## 3. Partially Completed Domains

The following areas have real backend connectivity established, but display partial synthetic context due to backend architectural scope boundaries:

1. **Dashboard 7-Day Risk Score Trajectory (`RiskScoreTrend.tsx`)**:
   - Backend evaluates real-time risk per node and zone (`/risk/nodes/{id}/latest` and `/dashboard/overview`), but does not maintain a rolling 7-day daily risk snapshot table.
   - Component displays live overview risk in the header and an honest status explanation in the 7-day bar chart area when historical daily snapshots are not persisted.

2. **Spatial Mine Coordinates (`InteractiveMineCanvas.tsx`)**:
   - Backend models nodes by `zone_id`, `zone_name`, and facility hierarchy, but does not store 2D/3D GIS coordinates or pit polygon vectors.
   - `nodeAdapter.ts` maintains a clean coordinate layout registry mapping node identifiers to normalized canvas percentages (`xPct`, `yPct`).

3. **Multi-Parameter Normalization (`getNormalizedComparisonSeries`)**:
   - Real history is fetched for the primary selected parameter; multi-parameter normalized overlay defaults to normalized baseline comparison when secondary sensor streams are unpopulated.

---

## 4. Not Ready (Blocked by Missing Backend Contracts)

In strict compliance with the project's anti-hallucination rules, the following UI features remain static or disconnected because the backend does not provide corresponding APIs:

1. **Kinematic Geotechnical Failure Mode Probabilities (`AnalyticsPage.tsx`)**:
   - The UI features cards for Planar, Wedge, and Rotational failure probabilities.
   - Backend Phase 6 implements unsupervised statistical anomaly detection (Z-Score, IQR, Isolation Forest), not rock mass kinematic modeling.
   - **Status**: Retained as demonstrative presentation visuals with an explicit "Assistive AI & Kinematic Model Architecture" disclaimer banner.

2. **Operator Personnel & Shift Handover Roster (`UsersPage.tsx`)**:
   - Backend does not implement user authentication, RBAC, or shift rosters (Decision D-006: Auth TBD).
   - **Status**: Retained as a static prototype directory.

3. **Dynamic Radio & Sensor Hardware Configuration (`SettingsPage.tsx`)**:
   - LoRa spreading factors, transmission frequencies, and hardware settings are managed via backend `.env` variables and firmware initializers, not REST mutation APIs.
   - **Status**: Retained as local preview form with no backend write operations.

4. **Compliance Audit PDF Export (`ReportsPage.tsx`)**:
   - Backend has no headless PDF rendering engine or DGMS reporting templates.
   - **Status**: Retained as client-side CSV / formatted export.

5. **In-App Push Notification Inbox (`NotificationDropdown.tsx`)**:
   - Backend does not implement an in-app notification inbox model; real-time notifications are designed for WebSocket streaming.
   - **Status**: Displays static prototype notifications.

---

## 5. Mock Data Remaining & Justification

| Mock File / Export | Justification for Retention |
| :--- | :--- |
| `src/data/mock/designSystemData.ts` | Purely static component showcase and design token documentation; requires no backend. |
| `src/data/mock/notifications.ts` | Prototype UI notification popover items; no backend notification inbox endpoint exists. |
| `src/data/mock/trendsAnalysis.ts` (`PARAMETER_CONFIGS`, `MULTI_SENSOR_CORRELATIONS`) | Sensor display labels, threshold color variables, unit symbols, and theoretical 5x5 correlation matrix. |
| `src/data/mock/nodes.ts` (`MAP_NODES`) | Retained as fallback dataset for development mode (`VITE_ENABLE_MOCK_FALLBACK=true`). Unused in production mode. |
| `src/data/mock/alerts.ts` & `alertsCenter.ts` | Retained as development-only fallback dataset when `VITE_ENABLE_MOCK_FALLBACK=true`. |
| `src/data/mock/dashboardTelemetry.ts` | Retained as development-only fallback dataset when `VITE_ENABLE_MOCK_FALLBACK=true`. |

---

## 6. End-to-End API Mapping Matrix

| Frontend Feature | API Service Module | Backend Endpoint | Request / Response Types |
| :--- | :--- | :--- | :--- |
| **Node List & Health** | `nodesService.listNodes()` | `GET /api/v1/nodes` | `NodeListParams` $\rightarrow$ `NodeSummaryResponse[]` |
| **Node Full Profile** | `nodesService.getNodeDetail()` | `GET /api/v1/nodes/{id}` | `node_identifier: string` $\rightarrow$ `NodeDetailResponse` |
| **Operations Overview** | `dashboardService.getOverview()` | `GET /api/v1/dashboard/overview` | None $\rightarrow$ `DashboardOverviewResponse` |
| **Active Alerts Stream** | `alertsService.getActiveAlerts()` | `GET /api/v1/alerts/active` | None $\rightarrow$ `AlertResponse[]` |
| **Alert Log History** | `alertsService.getAlertHistory()` | `GET /api/v1/alerts/history` | `AlertHistoryParams` $\rightarrow$ `AlertResponse[]` |
| **Alert Resolution** | `alertsService.resolveAlert()` | `POST /api/v1/alerts/{id}/resolve` | `AlertResolveRequest` $\rightarrow$ `AlertResponse` |
| **Sensor Latest Snapshot** | `telemetryService.getLatestReadings()` | `GET /api/v1/telemetry/nodes/{id}/latest` | `node_identifier: string` $\rightarrow$ `LatestReadingsResponse` |
| **Historical Telemetry** | `telemetryService.getHistory()` | `GET /api/v1/telemetry/nodes/{id}/history` | `TelemetryHistoryParams` $\rightarrow$ `TelemetryHistoryResponse` |
| **Telemetry Aggregates** | `telemetryService.getWindowAggregate()` | `GET /api/v1/telemetry/nodes/{id}/aggregate` | `WindowAggregateParams` $\rightarrow$ `WindowAggregateResponse` |
| **AI Anomaly Records** | `aiService.getAnomalyHistory()` | `GET /api/v1/ai/nodes/{id}/history` | `AIAnomalyHistoryParams` $\rightarrow$ `AIAnomalyRecordResponse[]` |
| **AI Model Catalog** | `aiService.getModels()` | `GET /api/v1/ai/models` | None $\rightarrow$ `ModelMetadataResponse[]` |
| **Mine Facilities** | `minesService.listMines()` | `GET /api/v1/mines` | None $\rightarrow$ `MineResponse[]` |
| **Operational Zones** | `zonesService.listZones()` | `GET /api/v1/zones` | `mine_id?: number` $\rightarrow$ `ZoneResponse[]` |

---

## 7. Mock Data Policy & Offline Resilience

In accordance with Phase 13 Section 12 (**NO SILENT FALLBACK TO MOCK DATA**):

1. **Disabled by Default**:
   - `VITE_ENABLE_MOCK_FALLBACK` is strictly `false` by default in `src/api/config.ts`.
   - When the backend is offline or an endpoint fails, components show genuine error states (`severity="error"` in `AlertBanner`), clear error descriptions, and retry action buttons.
   - Empty collections (`[]`) render existing `EmptyState` components rather than silently populating mock data.

2. **Controlled Development-Only Fallback**:
   - If an engineer explicitly sets `VITE_ENABLE_MOCK_FALLBACK=true` in `.env`, components fall back to demonstration mock data to facilitate local UI design adjustments.
   - Whenever mock fallback is active, banners and badges unmistakably identify the state: `"Simulated Demonstration Data (Development Fallback Mode)"`.

---

## 8. Testing & Quality Verification

### 8.1 Frontend Test Suite
Executed with Node.js built-in test runner (`npm test` / `npx tsx --test test/api-client.test.mjs`):
- **18 tests passing, 0 failing across 5 test suites**:
  1. API Query String Builder (2 tests passed)
  2. Error Parsing & ApiError Model (3 tests passed)
  3. HTTP API Client Execution (4 tests passed)
  4. Data Transformation Adapters (6 tests passed, including `trendsAdapter`)
  5. UTC Timestamp Utilities (3 tests passed)

### 8.2 Frontend Static Analysis & Linter
- **Command**: `npm run lint` (`oxlint`)
- **Result**: `0 warnings, 0 errors` across 117 files.

### 8.3 TypeScript Compilation & Production Bundle
- **Command**: `npm run build` (`tsc -b && vite build`)
- **Result**: `✓ built in 675ms cleanly into dist/`. Zero type errors.

### 8.4 Backend Regression Suite
- **Command**: `python -m pytest -q`
- **Result**: `109 passed, 6 warnings in 6.31s` (100% pass rate across all 10 backend phases).

---

## 9. Known Limitations

1. **Historical Risk Trajectory**: Backend evaluates current risk scores per zone, but does not provide historical daily risk aggregation rollups (`RISK_SCORE_7D`).
2. **Spatial Topology**: Node coordinates (`xPct`, `yPct`) are maintained in the frontend layout adapter rather than the backend database schema.
3. **Kinematic Geotechnical Models**: Failure mode probabilities on `/analytics` remain demonstrative visuals; backend AI provides statistical anomaly scoring only.
4. **Shift Handover Logs**: Shift notes and operational shift logbooks are not implemented in the backend database.
