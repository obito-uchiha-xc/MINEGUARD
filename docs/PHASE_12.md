# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 12: Frontend API Client & Integration Foundation Documentation

**Document Version**: 1.0  
**Phase Status**: **COMPLETED** (Foundation established, verified, and test-covered)

---

## 1. Executive Summary & Objective

Phase 12 established a robust, centralized, type-safe frontend API integration layer connecting the React + TypeScript + Vite frontend with the FastAPI backend developed across Phases 0–10.

The implementation strictly respects the architectural separation:
```text
React Components (Pages / Visualizations)
       ↓
Domain Adapters (DTO to UI Model Transformations)
       ↓
API Services Layer (Resource-Specific Endpoints)
       ↓
HTTP API Client (Fetch + AbortController + Error Handling)
       ↓
Backend API (/api/v1/...)
       ↓
Database & Operational Safety Engines
```

> **NON-DESTRUCTIVE PHASE CONSTRAINTS STRICTLY OBSERVED**:
> - **Zero UI Redesign**: The existing visual components and layout were preserved untouched.
> - **No Global Mock Replacement**: Existing mock data files in `src/data/mock/` were retained. The current UI continues to function as before.
> - **Zero Backend Changes**: Backend logic, models, and endpoints were untouched; all 109 backend tests continue to pass.
> - **No Hallucinated Contracts**: Every service and DTO traces directly to actual FastAPI routes and Pydantic schemas.

---

## 2. API Client Architecture

### 2.1 Centralized HTTP Engine (`src/api/client.ts`)
- **Native Fetch Implementation**: Built on standard `fetch` with `AbortController` for timeout management.
- **Configurable Timeout**: Default 10,000ms, customizable via `VITE_API_TIMEOUT_MS` or per-request overrides.
- **Automatic Serialization**: Handles JSON payloads, FormData, and Blob requests transparently.
- **Query Parameter Serialization**: `buildQueryString` strips `undefined`, `null`, and empty values, encoding query parameters predictably.
- **Error Interception**: Automatically parses backend standardized error envelopes (`{ error: { code, message, details } }`).
- **Method Shortcuts**: `api.get()`, `api.post()`, `api.put()`, `api.delete()`.

### 2.2 Environment Configuration (`src/api/config.ts`)
- Configured via Vite environment variables with robust fallback detection:
  - `VITE_API_BASE_URL`: Base URL prefix (Default: `/api/v1`).
  - `VITE_API_TIMEOUT_MS`: Request timeout in milliseconds (Default: `10000`).
  - `VITE_WS_BASE_URL`: WebSocket URL for real-time telemetry (Default: `ws://localhost:8000/api/v1/ws/telemetry`).
- Dual-environment compatibility: Safely operates in Vite browser builds (using `import.meta.env`) and Node.js testing environments.
- Template provided in `frontend/.env.example`.
- Reverse proxy configured in `frontend/vite.config.ts`:
  ```typescript
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  }
  ```

### 2.3 Predictable Error Model (`src/api/errors.ts`)
- Custom `ApiError` class extending native `Error`:
  - `status`: HTTP status code (or `0` for network failures).
  - `code`: Categorical error code (`NETWORK_ERROR`, `TIMEOUT_ERROR`, `NOT_FOUND`, `VALIDATION_ERROR`, `SERVER_ERROR`, `HTTP_ERROR`).
  - `details`: Backend validation details or payload diagnostics.
  - `isNetworkError`: Boolean flag identifying transport-level drops.
  - `isTimeout`: Boolean flag identifying request timeouts.
- Helper utilities:
  - `isApiError(err)`: TypeScript type guard.
  - `getErrorMessage(err)`: Safe human-readable message extraction.
  - `parseApiErrorResponse(status, path, body)`: Maps backend error envelopes.

---

## 3. API Services Layer

Dedicated, typed service modules were created in `src/services/`, mapping 1-to-1 with actual backend endpoints:

