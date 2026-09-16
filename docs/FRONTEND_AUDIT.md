# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 11: Frontend Audit & Backend Integration Planning

**Document Version**: 1.0  
**Phase Status**: **COMPLETED (AUDIT & PLANNING ONLY)**  
**Audit Scope**: Complete inspection of the provided React + TypeScript + Vite frontend (`frontend/`) against the completed FastAPI backend (Phases 0–10).  
**Strict Anti-Hallucination Policy**: No code modifications, API connections, mock data replacements, or feature extensions are performed during Phase 11.

---

## 1. Executive Summary

Phase 11 conducted a comprehensive technical audit of the existing frontend codebase to establish an authoritative baseline for integration with the backend developed in Phases 0–10.

The frontend is a high-fidelity, production-grade geotechnical monitoring user interface built with **React 19, TypeScript 5.9, Vite 8, Tailwind CSS, Framer Motion, and Lucide React**. It provides a polished, interactive operational dashboard for slope stability monitoring in open-cast and underground mines.

### Key Audit Findings
1. **Current Decoupling**: The frontend operates entirely on local mock datasets (`src/data/`) and simulated timer loops (`setInterval`). It contains zero HTTP clients (`fetch` or `axios`), zero WebSocket connections, and zero environment variable bindings.
2. **Structural Compatibility**: The core domain abstractions (nodes, telemetry modalities, alerts, risk levels, and zone aggregations) closely parallel the backend data architecture developed across Phases 1–10.
3. **Primary Divergences**:
   - **Alerts**: Frontend models a 4-tier severity scale (`CRITICAL`, `HIGH_RISK`, `WARNING`, `INFO`) and a 4-state lifecycle (`NEW`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED`), whereas the backend strictly enforces a 2-tier severity (`WARNING`, `CRITICAL`) and a 2-state lifecycle (`ACTIVE`, `RESOLVED`).
   - **Telemetry Shape**: Frontend expects deeply nested compound objects (`tilt`, `gas`, `environment`), whereas the backend ingestion pipeline stores discrete, flat parameter readings per sensor type.
   - **Spatial Coordinates**: Frontend displays nodes on a 2D pit canvas using percentage coordinates (`xPct`, `yPct`); the backend tracks logical zones and node identifiers, without spatial coordinate columns.
   - **Composite Risk Score**: Frontend expects a single quantitative mine-wide risk score (0–100); the backend provides categorical per-node risk levels (`NORMAL`, `ELEVATED`, `HIGH`) and zone summaries.
4. **Codebase Health**: Automated quality checks (`oxlint` and `tsc -b && vite build`) passed with **0 errors and 0 warnings** across all 94 source files.

---

## 2. Frontend Architecture & Technology Stack

### 2.1 Core Dependencies & Libraries (`package.json`)
- **UI Framework**: React 19.2 (`react`, `react-dom`)
- **Language**: TypeScript 5.9 (`typescript`, `@types/react`)
- **Build Tool**: Vite 8.2 (`vite`, `@vitejs/plugin-react`)
- **Routing**: React Router DOM 7.13 (`react-router-dom`)
- **Styling**: Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`) with custom CSS utilities
- **Animation & Interaction**: Framer Motion 12.33, Lenis 1.3 (smooth scrolling)
- **Icons**: Lucide React 1.16
- **Linting**: Oxlint 1.55 (`oxlint`)

