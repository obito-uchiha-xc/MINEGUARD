# SIH 2026 Integrated Mine Safety Monitoring System
## Frontend-Backend Integration Mapping Matrix

**Document Version**: 2.0 (Phase 19 — Final Integration Complete)  
**Status**: INTEGRATED — All phases (11–19) complete; application consuming real backend APIs.  
**Classification Guide**:
- 🟢 **MATCH**: Frontend expectation directly matches backend capability/schema with zero or minimal data transformation.
- 🔵 **ADAPTER REQUIRED**: Backend capability exists, but data shape, naming convention, or nesting requires a frontend adapter/transformation.
- 🟡 **BACKEND GAP / TBD**: Frontend feature expects data or operations not supported by the backend (remains mock or requires future backend expansion).

---

## 1. Route & Component Integration Matrix

| Route | Page Component | Primary Subcomponents | Backend API Endpoint(s) | Status | Key Transformation / Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `Navigate to /dashboard` | N/A | None | 🟢 MATCH | Client-side redirect; no backend call required. |
| `/dashboard` | `DashboardPage` | `MetricCard`<br>`CurrentMineRisk`<br>`LiveMineMap`<br>`RecentAlerts`<br>`RiskScoreTrend`<br>`NodeParameterTrends` | `GET /api/v1/dashboard/overview`<br>`GET /api/v1/alerts/active`<br>`GET /api/v1/nodes`<br>`GET /api/v1/telemetry/nodes/{id}/latest`<br>`WS /api/v1/ws/telemetry` | 🔵 ADAPTER REQUIRED | Overview API supplies counts and zone risks. Node-level telemetry must be queried per node or aggregated. Alert severity mapping (2-tier to 4-tier) needed. |
| `/live-map` | `LiveMapPage` | `InteractiveMineCanvas`<br>`NodeDetailsPanel`<br>`MapSummaryBar`<br>`MapToolbar`<br>`MapLegend` | `GET /api/v1/nodes`<br>`GET /api/v1/nodes/{id}`<br>`GET /api/v1/telemetry/nodes/{id}/latest`<br>`GET /api/v1/risk/nodes/{id}/latest`<br>`WS /api/v1/ws/telemetry` | 🔵 ADAPTER REQUIRED | `xPct`/`yPct` canvas coordinates do not exist in backend; must maintain layout metadata map. Sensor readings must be mapped from flat backend types to frontend nested structure. |
| `/nodes` | `NodesPage` | `NodeTable`<br>`NodeDetailsDrawer`<br>`AddNodeModal` | `GET /api/v1/nodes`<br>`GET /api/v1/nodes/{id}`<br>`GET /api/v1/telemetry/nodes/{id}/latest`<br>`GET /api/v1/risk/nodes/{id}/latest`<br>`POST /api/v1/nodes` (if admin) | 🔵 ADAPTER REQUIRED | Backend returns active/unresponsive status and sensor counts. Frontend displays rich status, risk score, and latest readings. `AddNodeModal` can hit node provisioning API or remain disabled. |
| `/data-trends` | `DataTrendsPage` | `TrendsFilterBar`<br>`TrendsSummaryCards`<br>`MainTelemetryChart`<br>`SecondaryAnalysis`<br>`MultiSensorAnalysis`<br>`AnomalyTimeline`<br>`TelemetryDataTable` | `GET /api/v1/nodes`<br>`GET /api/v1/telemetry/nodes/{id}/history`<br>`GET /api/v1/telemetry/nodes/{id}/aggregate`<br>`GET /api/v1/ai/nodes/{id}/history` | 🔵 ADAPTER REQUIRED | Backend history API requires `sensor_type` filter; frontend selects parameters (displacement, tilt, vibration). Time buckets (1H/6H/24H/7D/30D) map to ISO timestamps. |
| `/alerts` | `AlertsPage` | `AlertsCenter`<br>`AlertDetailsDrawer`<br>`AlertPreferencesModal` | `GET /api/v1/alerts/active`<br>`GET /api/v1/alerts/history`<br>`POST /api/v1/alerts/{id}/resolve` | 🔵 ADAPTER REQUIRED | Backend only supports ACTIVE and RESOLVED statuses. Frontend ACKNOWLEDGED / INVESTIGATING states must be adapted or mapped. Resolution endpoint requires operator notes. |
| `/analytics` | `AnalyticsPage` | `ModelDescriptors`<br>`NodeAnomalyInspector`<br>`KinematicCreepReference`<br>`FailureMechanismsReference` | `GET /api/v1/ai/models`<br>`GET /api/v1/ai/nodes/{id}/latest`<br>`GET /api/v1/ai/nodes/{id}/history` | 🟢 MATCH / 🔵 ADAPTER | Real model metadata and parameters (Z-score 3.0, window 30) loaded from `/ai/models`. Node Anomaly Inspector displays real evaluations from `/ai/nodes/{id}/history`. Kinematic failure modes and tertiary creep remain theoretical educational references with disclaimers. |
| `/reports` | `ReportsPage` | `ReportCard`<br>`GenerateReportModal` | None | 🟡 BACKEND GAP / TBD | Backend has no report generation or PDF export API. Kept as client-side mock export. |
| `/settings` | `SettingsPage` | `LoRaConfigForm`<br>`ThresholdConfigForm`<br>`SystemPreferences` | None (or read-only config) | 🟡 BACKEND GAP / TBD | Dynamic gateway/sensor configuration persistence is not in Phase 0–10 backend scope. Form remains local preview or read-only display. |
| `/users` | `UsersPage` | `PersonnelTable`<br>`ShiftSummary` | None (Auth D-006: TBD) | 🟡 BACKEND GAP / TBD | Backend does not implement user authentication or personnel RBAC (D-006: Auth TBD). Kept as static prototype roster with explicit AlertBanner and disabled provisioning actions. |

