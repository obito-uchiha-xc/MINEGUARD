# SIH 2026 Integrated Mine Safety Monitoring System
## Register of Frontend Unknowns & Integration Gaps

**Document Version**: 4.0 (Phase 19 — Final Mock-Data Cleanup + Full Integration Testing)  
**Strict Anti-Hallucination Policy**: Every item listed below represents an unspecified parameter, an architectural divergence, or an unbacked frontend feature. Under Phase 13–19 rules, none of these may be assumed or invented without an explicit backend specification.

---

## 1. Physical & Spatial Modeling Unknowns

| Item / Feature | What Frontend Assumes | What Backend Provides | Classification & Status |
| :--- | :--- | :--- | :--- |
| **Node Canvas Coordinates (`xPct`, `yPct`)** | All nodes have fixed 2D canvas coordinates (`xPct`: 12–88%, `yPct`: 18–82%) relative to a mine pit SVG graphic. | Backend data model tracks `zone_id`, `node_identifier`, and sensor metadata, but contains no spatial coordinate fields. | 🟡 **TBD**: Coordinate mapping must be maintained as client-side layout registry or injected via static map layout configuration. |
| **Geographic Coordinates (`lat`, `lng`)** | Enriched nodes feature hardcoded latitude/longitude (offset around Dhanbad, Jharkhand: ~23.79°N, 86.43°E). | Backend schema contains no GIS coordinate columns. | 🟡 **TBD**: GIS coordinates are non-functional mock parameters; maintain as display-only simulation or omit from live API bindings. |
| **Pit / Bench / Sector Boundaries** | Interactive canvas displays SVG benches and pit geometry zones. | Backend groups nodes by `zone_id` and `zone_name`, with no polygonal geometry or SVG paths. | 🟡 **TBD**: Mine map visual backdrop remains a static frontend schematic representation. |

---

## 2. Telemetry & Sensor Modeling Unknowns

| Item / Feature | What Frontend Assumes | What Backend Provides | Classification & Status |
| :--- | :--- | :--- | :--- |
| **Compound Geotechnical Object** | Deeply nested structure: `tilt` (pitch/roll/yaw), `gas` (ch4/co/o2), `environment` (temp/humidity/pressure). | Flat independent sensor readings: each reading is `{ sensor_type, value, recorded_at }`. | 🔵 **DECISION / ADAPTER REQUIRED**: Frontend integration adapter must pivot and aggregate flat reading records into compound state objects. |
| **Derived Geotechnical Rates** | Displays `rateMmPerHour` for displacement and `expansionRateMmDay` for crack propagation. | Backend provides raw historical values and window aggregate averages (min, max, avg), but no pre-computed first-derivative rate metric. | 🔵 **DECISION / ADAPTER REQUIRED**: Compute simple rate of change over time windows on client, or display aggregate averages from `/telemetry/nodes/{id}/aggregate`. |
| **TARP Level Triggers** | Displays "TARP 3: Evacuation Protocol Active" banner referencing threshold triggers. | Backend generates `WARNING` and `CRITICAL` alerts; does not maintain a formal 4-level TARP (Trigger Action Response Plan) engine. | 🟡 **TBD**: TARP state in frontend can be dynamically inferred from active critical alert count or maintained as advisory UI indicator. |

---

## 3. Alert Lifecycle & Severity Unknowns

| Item / Feature | What Frontend Assumes | What Backend Provides | Classification & Status |
| :--- | :--- | :--- | :--- |
| **Alert Severity Scale** | 4-Tier: `CRITICAL`, `HIGH_RISK`, `WARNING`, `INFO` (with mixed casing in prototype). | 2-Tier: `WARNING`, `CRITICAL` (strictly typed in backend enum). | 🔵 **DECISION / ADAPTER REQUIRED**: Map backend `WARNING` $\rightarrow$ frontend `WARNING`, backend `CRITICAL` $\rightarrow$ frontend `CRITICAL`. Do not invent backend alerts for missing tiers. |
| **Alert Workflow Lifecycle** | 4-State: `NEW` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `RESOLVED`. | 2-State: `ACTIVE` $\rightarrow$ `RESOLVED` (persisted in database via `alerts` table). | 🔵 **DECISION / ADAPTER REQUIRED**: Backend `ACTIVE` maps to `NEW` in UI. Transition to `ACKNOWLEDGED` or `INVESTIGATING` is tracked in local UI state until final resolution via `POST /api/v1/alerts/{id}/resolve`. |
| **Alert Multi-Sensor Correlation Data** | Rich inline arrays for `contributingSensors`, `spatialCorrelation`, and `temporalProgression`. | Database stores triggering `condition_key` and JSON `context_data` dictionary with snapshot values. | 🔵 **DECISION / ADAPTER REQUIRED**: Adapter parses `context_data` key-value pairs to construct UI sensor correlation cards. |
| **Audit & Escalation Logs** | Full chronological arrays: `escalationHistory` and `auditHistory` with operator names. | Backend records `triggered_at`, `resolved_at`, and `operator_notes`. | 🔵 **DECISION / ADAPTER REQUIRED**: Construct basic audit trail from available timestamps and operator notes. Extended multi-party escalation logs remain synthetic. |