### 2.2 Directory Structure Analysis
```text
frontend/
├── dist/                     # Production build output (verified clean build)
├── public/                   # Static assets (favicons, SVGs)
├── src/
│   ├── assets/               # Local images and icons
│   ├── components/           # Reusable UI component library
│   │   ├── alerts/           # Alert drawers, resolution forms, preferences modals
│   │   ├── analytics/        # Geotechnical charts, failure mode visuals
│   │   ├── dashboard/        # KPI metric cards, mini-maps, risk gauges
│   │   ├── layout/           # AppShell, TopNav, Sidebar, TARP indicators
│   │   ├── map/              # InteractiveMineCanvas, NodeDetailsPanel, MapToolbar
│   │   ├── nodes/            # NodeTable, NodeDetailsDrawer, AddNodeModal
│   │   ├── reports/          # Report cards, export controls
│   │   ├── trends/           # Time-series charts, anomaly overlays, multi-sensor grids
│   │   └── ui/               # Base design system: Button, Badge, Card, Modal, Tooltip
│   ├── data/                 # Static mock data stores (25 nodes, alerts, trends, metrics)
│   ├── hooks/                # Custom utility hooks (theme, resize, local state)
│   ├── pages/                # 9 primary view controllers
│   ├── types/                # Domain type definitions (safety, telemetry, navigation)
│   ├── App.tsx               # Route declarations and shell wrapping
│   ├── index.css             # Design tokens, color ramps, glassmorphism utilities
│   └── main.tsx              # Application entrypoint
├── package.json
├── tsconfig.json             # Strict TypeScript configuration
└── vite.config.ts            # Vite build configuration (lacks API proxy)
```

---

## 3. Routing & Page Inventory

The frontend registers 10 routes inside `src/App.tsx`, all wrapped within the common layout `AppShell`:

| Route Path | View Component | Status / Role | Integration Feasibility |
| :--- | :--- | :--- | :--- |
| `/` | Redirect to `/dashboard` | Root entrypoint | 🟢 Direct client redirect |
| `/dashboard` | `DashboardPage` | Central operational command center | 🟢 High: Backed by `/dashboard/overview`, `/alerts/active`, `/telemetry` |
| `/live-map` | `LiveMapPage` | 2D pit map with interactive sensor nodes | 🟢 High: Backed by `/nodes`, `/telemetry/latest`, and WebSocket |
| `/nodes` | `NodesPage` | Comprehensive inventory table and node drilldown | 🟢 High: Backed by `/nodes`, `/nodes/{id}`, `/telemetry` |
| `/data-trends` | `DataTrendsPage` | Geotechnical time-series & sensor correlation | 🟢 High: Backed by `/telemetry/history` and `/telemetry/aggregate` |
| `/alerts` | `AlertsPage` | Multi-tier alert management & resolution | 🟢 High: Backed by `/alerts/active`, `/alerts/history`, `/resolve` |
| `/analytics` | `AnalyticsPage` | Geotechnical failure prediction & AI models | 🟡 Partial: Backed by `/ai/models` and `/ai/nodes/{id}`; advanced charts mock |
| `/reports` | `ReportsPage` | Safety audit and compliance report exports | 🟡 Client-Only: Backend has no report generation API |
| `/settings` | `SettingsPage` | LoRa network parameters and sensor limits | 🟡 Client-Only: Dynamic config persistence not implemented |
| `/users` | `UsersPage` | Shift personnel and safety officer roster | 🟡 Client-Only: User auth and personnel DB not in backend scope |

---

## 4. Mock Data Architecture & Current Data Consumption

The frontend currently derives all state from 7 primary mock data modules in `src/data/`:

1. **`nodes.ts` (23 KB)**:
   - Contains 25 pre-configured `MapNode` objects (`N01`–`N25`) situated across 4 zones (`Zone A`, `Zone B`, `Zone C`, `Zone D`) and 4 panels.
   - Embeds canvas coordinates (`xPct`: 12–88%, `yPct`: 18–82%), hardcoded Dhanbad GPS coordinates, hardware health (battery %, RSSI dBm), and baseline geotechnical readings.
   - Provides `enrichNode()` helper adding communication protocols (LoRa SF8/SF10) and anomaly flags.
2. **`alerts.ts` (1.5 KB)**:
   - Supplies 5 lightweight `DashboardAlert` items used exclusively by the Dashboard widget.
3. **`alertsCenter.ts` (28 KB)**:
   - Supplies 11 detailed `MineAlert` objects featuring multi-stage audit trails, correlation metrics, operator notes, and resolution histories.