---

## 2. Schema Contract & Data Transformation Mapping

### 2.1 Node Identification & Status

| Field / Attribute | Frontend Expectation (`MapNode` / `safety.ts`) | Backend Reality (`NodeSummaryResponse` / `NodeDetailResponse`) | Mapping & Transformation Decision |
| :--- | :--- | :--- | :--- |
| **Node Identifier** | String (`N01` - `N25`) | String (`node_identifier`, e.g., `N01` or `NODE-001`) | 🟢 **MATCH**: Direct 1-to-1 match using `node_identifier`. |
| **Primary Key ID** | String or Implicit | Integer (`id`) | 🔵 **ADAPTER**: Store both backend numeric `id` and string `node_identifier` on node model. |
| **Operational Status** | `NORMAL`, `WARNING`, `HIGH_RISK`, `CRITICAL`, `OFFLINE`, `LIVE`, `DELAYED` | `ACTIVE`, `UNRESPONSIVE` | 🔵 **ADAPTER**: Derive composite status: If `status == UNRESPONSIVE` $\rightarrow$ `OFFLINE`. If `ACTIVE`, derive `NORMAL`/`WARNING`/`CRITICAL` from node's active alerts or risk level. |
| **Zone Mapping** | String `zone` ("Zone A", "North Wall") | Integer `zone_id`, String `zone_name` | 🔵 **ADAPTER**: Map backend `zone_name` directly to frontend `zone`. Grouping by `zone_id`. |
| **Canvas Coordinates** | `xPct` (0–100%), `yPct` (0–100%) | Not present in backend database | 🟡 **TBD**: Coordinate mapping configuration maintained in frontend layout registry (`nodeCoordinates.ts`) mapped by `node_identifier`. |
| **Geographic Coordinates** | `lat`, `lng` (WGS84) | Not present in backend database | 🟡 **TBD**: Hardcoded or client-configured geographic anchor offsets. |

---

### 2.2 Telemetry Ingestion & Representation