---

## 4. AI & Geotechnical Analytics Unknowns

| Item / Feature | What Frontend Assumes | What Backend Provides | Classification & Status |
| :--- | :--- | :--- | :--- |
| **Overall Mine Risk Score (0–100)** | Single numeric score (e.g., `78`) driving gauge widgets and 24h risk trend sparklines. | Categorical risk levels (`NORMAL`, `ELEVATED`, `HIGH`) per node and zone-level summaries. | 🔵 **DECISION / ADAPTER REQUIRED**: Synthesize composite index in frontend adapter using weighted zone distribution formula (documented in mapping matrix). |
| **Predictive Failure Modes** | Probabilities for Planar (62%), Wedge (24%), and Toppling (14%) slope failure mechanisms. | No geotechnical kinematics or rock mass failure classification models in backend. | 🟡 **TBD**: Must remain static demonstration visual on `/analytics` page. Explicitly mark as "Simulated Geotechnical Prototype". |
| **Saito Creep Inverse Velocity Model** | Dynamic $1/v$ vs. time curve estimating "Time to Failure: ~18 hours". | No tertiary creep curve fitting or Saito time-to-failure extrapolation algorithms in backend. | 🟡 **TBD**: Must remain static demonstration graphic. |
| **InSAR & Satellite Reconciliation** | Mentions Sentinel-1 / InSAR interferometric satellite fusion engine (v4.2). | Backend is purely in-situ IoT telemetry ingestion (Phases 1–7). No satellite data ingest pipeline. | 🟡 **TBD**: InSAR fusion remains conceptual mock interface. |

---

## 5. System Administration & RBAC Unknowns

| Item / Feature | What Frontend Assumes | What Backend Provides | Classification & Status |
| :--- | :--- | :--- | :--- |
| **User Authentication & Login** | AppShell has mock operator profile ("Vikram Sharma - Senior Geotech Lead"); no login gate. | No authentication, JWT, session, or OAuth2 endpoints implemented (D-006: Auth TBD). | 🟡 **TBD**: Application remains an authenticated-operator kiosk / demonstration mode with no login screen required. |
| **Personnel & Shift Management (`/users`)** | Full roster of 6 mining engineers with shift schedules, certifications, and active zones. | No personnel or HR database models exist in backend. | 🟡 **TBD**: Keep as read-only personnel directory populated from static prototype data. |
| **Dynamic Configuration Persistence (`/settings`)** | Ability to modify LoRa radio spreading factors, transmission frequencies, and safety thresholds. | Backend configuration is managed via environment variables (`.env`) and static safety rule initializers. | 🟡 **TBD**: Settings page UI allows local input adjustments with local confirmation; backend endpoints do not exist. |
| **Automated Report Generation (`/reports`)** | Generates PDF / CSV compliance reports on demand for DGMS / safety audits. | Backend has no PDF rendering engine, templating system, or compliance export endpoints. | 🟡 **TBD**: Maintain client-side data export (CSV / formatted text summary) generated from live state. |

---

## 6. Live Notification Architecture Unknowns

| Item / Feature | What Frontend Assumes | What Backend Provides | Classification & Status |
| :--- | :--- | :--- | :--- |
| **In-App Toast / Push Notifications** | Bell icon with unread notification badge counter and popup list. | Backend provides telemetry WebSocket stream (`/api/v1/ws/telemetry`); no dedicated notification channel. | 🔵 **DECISION / ADAPTER REQUIRED**: Derive in-app notifications directly from newly received WebSocket telemetry anomalies and newly active alert events. |

---

## 7. Phase 15 — Node & Map Integration Findings

| Item / Feature | What Frontend Previously Assumed | What Backend Actually Provides | Resolution in Phase 15 |
| :--- | :--- | :--- | :--- |
| **Node provisioning via HTTP POST** | `AddNodeModal` created in-memory nodes with `Math.random()` values | No `POST /api/v1/nodes` endpoint exists — nodes provision via LoRa gateway | ✅ **Fixed**: Modal replaced with informative notice explaining hardware provisioning |
| **Battery % per node** | `batteryPct` field populated (e.g. 94%, 87%) | Not in `NodeSummaryResponse` or `NodeDetailResponse` | ✅ **Fixed**: Displays `—` everywhere (labeled "Not monitored via API") |
| **LoRa RSSI/SNR per node** | `rssiDbm` field populated (e.g. -68, -84 dBm) | Not in backend schema | ✅ **Fixed**: Displays `—` everywhere (labeled "Not monitored via API") |
| **Per-chip sensor health (MPU6500, VL53L0X, etc.)** | Sensor Health section showed chip-level health badges | Backend tracks `sensor_type` strings and `is_active` flags — no chip-model metadata | ✅ **Fixed**: Sensor Health section shows actual `NodeDetailResponse.sensors` (type + active state) |
| **Fake Dhanbad GPS coordinates** | `enrichNode()` derived lat/lng from `xPct/yPct` offsets | Backend stores no geospatial columns | ✅ **Fixed**: GPS renders `—` (labeled "GPS not tracked by backend") |
| **Synthetic risk/anomaly indicators** | `enrichNode()` generated `riskIndicators[]` strings | Backend provides real `RiskAssessmentResponse.contributing_factors` | ✅ **Fixed**: Risk flag section shows node status directly; contributing factors available for future deep-integration |
| **Schematic mine map positions** | Frontend treated `xPct/yPct` as real geotechnical coordinates | Backend has no spatial coordinate schema | ✅ **Fixed**: Map header shows "Illustrative Schematic — Positions are approximate" disclaimer |
| **TARP exclusion banner hardcoded to N04** | Banner always showed N04-specific text regardless of real data | N04 is a demo identifier not guaranteed by backend | ✅ **Fixed**: Banner now only appears for real `CRITICAL` nodes from backend |

