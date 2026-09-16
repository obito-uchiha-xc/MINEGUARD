# SIH 2026 Integrated Mine Safety Monitoring System
## Requirements Traceability Matrix (RTM)

**Document Version**: 1.0 (Phase 0 Baseline)  
**Traceability Flow**: Project Statement $\rightarrow$ Backend Requirement $\rightarrow$ Future Module $\rightarrow$ Future Component / Endpoint $\rightarrow$ Future Verification Test

---

| Project Overview Source | Backend Req ID | Requirement Statement | Implemented Component (Phase 2) | Future Module / Endpoint | Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sec. 1, 5 (pp. 1, 4)** | `BE-REQ-001` | Multi-node telemetry ingestion | Ingestion Pipeline & Schemas | `POST /api/v1/ingestion/telemetry` | `test_valid_telemetry_ingestion` |
| **Sec. 1, 6 (pp. 1, 4)** | `BE-REQ-002` | Mother System gateway bridge reception | HTTP Ingestion Adapter | `POST /api/v1/ingestion/telemetry` | `test_full_multimodal_mock_frame_ingestion` |
| **Sec. 6, 7 (pp. 4, 5)** | `BE-REQ-003` | Node unique identification | `IntegratedNode.node_identifier` (Unique Index) | Node Registry Service | `test_node_identifier_unique_constraint`, `test_unknown_node_rejection` |
| **Sec. 7 (p. 5)** | `BE-REQ-004` | Node-wise data management | `SensorReading.node_id` & `ix_sensor_readings_node_timestamp` | Telemetry Service | `test_node_wise_time_series_retrieval` |
| **Sec. 7, 9 (pp. 5, 6)** | `BE-REQ-005` | Historical telemetry persistence | `SensorReading` table & migration `43d29daf2fbd` | Storage Engine | `test_historical_time_series_persistence` |
| **Sec. 7, 9 (pp. 5, 6)** | `BE-REQ-006` | Historical trend data retrieval | Composite index `(sensor_id, timestamp)` | Analytics API (`GET /telemetry/history`) | `test_historical_time_series_persistence` |
| **Sec. 1, 9 (pp. 1, 6)** | `BE-REQ-007` | Live monitoring dashboard feeds | TelemetryBroadcaster & WebSocket Endpoint (`/api/v1/ws/telemetry`) | Live Monitoring Stream | `tests/test_live.py` (14 tests) |