| Modality / Field | Frontend Model (`GeotechnicalTelemetry`) | Backend Ingestion & Storage (`TelemetryReadingResponse`) | Mapping & Transformation Strategy |
| :--- | :--- | :--- | :--- |
| **Tilt** | `{ pitchDeg: number, rollDeg: number, yawDeg?: number }` | Discrete `sensor_type`: `tilt_pitch_deg`, `tilt_roll_deg`, `tilt` | 🔵 **ADAPTER**: Reconstruct compound object by grouping latest readings for node matching tilt sensor types. |
| **Displacement** | `{ surfaceMm: number, depthMm?: number, rateMmPerHour: number }` | Discrete `sensor_type`: `displacement_mm`, `displacement` | 🔵 **ADAPTER**: Map `sensor_type="displacement"` $\rightarrow$ `surfaceMm`. Compute or extract `rateMmPerHour` from aggregates. |
| **Vibration** | `{ peakMmS: number, dominantHz?: number, axis: string }` | Discrete `sensor_type`: `vibration_peak_mms`, `vibration` | 🔵 **ADAPTER**: Map `sensor_type="vibration"` value to `peakMmS`. Default axis to Z/triaxial. |
| **Crack Width** | `{ widthMm: number, expansionRateMmDay?: number }` | Discrete `sensor_type`: `crack_width_mm`, `crack` | 🔵 **ADAPTER**: Map `sensor_type="crack"` or `crack_width_mm` to `widthMm`. |
| **Hazardous Gases** | `{ ch4Ppm: number, coPpm: number, o2Pct: number }` | Discrete `sensor_type`: `methane_ppm`, `carbon_monoxide_ppm`, `oxygen_pct` | 🔵 **ADAPTER**: Group gas readings under compound gas object. Format UI status string dynamically. |
| **Environment** | `{ temperatureC: number, relativeHumidityPct: number, pressureHpa: number }` | Discrete `sensor_type`: `temperature_c`, `humidity_pct`, `pressure_hpa` | 🔵 **ADAPTER**: Group environmental readings under compound environment object. |
| **Battery & RSSI** | `batteryPct: number`, `rssiDbm: number` | Discrete `sensor_type`: `battery_pct`, `rssi_dbm` | 🔵 **ADAPTER**: Map directly from latest system health readings. |

---

### 2.3 Alerting & Safety Lifecycle