---

## 8. Phase 18 — AI & Authentication Integration Findings

| Item / Feature | What Frontend Previously Assumed | What Backend Actually Provides | Resolution in Phase 18 |
| :--- | :--- | :--- | :--- |
| **Slope Failure Mode Probabilities** | Displayed rotational crest slip (74%), planar slide (38%) | Backend provides unsupervised statistical anomaly detection (`StatisticalAnomalyDetector`, `MultiVariateAnomalyDetector`) | ✅ **Fixed**: Failure modes refactored to theoretical TARP reference cards with explicit disclaimers; fake percentages removed. |
| **Simulated Recalculation Timer** | `handleRunSimulation` ran 900ms `setTimeout` to mimic computation | Backend computes evaluations during ingestion | ✅ **Fixed**: Replaced with live refresh queries (`aiService.getModels()`, `aiService.getAnomalyHistory()`). |
| **Fake InSAR Reconciliation (0.92 R²)** | Displayed satellite radar correlation metrics | Backend has no satellite pipeline | ✅ **Fixed**: Removed; replaced with active model count and evaluation tally. |
| **Non-existent `/ai/nodes/{id}/evaluate`** | `aiService.ts` exposed `triggerEvaluation` | Backend does not expose on-demand POST evaluation endpoint | ✅ **Fixed**: Removed from `aiService.ts`. |
| **User Provisioning & Authentication** | `UsersPage.tsx` had "Register Personnel" popup; `UserDropdown.tsx` had session lock alert | Backend has no user models, JWT/session APIs, or RBAC (D-006: Auth TBD) | ✅ **Fixed**: Added AlertBanner in `UsersPage.tsx`, disabled registration button, removed browser alerts, labeled session as local demo. |


---

## 9. Phase 19 — Final Mock-Data Cleanup Findings

| Item / Feature | Phase 19 Resolution |
| :--- | :--- |
| **Mock notification data** (`MOCK_NOTIFICATIONS`) | ✅ **Removed**: `NotificationDropdown.tsx` and `TopBar.tsx` now use `alertsService.getActiveAlerts()` exclusively. |
| **Siren startup evaluation** (mock `MAP_NODES` in constructor) | ✅ **Removed**: `sirenAudio.ts` constructor no longer evaluates mock nodes; only real nodes/alerts trigger hazard evaluation. |
| **Random telemetry jitter** (`Math.random()` in `LiveMapPage.tsx`) | ✅ **Removed**: Live map displays raw backend telemetry values without artificial noise. |
| **MAP_NODES fallback** (on API error in `LiveMapPage.tsx`) | ✅ **Removed**: On backend failure, nodes reset to `[]` and a proper offline state is displayed. |
| **INITIAL_MINE_ALERTS fallback** (`AlertsPage.tsx`) | ✅ **Removed**: Shows empty state + error banner on API failure. |
| **Mock metric/node/alert fallbacks** (`DashboardPage.tsx`) | ✅ **Removed**: Clean empty states with error banners; "Simulated Mesh Active" badge removed. |
| **NODE_N04_TRENDS fallback** (`NodeParameterTrends.tsx`) | ✅ **Removed**: Shows "Awaiting live telemetry stream" when backend has no readings. |
| **RISK_SCORE_7D fallback** (`RiskScoreTrend.tsx`) | ✅ **Removed**: Shows "7-day rolling snapshot unavailable" (backend has no historical daily risk persistence). |
| **Browser alert() calls** (`ReportsPage.tsx`, `SettingsPage.tsx`) | ✅ **Removed**: Replaced with `AlertBanner` components indicating 🟡 TBD functionality. |
| **WebSocket Live Service** | ✅ **Added**: `liveService.ts` singleton with exponential backoff, event routing, and typed event dispatching. |
| **Unused dead mock file** (`designSystemData.ts`) | ✅ **Deleted**: 155-line unreferenced file removed. |
| **Lint warnings** (unused imports, set-state-in-effect) | ✅ **Fixed**: 3 lint warnings resolved; `oxlint` now reports 0 warnings, 0 errors on 116 files. |