4. **`dashboardTelemetry.ts` (3.8 KB)**:
   - Provides 6 executive KPI cards (Tilt Rate, Surface Displacement, Dynamic Vibration, Crack Progression, Ambient Temperature, Active Nodes).
   - Supplies `MINE_RISK_SUMMARY` with risk score 78, status `HIGH_RISK`, and 24h trend sparkline.
5. **`trends.ts` & `trendsAnalysis.ts` (18 KB)**:
   - Generates simulated multi-sensor time-series (1H, 6H, 24H, 7D, 30D intervals) with Gaussian jitter and trend curves for displacement, tilt, and vibration.
6. **`notifications.ts` (2.1 KB)**:
   - Supplies 5 mock broadcast notifications displayed in the header notification center.
7. **Simulated Real-Time Loop**:
   - `LiveMapPage.tsx` runs an internal `setInterval` every 12 seconds that applies random micro-jitter ($\pm 0.02^\circ$ tilt, $\pm 0.1$ mm displacement) to mimic live telemetry.

---

## 5. Backend Capabilities & Available APIs (Phases 0–10)

The backend exposes 22 fully tested, production-hardened REST and WebSocket endpoints:

### 5.1 System & Dashboard
- `GET /api/v1/system/health` $\rightarrow$ Database connectivity and system status.
- `GET /api/v1/dashboard/overview` $\rightarrow$ High-level counts (mines, zones, nodes, active, unresponsive, alerts) and zone risk summaries.

### 5.2 Mine & Zone Hierarchy
- `GET /api/v1/mines` & `GET /api/v1/mines/{id}` $\rightarrow$ Mine metadata and zone counts.
- `GET /api/v1/zones` & `GET /api/v1/zones/{id}` $\rightarrow$ Zone metadata, risk levels, and node associations.

### 5.3 Node Inventory & Sensors
- `GET /api/v1/nodes` $\rightarrow$ List of nodes with operational status (`ACTIVE`, `UNRESPONSIVE`), zone ID, last seen timestamp, and registered sensor counts.
- `GET /api/v1/nodes/{node_identifier}` $\rightarrow$ Detailed node record with registered sensor list (`sensor_type`, limits).

### 5.4 Telemetry & Aggregation
- `POST /api/v1/telemetry/ingest` $\rightarrow$ Gateway telemetry ingestion (batch or single).
- `GET /api/v1/telemetry/nodes/{node_identifier}/latest` $\rightarrow$ Most recent reading for every sensor on the node.
- `GET /api/v1/telemetry/nodes/{node_identifier}/history` $\rightarrow$ Time-bounded historical readings filtered by `sensor_type` (up to 1,000 records).
- `GET /api/v1/telemetry/nodes/{node_identifier}/aggregate` $\rightarrow$ Window aggregations (`avg`, `min`, `max`, `count`) over specified intervals.

### 5.5 Safety Rules & Alerts
- `GET /api/v1/alerts/active` $\rightarrow$ All currently unresolved alerts across all nodes.
- `GET /api/v1/alerts/history` $\rightarrow$ Paginated alert history with filters (`node_identifier`, `severity`, `status`).
- `POST /api/v1/alerts/{alert_id}/resolve` $\rightarrow$ Operator alert resolution with mandatory notes.
- `GET /api/v1/safety-rules` $\rightarrow$ Active threshold and multi-parameter correlation safety rules.

### 5.6 Risk Assessment & AI Insights
- `GET /api/v1/risk/nodes/{node_identifier}/latest` $\rightarrow$ Deterministic risk classification (`NORMAL`, `ELEVATED`, `HIGH`) with explainable factor breakdown.
- `GET /api/v1/risk/zones/{zone_id}` $\rightarrow$ Zone-level risk aggregation and active breach counts.
- `GET /api/v1/ai/nodes/{node_identifier}/latest` $\rightarrow$ Latest statistical anomaly detection records per sensor.
- `GET /api/v1/ai/nodes/{node_identifier}/history` $\rightarrow$ Historical anomaly records.
- `GET /api/v1/ai/models` $\rightarrow$ Active AI model metadata and inference parameters.

