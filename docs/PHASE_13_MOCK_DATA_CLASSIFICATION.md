# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 13: Mock Data Source Classification Matrix

**Document Version**: 1.0  
**Status**: Authoritative Classification Baseline for Phase 13

In accordance with Phase 13 requirements, every mock data file and dataset under `frontend/src/data/mock/` is classified into one of three categories:
- 🟢 **READY TO REPLACE**: The backend provides the required real data, and Phase 12 has a verified API client and service layer for it.
- 🟡 **NOT READY**: The UI expects information that the backend currently does not provide. Missing contracts are explicitly documented; data must not be fabricated.
- 🔵 **UI-ONLY / STATIC**: Purely presentation content, design system metadata, or client-side UI configuration that does not require backend persistence.

---

## 1. Summary Classification by File

| Mock File | Major Datasets / Exports | Classification | Target Backend Endpoint(s) & Service | Notes / Gap Analysis |
| :--- | :--- | :--- | :--- | :--- |
| **`nodes.ts`** | `MAP_NODES` | 🟢 READY TO REPLACE | `GET /api/v1/nodes`<br>`nodesService.listNodes()` | Real node identifier, zone, status, last seen, and sensor counts are returned by backend. Spatial `xPct`/`yPct` coordinates are maintained in `nodeAdapter.ts`. |
| | `enrichNode()` | 🟡 NOT READY | None | Dynamic multi-parameter status badges derived locally. |
| | `generateNodeTrends()` | 🟡 NOT READY | `GET /api/v1/telemetry/nodes/{id}/history` | Backend provides historical telemetry per sensor, but not pre-computed 24h sparkline arrays for all node drawer parameters simultaneously. |
| **`alerts.ts`** | `RECENT_ALERTS` | 🟢 READY TO REPLACE | `GET /api/v1/alerts/active`<br>`alertsService.getActiveAlerts()` | Transformed into `DashboardAlert` via `adaptAlertResponseToDashboardAlert()`. |
| **`alertsCenter.ts`** | `MOCK_ALERTS` | 🟢 READY TO REPLACE | `GET /api/v1/alerts/active`<br>`GET /api/v1/alerts/history`<br>`POST /api/v1/alerts/{id}/resolve` | Active and historical alerts mapped to `MineAlert` via `adaptAlertResponseToMineAlert()`. Backend supports 2-tier severity (`WARNING`, `CRITICAL`) and 2-state status (`ACTIVE`, `RESOLVED`). |
| | `MOCK_ESCALATION_HISTORY` | 🟡 NOT READY | None | Backend records `triggered_at` and `resolved_at` timestamps only; multi-stage escalation logs are not implemented. |
| | `MOCK_AUDIT_LOG` | 🟡 NOT READY | None | Backend stores `operator_notes` upon resolution, but does not maintain a multi-actor audit trail. |
| | `MOCK_ALERT_PREFERENCES` | 🔵 UI-ONLY / STATIC | None | Local UI modal state for muting siren/desktop alerts; no backend user preference model exists. |
| **`dashboardTelemetry.ts`**| `DASHBOARD_METRICS` | 🟢 READY TO REPLACE | `GET /api/v1/dashboard/overview`<br>`dashboardService.getOverview()` | Live metrics derived from `active_nodes`, `total_nodes`, `unresponsive_nodes`, and active alert counts. |
| | `MINE_RISK_SUMMARY` | 🟢 READY TO REPLACE | `GET /api/v1/dashboard/overview`<br>`dashboardService.getOverview()` | Real-time composite mine risk score (0–100) derived via `calculateCompositeMineRiskScore(overview.zones_overview)`. |
| **`trends.ts`** | `NODE_N04_TRENDS` | 🟢 READY TO REPLACE | `GET /api/v1/telemetry/nodes/{id}/history`<br>`telemetryService.getHistory()` | Historical readings for `tilt`, `displacement`, `vibration`, `crack` mapped to `{ time, value }` data points. |
| | `RISK_SCORE_7D` | 🟡 NOT READY | `GET /api/v1/risk/nodes/{id}/latest` | Backend provides current risk evaluations and zone assessments, but no rolling 7-day daily risk trajectory history API. |
| **`trendsAnalysis.ts`** | `PARAMETER_CONFIGS` | 🔵 UI-ONLY / STATIC | None | UI configuration: parameter labels, hardware sensor names, thresholds, decimals, colors. |
| | `getTelemetryTimeSeries()` | 🟢 READY TO REPLACE | `GET /api/v1/telemetry/nodes/{id}/history`<br>`telemetryService.getHistory()` | Replaced by `adaptHistoryToTelemetryTimeSeries()` using real ISO timestamps and values. |
| | `ANOMALY_TIMELINE` | 🟢 READY TO REPLACE | `GET /api/v1/ai/nodes/{id}/history`<br>`aiService.getAnomalyHistory()` | Surfaces real statistical anomaly detections into `AnomalyTimeline`. |
| | `MULTI_SENSOR_CORRELATIONS` | 🔵 UI-ONLY / STATIC | None | Theoretical 5x5 correlation matrix illustrating multi-parameter geotechnical dependencies. |
| | `HISTORICAL_SHIFT_EVENTS` | 🟡 NOT READY | None | Shift logbooks and human shift handovers are not modeled in the Phase 0–10 backend. |
| | `ZONE_TREND_SUMMARIES` | 🟡 NOT READY | None | Spatial-temporal cluster comparisons across mine sectors are prototype presentation cards. |
| **`notifications.ts`** | `MOCK_NOTIFICATIONS` | 🟡 NOT READY | None | Backend does not implement an in-app operator notification feed API. |
| **`designSystemData.ts`** | Component showcases | 🔵 UI-ONLY / STATIC | None | Design-system documentation examples; purely static presentation content. |

---

## 2. Mock Fallback Policy

In compliance with Phase 13 Section 12 (**NO SILENT FALLBACK TO MOCK DATA**):
1. **Disabled by Default**: `VITE_ENABLE_MOCK_FALLBACK` is `false` by default in `src/api/config.ts`.
2. **Explicit Error States**: When the backend is offline or an endpoint fails, the UI displays real error banners, loading skeletons, and retry buttons rather than silently rendering fake data.
3. **Empty Data Integrity**: When the backend returns empty collections (`[]`), the UI presents clean `EmptyState` components instead of populating mock rows.
4. **Development Mode Only**: If an engineer explicitly enables `VITE_ENABLE_MOCK_FALLBACK=true` in local environment settings, the application renders unmistakable warning badges ("Simulated Fallback Active (Development Mode)") to guarantee full transparency.