| **Sec. 4.1 (p. 3)** | `BE-REQ-008` | Displacement / deformation ingestion | Ingestion Service & Validator | `POST /api/v1/ingestion/telemetry` | `test_valid_telemetry_ingestion` |
| **Sec. 4.2 (p. 3)** | `BE-REQ-009` | Vibration data ingestion | Ingestion Service & Validator | `POST /api/v1/ingestion/telemetry` | `test_node_last_seen_updated_and_persisted` |
| **Sec. 4.3 (p. 3)** | `BE-REQ-010` | Crack progression data ingestion | Ingestion Service & Validator | `POST /api/v1/ingestion/telemetry` | `test_full_multimodal_mock_frame_ingestion` |
| **Sec. 4.4 (p. 3)** | `BE-REQ-011` | Environmental (T, H, P) data ingestion | Ingestion Service & Validator | `POST /api/v1/ingestion/telemetry` | `test_valid_telemetry_ingestion` |
| **Sec. 4.5 (p. 3)** | `BE-REQ-012` | Hazardous gas ingestion ($\text{CH}_4$, $\text{CO}$, $\text{O}_2$) | Ingestion Service & Validator | `POST /api/v1/ingestion/telemetry` | `test_dangerous_extreme_values_accepted` |
| **Sec. 4.5 (p. 3)** | `BE-REQ-013` | Extensible gas sensor schema | Ingestion Service & Validator | `POST /api/v1/ingestion/telemetry` | `test_full_multimodal_mock_frame_ingestion` |
| **Sec. 2, 8, 10 (pp. 1, 5, 7)** | `BE-REQ-014` | Multi-parameter AI correlation | AI Analytics Engine | Multi-Parameter Correlation Worker | Verify compounding parameter increases trigger heightened risk classification |
| **Sec. 8, 13 (pp. 5, 9)** | `BE-REQ-015` | AI anomaly detection | AI Analytics Engine | Anomaly Detection Service | Verify statistical deviation from historical baseline triggers anomaly flag |
| **Sec. 8, 17 (pp. 6, 11)** | `BE-REQ-016` | Node-level risk scoring & classification | `RiskService` & Risk API (`GET /api/v1/risk/nodes/{id}/latest`) | Risk Engine (Phase 6) | `tests/test_risk_and_alerts.py::test_node_risk_evaluation_threshold_breach` |
| **Sec. 8 (p. 6)** | `BE-REQ-017` | Early-warning prediction | AI Analytics Engine | Predictive Trend Evaluator | Verify detection of sustained positive rate-of-change ($\frac{d}{dt}$) over time window |
| **Sec. 8 (p. 6)** | `BE-REQ-018` | Historical trend analysis | Analytics Service | Trend Aggregation Query Worker | Verify computation of moving averages and rates of progression |
| **Sec. 9 (p. 6)** | `BE-REQ-019` | Spatial mine risk map zone mapping | `RiskService.evaluate_zone_risk()` (`GET /api/v1/risk/zones/{id}`) | Spatial Risk Map (Phase 6) | `tests/test_risk_and_alerts.py::test_zone_risk_aggregation` |
| **Sec. 9, 12 (pp. 6, 7)** | `BE-REQ-020` | Sensor threshold alerts | `RuleEngine` & `AlertService` (`POST /api/v1/rules/thresholds`) | Alert Engine (Phase 6) | `tests/test_risk_and_alerts.py::test_alert_generation_and_deduplication` |
| **Sec. 9, 12 (pp. 6, 7)** | `BE-REQ-021` | Anomaly-driven alerts | Alert Dispatcher | Anomaly Event Consumer | Verify alert is generated upon anomaly detection event |
| **Sec. 9, 10, 12 (pp. 6, 7)** | `BE-REQ-022` | Multi-parameter compound risk alerts | `RuleEngine` & `MultiParameterRule` | Alert Engine (Phase 6) | `tests/test_risk_and_alerts.py::test_multi_parameter_rule_evaluation` |
| **Sec. 9, 12 (pp. 6, 7)** | `BE-REQ-023` | Node unresponsive timeout alert | Liveness Watchdog & `AlertService` (`NODE_UNRESPONSIVE`) | Alert Engine (Phase 6) | `tests/test_risk_and_alerts.py::test_node_risk_unresponsive_detection` |
| **Sec. 6, 12 (pp. 4, 8)** | `BE-REQ-024` | Scalable multi-node architecture | Architecture Core | Scalable Ingestion Pipeline | Verify horizontal addition of nodes $1 \dots N$ without code modifications |
| **Sec. 9 (p. 6)** | `BE-REQ-035` | Dashboard Spatial Hierarchy & Presentation APIs | Dashboard API Layer (Phase 8) | `GET /api/v1/mines`, `GET /api/v1/zones`, `GET /api/v1/nodes` | `tests/test_dashboard_api.py::test_list_mines`, `test_list_zones_and_filter`, `test_list_nodes_and_filter` |
| **Sec. 9, 10 (pp. 6, 7)** | `BE-REQ-036` | Dashboard Operational Overview & Snapshot Feed | Dashboard Aggregator (Phase 8) | `GET /api/v1/dashboard/overview` | `tests/test_dashboard_api.py::test_dashboard_overview` |
| **Sec. 1, 6 (pp. 1, 4)** | `BE-REQ-037` | Operational Health & Readiness Probes | Health Controller (Phase 9) | `GET /api/v1/health/liveness`, `GET /api/v1/health/readiness` | `tests/test_security_and_reliability.py::test_liveness_probe`, `test_readiness_probe_healthy`, `test_readiness_probe_unhealthy_when_db_fails` |
| **Sec. 1, 13 (pp. 1, 8)** | `BE-REQ-038` | Pipeline Failure Isolation & Graceful Degradation | Ingestion & Telemetry Core (Phase 9) | `POST /api/v1/ingestion/telemetry` | `tests/test_security_and_reliability.py::test_ingestion_persists_even_when_broadcaster_fails`, `test_ingestion_persists_even_when_risk_engine_fails`, `test_ingestion_persists_even_when_ai_engine_fails` |
| **Sec. 1-13 (pp. 1-12)** | `BE-REQ-039` | End-to-End System Operational Lifecycle | Integrated Platform (Phase 10) | Entire API Tree | `tests/test_e2e.py::test_complete_end_to_end_lifecycle` |
| **Sec. 13 (p. 8)** | `BE-REQ-040` | Containerized & Automated CI Packaging | Deployment & Automation (Phase 10) | `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml` | `alembic upgrade head`, container healthcheck probe |