| Service Module | Function | Target Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **`healthService`** | `checkHealth()` | `GET /health` | Backward-compatible runtime health check. |
| | `checkLiveness()` | `GET /health/liveness` | Process liveness probe. |
| | `checkReadiness()` | `GET /health/readiness` | Database connectivity readiness probe. |
| **`dashboardService`** | `getOverview()` | `GET /dashboard/overview` | Composite snapshot of mines, zones, nodes, and alerts. |
| **`minesService`** | `listMines()` | `GET /mines` | List all monitored mine facilities. |
| | `getMineDetail(id)` | `GET /mines/{id}` | Detailed facility record with operational zones. |
| **`zonesService`** | `listZones(mineId?)` | `GET /zones` | List zones with optional mine facility filter. |
| | `getZoneDetail(id)` | `GET /zones/{id}` | Detailed zone record with constituent nodes. |
| **`nodesService`** | `listNodes(params?)` | `GET /nodes` | List nodes with optional `zone_id` and `status` filters. |
| | `getNodeDetail(id)` | `GET /nodes/{node_identifier}` | Comprehensive node metadata and registered sensor list. |
| **`telemetryService`** | `getLatestReadings(id)` | `GET /telemetry/nodes/{id}/latest` | Most-recent sensor readings snapshot. |
| | `getHistory(id, params?)` | `GET /telemetry/nodes/{id}/history` | Time-bounded historical readings for a sensor type. |
| | `getWindowAggregate(id, params)` | `GET /telemetry/nodes/{id}/aggregate` | Window aggregations (`min`, `max`, `avg`, `count`). |
| **`alertsService`** | `getActiveAlerts()` | `GET /alerts/active` | All unresolved active safety alerts. |
| | `getAlertHistory(params?)` | `GET /alerts/history` | Paginated alert log with node/severity/status filters. |
| | `resolveAlert(id, data?)` | `POST /alerts/{id}/resolve` | Operator resolution with mandatory audit notes. |
| **`riskService`** | `getNodeRisk(id)` | `GET /risk/nodes/{id}/latest` | Explainable node risk level and contributing factors. |
| | `getZoneRisk(zoneId)` | `GET /risk/zones/{id}` | Aggregated worst-case zone risk summary. |
| **`aiService`** | `getLatestAnomalies(id)` | `GET /ai/nodes/{id}/latest` | Latest statistical anomaly detection evaluations. |
| | `getAnomalyHistory(id, params?)` | `GET /ai/nodes/{id}/history` | Historical anomaly detection records. |
| | `getModels()` | `GET /ai/models` | Active AI model metadata and parameters. |
| | `triggerEvaluation(id, data?)` | `POST /ai/nodes/{id}/evaluate` | On-demand anomaly evaluation trigger. |

---

## 4. Data Transformation Layer (Adapters)

To ensure UI components remain cleanly decoupled from API response shapes, explicit transformation adapters were created in `src/services/adapters/`:

1. **`telemetryAdapter.ts` (`adaptSensorReadingsToTelemetry`)**:
   - Pivots flat individual `SensorReadingResponse[]` records into the compound `GeotechnicalTelemetry` schema expected by the UI.
   - Computes composite 3D tilt resultant vector (`deltaTotalDeg`).
   - Flags gas anomalies when thresholds are exceeded.
2. **`alertAdapter.ts` (`adaptAlertResponseToMineAlert`)**:
   - Bridges the backend's 2-tier severity (`WARNING`, `CRITICAL`) and 2-state lifecycle (`ACTIVE`, `RESOLVED`) into the UI's 4-tier / 4-stage `MineAlert` structure.
   - Extracts contributing sensor badges from `context_data`.
   - Generates audit history entries from `created_at` and `resolved_at` timestamps.
3. **`nodeAdapter.ts` (`adaptNodeSummaryToMapNode`, `adaptNodeDetailToMapNode`)**:
   - Merges backend node metadata with spatial canvas coordinates (`xPct`, `yPct`).
   - Derives rich `SafetyStatus` by evaluating node connectivity combined with risk classification.
4. **`riskAdapter.ts` (`calculateCompositeMineRiskScore`, `deriveMineRiskStatus`)**:
   - Aggregates zone risk distributions into a normalized 0–100 mine-wide risk score.
   - Extracts human-readable risk indicator pills for UI drawers.

---

## 5. Timestamp & Date Handling (`src/utils/date.ts`)

- Backend timestamps are stored and transmitted in standard ISO-8601 UTC format.
- Dedicated parsing and display helpers:
  - `parseUtcTimestamp(isoString)`: Robust Date construction.
  - `formatUtcDisplay(isoString)`: Standardized `YYYY-MM-DD HH:mm:ss UTC` format.
  - `formatRelativeTime(isoString)`: Clean human-friendly relative durations (`just now`, `5m ago`, `2h ago`).
  - `toIsoUtcString(date)`: Serializes client dates for API query parameters.

---

## 6. Authentication Status

- 🟡 **TBD**: In accordance with Phase 0 decision `D-006`, user authentication is not implemented in the backend.
- The API client does not inject synthetic authentication headers.
- The application operates as an authorized geotechnical workstation console.

---

## 7. Live Monitoring Status

- 🟡 **DEFERRED**: Direct WebSocket subscription integration is deferred to Phase 13/14 as instructed.
- The WebSocket URL is configured (`VITE_WS_BASE_URL`), and the backend WebSocket at `/api/v1/ws/telemetry` is verified and ready for hook connection.

---

## 8. Mock Data Status

- **100% Preserved**: All mock datasets in `src/data/mock/` remain completely intact.
- Existing pages continue to render and simulate state normally.
- Mock replacement will occur on a controlled, page-by-page basis in subsequent phases.

---

## 9. Verification & Test Results

