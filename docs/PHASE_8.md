# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 8: Dashboard APIs Documentation

**Document Version**: 1.0  
**Phase Status**: **COMPLETED** (Hard Stop — Backend API Surface Ready for Future Dashboard UI)

---

## 1. Phase Objective

Build the complete backend **Dashboard API presentation layer** required by a future unified mine monitoring dashboard, exposing structured RESTful endpoints for:
1. **Mine Facilities** (`/mines`)
2. **Operational Mine Zones** (`/zones`)
3. **Integrated Field Nodes & Mounted Sensors** (`/nodes`)
4. **Dashboard Overview Snapshot** (`/dashboard/overview`)

The dashboard APIs are designed as a **clean presentation/facade layer** that strictly delegates to domain models and existing services (`RiskService`, `AlertService`, `TelemetryService`, `AIService`, and repositories) from Phases 1–7 without re-implementing or duplicating business logic.

---

## 2. Anti-Hallucination Statement

> **CRITICAL ARCHITECTURAL CONSTRAINTS**:
>
> - **NO Frontend UI Code**: No HTML, CSS, JavaScript, React, or frontend components are generated in this phase.
> - **NO New Safety/Risk Business Logic**: Dashboard APIs do not compute risk scores, adjust thresholds, or evaluate anomalies internally; all computation is delegated to `RiskService` and `AlertService`.
> - **NO Redundant Live Streaming Infrastructure**: Live monitoring for the dashboard reuses the existing WebSocket stream (`/api/v1/ws/telemetry`) established in Phase 5.
> - **NO Data Fabrication**: Missing sensor data returns empty lists/nulls. Missing nodes or facilities return standardized 404 error envelopes (`MINE_NOT_FOUND`, `ZONE_NOT_FOUND`, `NODE_NOT_FOUND`).
> - **Authentication Status**: BE-REQ-030 remains an open decision (**TBD** per D-006, D-023). Prototype endpoints remain unauthenticated without fabricated roles.

---

## 3. Endpoints Specification

### 3.1 Mine Facilities (`/api/v1/mines`)
* **`GET /api/v1/mines`**:
  - Lists all registered mine facilities with total operational zone counts.
  - Response: `List[MineSummaryResponse]`
* **`GET /api/v1/mines/{mine_id}`**:
  - Retrieves a specific mine facility including its list of constituent operational zones and their deployed node counts.
  - Response: `MineDetailResponse` (Raises 404 `MINE_NOT_FOUND` if absent).

### 3.2 Operational Zones (`/api/v1/zones`)
* **`GET /api/v1/zones`**:
  - Lists all operational mine zones across facilities.
  - Supports optional query filter: `mine_id` (e.g., `GET /api/v1/zones?mine_id=1`).
  - Response: `List[ZoneSummaryResponse]`
* **`GET /api/v1/zones/{zone_id}`**:
  - Retrieves operational zone details with its constituent deployed nodes and mounted sensor counts.
  - Response: `ZoneDetailResponse` (Raises 404 `ZONE_NOT_FOUND` if absent).

### 3.3 Integrated Nodes & Sensors (`/api/v1/nodes`)
* **`GET /api/v1/nodes`**:
  - Lists field-deployed nodes.
  - Supports optional query filters: `zone_id` and `status` (e.g., `GET /api/v1/nodes?zone_id=1&status=ACTIVE`).
  - Response: `List[NodeSummaryResponse]`
* **`GET /api/v1/nodes/{node_identifier}`**:
  - Retrieves comprehensive node configuration, parent zone name, status, `last_seen_at`, and full list of mounted sensors (`SensorInfoResponse`).
  - Response: `NodeDetailResponse` (Raises 404 `NODE_NOT_FOUND` if absent).

### 3.4 Dashboard Overview Snapshot (`/api/v1/dashboard/overview`)
* **`GET /api/v1/dashboard/overview`**:
  - Consolidated operational snapshot for dashboard home/executive views.
  - Returns:
    - Facility counts: `total_mines`, `total_zones`, `total_nodes`.
    - Node liveness metrics: `active_nodes`, `unresponsive_nodes` evaluated against `NODE_UNRESPONSIVE_TIMEOUT_S`.
    - Active safety alerts breakdown: `warning`, `critical`, `total`.
    - Spatial Mine Risk Map: `zones_overview` containing each zone's `highest_risk_level`, node liveness, and active alert counts via direct delegation to `RiskService.evaluate_zone_risk()`.
    - `snapshot_at`: UTC server timestamp.

---

## 4. Reused Capabilities from Phases 1–7

| Dashboard Need | Provided By | Method / Endpoint |
|---|---|---|
| Live telemetry & alerts streaming | Phase 5 WebSocket Broadcaster | `WS /api/v1/ws/telemetry` |
| Historical telemetry charting | Phase 4 Telemetry Query API | `GET /api/v1/telemetry/nodes/{id}/history` |
| Latest sensor readings snapshot | Phase 4 Telemetry Query API | `GET /api/v1/telemetry/nodes/{id}/latest` |
| Sensor window aggregation (min/max/avg) | Phase 4 Telemetry Repository | `GET /api/v1/telemetry/nodes/{id}/aggregate` |
| Explainable node risk assessment | Phase 6 Risk Engine | `GET /api/v1/risk/nodes/{id}/latest` |
| Zone spatial risk evaluation | Phase 6 Risk Engine | `GET /api/v1/risk/zones/{id}` |
| Active safety alert feed | Phase 6 Alert Engine | `GET /api/v1/alerts/active` |
| Alert history & audit log | Phase 6 Alert Engine | `GET /api/v1/alerts/history` |
| Manual alert resolution | Phase 6 Alert Engine | `POST /api/v1/alerts/{id}/resolve` |
| Threshold & correlation rule CRUD | Phase 6 Rule Engine | `GET/POST /api/v1/rules/*` |
| AI anomaly records & metadata | Phase 7 AI Service | `GET /api/v1/ai/*` |

---

## 5. Architectural Decisions (ADRs)

- **D-033**: Dashboard REST API Resource Hierarchy & Presentation Model (Mines, Zones, Nodes, mounted Sensors).
- **D-034**: Presentation Query Filtering & Navigation Conventions.
- **D-035**: Dashboard Overview Snapshot Aggregation Semantics.

---

## 6. Verification & Automated Test Suite

All Phase 8 endpoints are verified in `tests/test_dashboard_api.py`:
- `test_list_mines`: Facility listing and zone count aggregation.
- `test_get_mine_detail_and_404`: Mine detail with embedded zones and standard 404 envelope.
- `test_list_zones_and_filter`: Zone listing with `mine_id` query filtering.
- `test_get_zone_detail_and_404`: Zone detail with embedded nodes and standard 404 envelope.
- `test_list_nodes_and_filter`: Node listing with `zone_id` and `status` query filtering.
- `test_get_node_detail_and_404`: Node detail with mounted sensor capabilities and standard 404 envelope.
- `test_dashboard_overview`: Full operational snapshot verifying facility counts, node liveness breakdown, active alert severity breakdown, and zone risk summaries.

Regression Test Status: **93/93 passing** (100% test pass rate across all phases).