| Concept / Field | Frontend Expectation (`MineAlert` / `alertsCenter.ts`) | Backend Reality (`AlertResponse` / `alerts.py`) | Mapping & Transformation Strategy |
| :--- | :--- | :--- | :--- |
| **Alert ID** | String (e.g., `ALT-2024-001`) | Integer (e.g., `1`, `42`) | 🔵 **ADAPTER**: Format backend numeric ID as `ALT-${id}` for display. |
| **Severity Scale** | 4-Tier: `CRITICAL`, `HIGH_RISK`, `WARNING`, `INFO` | 2-Tier: `WARNING`, `CRITICAL` | 🔵 **ADAPTER**: Backend `WARNING` $\rightarrow$ Frontend `WARNING`. Backend `CRITICAL` $\rightarrow$ Frontend `CRITICAL`. If AI risk is elevated without breach, synthesize `INFO`/`HIGH_RISK`. |
| **Status Lifecycle** | 4-State: `NEW`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED` | 2-State: `ACTIVE`, `RESOLVED` | 🔵 **ADAPTER**: Backend `ACTIVE` maps to `NEW` (or local optimistic `ACKNOWLEDGED`/`INVESTIGATING`). Backend `RESOLVED` maps to `RESOLVED`. |
| **Resolution API** | Local UI action with notes, operator name | `POST /api/v1/alerts/{id}/resolve` with `{ operator_notes: string }` | 🟢 **MATCH**: Direct mapping to resolution endpoint using alert numeric ID. |
| **Contributing Sensors** | Array of `{ sensorId, parameter, value, threshold, unit }` | String `condition_key`, JSON `context_data` (contains raw triggering values) | 🔵 **ADAPTER**: Parse `context_data` dictionary to construct frontend contributing sensor badges. |
| **Audit & Escalation History** | Rich object arrays (`escalationHistory`, `auditHistory`) | Timestamps: `triggered_at`, `resolved_at`, `created_at` | 🔵 **ADAPTER**: Generate baseline audit entries from `triggered_at` and `resolved_at`. Extended escalation history remains local/synthetic. |

---

### 2.4 Risk Assessment & AI Insights

| Dimension | Frontend Expectation (`MineRiskSummary`, `AiInstabilityAnalysis`) | Backend Reality (`RiskAssessmentResponse`, `AIAnomalyRecordResponse`) | Strategy |
| :--- | :--- | :--- | :--- |
| **Overall Mine Risk Score** | Integer: `0–100` (e.g., `78`) | No single composite mine score; per-node `risk_level` (`NORMAL`, `ELEVATED`, `HIGH`) and zone aggregates | 🔵 **ADAPTER**: Compute composite dashboard risk score in frontend adapter based on zone risk ratios: `Score = (highCount * 40 + elevatedCount * 20) / totalNodes * 100` clamped to 0–100. |
| **Risk Trend** | `Increasing`, `Stable`, `Decreasing` | Evaluation metadata list of contributing factors; no trend string | 🔵 **ADAPTER**: Compute trend by comparing current node risk level against recent 24h aggregate or historical assessments. |
| **AI Anomaly Detection** | `instabilityScore` (0–100), `deformationVelocity`, `spatialClusterAlert` | `is_anomaly: bool`, `confidence_score: float (0.0–1.0)`, `anomaly_type: str`, `metric_name: str` | 🔵 **ADAPTER**: Map `confidence_score * 100` to `modelConfidence`. Map `is_anomaly` flag to `spatialClusterAlert` / anomaly indicator. |
| **Failure Mode Prediction** | Probabilities for Planar, Wedge, Toppling (Analytics page) | Not implemented in backend (assistive statistical anomaly only) | 🟡 **TBD**: Keep mock failure mode display on `/analytics` page with "Prototype Demonstration Only" disclaimer. |

---

### 2.5 Live Streaming (WebSocket)

| Aspect | Frontend Current Implementation | Backend WebSocket Capability (`/api/v1/ws/telemetry`) | Strategy |
| :--- | :--- | :--- | :--- |
| **Transport** | None (fake `setInterval` jitter loop in `LiveMapPage.tsx`) | FastAPI Native WebSocket (`ws://localhost:8000/api/v1/ws/telemetry`) | 🔵 **ADAPTER**: Implement `useWebSocket` hook or central streaming service. On connect, listen for `event_type == "telemetry"` events and update global/page state. |
| **Subscription Filter** | N/A | Client sends `{"action": "subscribe", "node_identifier": "..."}` or receives global broadcast | 🟢 **MATCH**: Send node subscription on node selection or consume broadcast stream for global dashboard map. |
| **Heartbeat / Ping** | N/A | Server sends `{"event_type": "ping", "server_time": "..."}` every 30s | 🟢 **MATCH**: Respond with `{"action": "pong"}` or ignore harmless ping messages. |

---

## 3. Implementation Priorities for Phase 12 Integration

1. **Core API Client Foundation**:
   - Create typed `api/client.ts` with base URL configurable via `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'`.
   - Setup Vite reverse proxy in `vite.config.ts` (`/api` $\rightarrow$ `http://localhost:8000`).
2. **Adapter Layer**:
   - `adapters/nodeAdapter.ts`: Convert `NodeSummaryResponse` + latest telemetry to `MapNode`.
   - `adapters/telemetryAdapter.ts`: Group flat sensor readings into `GeotechnicalTelemetry`.
   - `adapters/alertAdapter.ts`: Convert `AlertResponse` to `MineAlert`.
   - `adapters/riskAdapter.ts`: Compute UI risk metrics from zone/node assessments.
   - `adapters/trendsAdapter.ts`: Map historical readings to telemetry time series and metrics.
3. **Live Streaming (Phase 19 Implemented)**:
   - `services/liveService.ts`: Singleton WebSocket client connecting to `/api/v1/ws/telemetry`.
   - Features: exponential backoff reconnect, typed event dispatching (`telemetry`, `alert`, `risk_update`, `anomaly`, `ping`), subscription message protocol, listener unsubscribe for memory safety.
4. **Graceful Degradation (Phase 19 Final State)**:
   - All mock fallbacks have been removed. On backend failure, pages display empty states with honest error banners.
   - No "Showing Simulated Data" fallback remains. Backend connectivity is required for real data; offline shows "Backend Unavailable" or equivalent empty states.
5. **Phase 19 Final Test Results**:
   - Frontend: 26 unit tests passing, 0 lint warnings, clean production build.
   - Backend: 109 tests passing, 0 regressions.