### 9.1 Frontend Unit & Integration Tests
- **Test Runner**: Node.js native test runner via `tsx` (`npm test`)
- **Test File**: `frontend/test/api-client.test.mjs`
- **Result**:
  ```text
  ▶ 1. API Query String Builder (1.16ms)
    ✔ returns empty string when no params are provided
    ✔ serializes valid parameters and skips null/undefined/empty string
  ▶ 2. Error Parsing & ApiError Model (0.75ms)
    ✔ correctly maps backend standard error envelope
    ✔ maps 404 status to NOT_FOUND
    ✔ maps 500 status to SERVER_ERROR
  ▶ 3. HTTP API Client Execution (68.74ms)
    ✔ executes successful GET request and parses JSON
    ✔ throws structured ApiError on HTTP 404
    ✔ handles network connection failures gracefully
    ✔ handles request timeout abort correctly
  ▶ 4. Data Transformation Adapters (0.89ms)
    ✔ telemetryAdapter transforms flat sensor readings into compound telemetry
    ✔ alertAdapter maps backend AlertResponse to UI MineAlert
    ✔ nodeAdapter creates valid MapNode and derives safety status
    ✔ riskAdapter calculates composite score and status accurately
  ▶ 5. UTC Timestamp Utilities (0.88ms)
    ✔ parses valid ISO string into Date
    ✔ formats UTC display correctly
    ✔ handles null/undefined gracefully
  ℹ tests 16, suites 5, pass 16, fail 0
  ```
- **Outcome**: 🟢 **PASS (16/16 tests passing, 0 failures)**

### 9.2 Frontend Linter Baseline
- **Command**: `npm run lint` (`oxlint`)
- **Result**: `Found 0 warnings and 0 errors. Finished in 48ms on 116 files with 116 rules.`
- **Outcome**: 🟢 **PASS (0 warnings, 0 errors)**

### 9.3 Frontend Production Build
- **Command**: `npm run build` (`tsc -b && vite build`)
- **Result**: `✓ 2411 modules transformed. Built in 419ms with zero errors.`
- **Outcome**: 🟢 **PASS (Clean production bundle generated in dist/)**

### 9.4 Backend Regression Suite
- **Command**: `pytest -q`
- **Result**: `109 passed, 6 warnings in 5.83s`
- **Outcome**: 🟢 **PASS (All 109 backend tests pass; zero regressions)**

---

## 10. Summary of Created & Modified Files

### Files Created:
1. `frontend/.env.example` — Environment configuration template.
2. `frontend/src/types/api.ts` — Comprehensive TypeScript DTO contracts for all backend schemas.
3. `frontend/src/api/config.ts` — Centralized API configuration (base URL, timeouts, WS).
4. `frontend/src/api/errors.ts` — Typed `ApiError` class and response parser.
5. `frontend/src/api/client.ts` — Core fetch-based HTTP API client with timeout and query builder.
6. `frontend/src/api/index.ts` — Barrel exports for API modules.
7. `frontend/src/services/healthService.ts` — Service for `/health` probes.
8. `frontend/src/services/dashboardService.ts` — Service for `/dashboard/overview`.
9. `frontend/src/services/minesService.ts` — Service for `/mines` endpoints.
10. `frontend/src/services/zonesService.ts` — Service for `/zones` endpoints.
11. `frontend/src/services/nodesService.ts` — Service for `/nodes` endpoints.
12. `frontend/src/services/telemetryService.ts` — Service for `/telemetry` endpoints.
13. `frontend/src/services/alertsService.ts` — Service for `/alerts` endpoints.
14. `frontend/src/services/riskService.ts` — Service for `/risk` endpoints.
15. `frontend/src/services/aiService.ts` — Service for `/ai` endpoints.
16. `frontend/src/services/index.ts` — Barrel exports for service modules.
17. `frontend/src/services/adapters/telemetryAdapter.ts` — Flat readings $\rightarrow$ `GeotechnicalTelemetry`.
18. `frontend/src/services/adapters/alertAdapter.ts` — `AlertResponse` $\rightarrow$ `MineAlert`.
19. `frontend/src/services/adapters/nodeAdapter.ts` — `NodeSummaryResponse` $\rightarrow$ `MapNode`.
20. `frontend/src/services/adapters/riskAdapter.ts` — Zone summaries $\rightarrow$ 0–100 risk index.
21. `frontend/src/services/adapters/index.ts` — Barrel exports for adapters.
22. `frontend/src/utils/date.ts` — UTC timestamp parsing and formatting.
23. `frontend/test/api-client.test.mjs` — Comprehensive 16-test suite.
24. `docs/PHASE_12.md` — Formal Phase 12 documentation.

### Files Modified:
1. `frontend/package.json` — Added `"test"` script (`npx tsx --test test/api-client.test.mjs`).
2. `frontend/vite.config.ts` — Added dev server proxy forwarding `/api` to `http://localhost:8000`.

---

## 11. Recommended Phase 13 Scope

With the API client and data adaptation foundation established, Phase 13 should focus on **Dashboard & Overview Integration**:
1. Connect `DashboardPage` to `dashboardService.getOverview()`.
2. Connect `RecentAlerts` widget to `alertsService.getActiveAlerts()`.
3. Wire KPI summary cards to live node counts and zone statuses.
4. Implement automatic graceful degradation: if backend is offline, display a clear status indicator ("Demo Mode — Backend Offline") and fall back to mock data.