### 5.7 Live Telemetry Streaming
- `WS /api/v1/ws/telemetry` $\rightarrow$ Real-time WebSocket broadcasting ingested telemetry payloads to connected clients. Supports node-level subscription actions and periodic keepalive pings.

---

## 6. Data Contract & Schema Audit

### 6.1 Direct Contract Matches (🟢 SPEC / MATCH)
1. **Node Identification**: Both frontend and backend use string identifiers (e.g., `N01`, `N04`).
2. **Sensor Modalities**: Both systems support the 9 core modalities: displacement, vibration, crack width, tilt, temperature, humidity, pressure, methane ($CH_4$), and carbon monoxide ($CO$).
3. **Alert Resolution**: Frontend resolution workflow directly aligns with `POST /api/v1/alerts/{alert_id}/resolve`, accepting operator notes and updating status to resolved.
4. **Historical Telemetry Time-Series**: Backend `TelemetryHistoryResponse` provides timestamped floating-point values identical to what frontend charting components render.

### 6.2 Contract Divergences & Required Adapters (🔵 DECISION / ADAPTER)
1. **Node Operational Status**:
   - *Frontend*: 7 statuses (`NORMAL`, `WARNING`, `HIGH_RISK`, `CRITICAL`, `OFFLINE`, `LIVE`, `DELAYED`).
   - *Backend*: 2 binary connectivity statuses (`ACTIVE`, `UNRESPONSIVE`).
   - *Adapter*: Derive rich UI status by evaluating connectivity status combined with active alert severity and deterministic risk level.
2. **Alert Severity Scale**:
   - *Frontend*: 4 tiers (`CRITICAL`, `HIGH_RISK`, `WARNING`, `INFO`).
   - *Backend*: 2 tiers (`WARNING`, `CRITICAL`).
   - *Adapter*: Map `WARNING` $\rightarrow$ `WARNING`, `CRITICAL` $\rightarrow$ `CRITICAL`. Missing tiers do not break the UI.
3. **Alert State Lifecycle**:
   - *Frontend*: 4 states (`NEW`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED`).
   - *Backend*: 2 states (`ACTIVE`, `RESOLVED`).
   - *Adapter*: Map `ACTIVE` $\rightarrow$ `NEW`. Intermediate stages (`ACKNOWLEDGED`, `INVESTIGATING`) are held in client state or optimistic caching prior to final resolution.
4. **Telemetry Representation**:
   - *Frontend*: Nested compound object (`node.telemetry.tilt.pitchDeg`, `node.telemetry.gas.ch4Ppm`).
   - *Backend*: Flat list of readings: `[{ sensor_type: "tilt_pitch_deg", value: 1.2 }, { sensor_type: "methane_ppm", value: 250 }]`.
   - *Adapter*: Ingestion adapter pivots flat sensor records into the expected nested schema.
5. **Dashboard Aggregate Metrics**:
   - *Frontend*: Expects mine-wide averages (e.g., average surface displacement across all sensors).
   - *Backend*: `DashboardOverviewResponse` provides node counts and zone statuses.
   - *Adapter*: Compute averages on client from active node latest readings, or execute aggregate queries for high-priority nodes.

---

## 7. State Management & Live Streaming Audit

### 7.1 Current State Management
- State is predominantly localized inside page-level React hooks (`useState`, `useMemo`, `useCallback`).
- No global state container (Redux, Zustand, React Context) is currently used for data caching.
- Alert lifecycle mutations are handled entirely via local React state updates in `AlertsPage.tsx`.

### 7.2 Live Streaming Integration
- The backend features a real-time WebSocket server at `/api/v1/ws/telemetry`.
- The frontend currently uses an internal `setInterval` timer to simulate data fluctuation.
- **Integration Plan**: In Phase 12, a dedicated React hook (`useTelemetryWebSocket`) will connect to `/api/v1/ws/telemetry`, listen for real-time telemetry events, and dispatch updates into page-level or context state.

---

## 8. Quality Baseline (Lint & Build Assessment)

Both static analysis and production compilation were executed on the unmodified frontend:

### 8.1 Linter Results
```powershell
npm run lint
```
```text
> mineguard@0.0.0 lint
> oxlint

Found 0 warnings and 0 errors.
Finished in 54ms on 94 files with 116 rules using 16 threads.
```
**Status**: **PASS (0 errors, 0 warnings)**

### 8.2 Production Build Results
```powershell
npm run build
```
```text
> mineguard@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 2411 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.91 kB │ gzip:   0.50 kB
dist/assets/index-CARZRrUL.css  210.82 kB │ gzip:  28.72 kB
dist/assets/index-CguSvTib.js   723.96 kB │ gzip: 202.19 kB
✓ built in 394ms
```
**Status**: **PASS (0 errors, clean build produced)**

---

## 9. Missing Endpoints, Features & TBD Register

The following frontend features have no supporting backend endpoints in Phase 0–10 scope and must remain mock or client-side simulations:

1. **2D Canvas Node Coordinates**: No coordinate fields exist in backend database schema. Maintained as client-side layout registry (`nodeCoordinates.ts`).
2. **User Authentication & RBAC**: No login, token, or session endpoints exist in backend. Application functions as an authorized engineering console.
3. **Personnel & Shift Management (`/users`)**: No personnel or workforce database models exist.
4. **Dynamic Configuration (`/settings`)**: Radio frequencies, spreading factors, and safety threshold editing cannot be persisted to backend.
5. **Report Generation (`/reports`)**: No server-side PDF or compliance document generator exists. Handled via client-side CSV / text export.
6. **Geotechnical Kinematics & Failure Mode Models (`/analytics`)**: Saito creep curve and wedge/planar failure probability calculations remain prototype demonstration visuals.

---

## 10. Recommended Integration Strategy for Phase 12

When authorized to execute Phase 12, the integration should follow this structured, non-destructive path:

### Step 1: Network & Client Foundation
- Configure Vite proxy in `vite.config.ts` to seamlessly forward `/api` requests to `http://localhost:8000`.
- Create a lightweight, typed API client (`src/services/apiClient.ts`) with standardized error handling and timeout configurations.

### Step 2: Domain Adapter Layer
- Create `src/services/adapters/`:
  - `nodeAdapter.ts`: Transforms backend node responses into `MapNode` schema.
  - `telemetryAdapter.ts`: Pivots flat telemetry readings into `GeotechnicalTelemetry`.
  - `alertAdapter.ts`: Adapts 2-tier backend alerts into rich UI alerts.
  - `riskAdapter.ts`: Calculates composite UI risk scores from backend zone risk data.

### Step 3: Progressive Page Integration
- Connect pages in order of dependency and data availability:
  1. `DashboardPage`: Wire up `/dashboard/overview` and active alerts.
  2. `NodesPage`: Wire up `/nodes` and `/nodes/{node_identifier}`.
  3. `LiveMapPage`: Wire up node list with coordinate adapter and live WebSocket.
  4. `DataTrendsPage`: Wire up `/telemetry/nodes/{id}/history`.
  5. `AlertsPage`: Wire up `/alerts/active`, `/alerts/history`, and resolution endpoint.

### Step 4: Graceful Degradation & Dual-Mode Fallback
- Implement a backend health check on application startup. If the backend is unreachable or returns an error, gracefully fall back to local mock data and display an informative badge: *"Demo Mode — Backend Offline"*.

---

## 11. Verification & Pre-Integration Checklist

- [x] Unmodified frontend inspected across all 9 pages and supporting components.
- [x] All 7 mock data files indexed and schemas analyzed.
- [x] All 22 backend endpoints mapped against frontend consumption needs.
- [x] Linter baseline verified (`0 errors, 0 warnings`).
- [x] Production build baseline verified (`clean compilation in 394ms`).
- [x] Integration mapping matrix documented in `docs/FRONTEND_BACKEND_MAPPING.md`.
- [x] Unknowns and TBD register documented in `docs/FRONTEND_UNKNOWNs.md`.
- [x] Strict Phase 11 constraint observed: **Zero code modifications performed**.
