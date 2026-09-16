# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 4: Telemetry Processing & Storage Documentation

**Document Version**: 1.0
**Phase Status**: **COMPLETED** (Strict Stop before Phase 5)

---

## 1. Phase Objective

Build a reliable, queryable telemetry processing layer on top of the raw
`SensorReading` time-series storage established in Phase 2 and populated by the
ingestion pipeline in Phase 3.

Consumers of Phase 4 (dashboards, trend analysis, future AI) can now retrieve:
- Full historical records with optional sensor-type and time-window filters
- Most-recent-value snapshots (one reading per sensor) for dashboard display
- Statistical aggregates (min/max/avg/count) for trend analysis foundations

---

## 2. Distinction: Known vs. Implemented vs. TBD

### 2.1 KNOWN (Source of Truth — Project Overview)
- **Multi-parameter recording**: Each node stores displacement, vibration, crack, environmental (T, H, P), and gas readings (Sec. 4).
- **Historical queries**: Required for trend analysis and visualization (Sec. 7, 9).
- **Live monitoring** (NOT Phase 4): Requires real-time push; deferred to Phase 5.

### 2.2 IMPLEMENTED (Phase 4 Backend Capabilities)
- **TelemetryRepository**: Async SQLAlchemy data-access layer using indexed joins (`sensor_id`, `node_id`, `timestamp`) for efficient queries.
- **TelemetryService**: Orchestration + enrichment layer — resolves node, calls repository, maps `(SensorReading, Sensor)` tuples into enriched response DTOs.
- **`GET /api/v1/telemetry/nodes/{id}/history`**: Paginated historical readings with optional `sensor_type`, `from_dt`, `to_dt`, `limit` filters.
- **`GET /api/v1/telemetry/nodes/{id}/latest`**: Most-recent reading per active sensor (correlated subquery, O(n_sensors) not O(n_readings)).
- **`GET /api/v1/telemetry/nodes/{id}/aggregate`**: Window min/max/avg/count for a sensor type.
- **UTC normalization**: All timestamps enforced as UTC before returning to callers.
- **Hard limit cap**: `limit` parameter enforced at 1000 to prevent unbounded reads.

### 2.3 TBD (Unresolved — Deferred)
- **Real-time push**: WebSocket / SSE for live telemetry feeds → Phase 5.
- **Risk scoring**: Threshold breach evaluation → Phase 6.
- **AI anomaly detection** → Phase 7.

---

## 3. Telemetry Query Architecture

```text
Client / Dashboard
        │
        │ GET /api/v1/telemetry/nodes/{id}/history|latest|aggregate
        ▼
┌─────────────────────────────────┐
│  TelemetryRouter                │
│  (backend/app/api/v1/telemetry) │
│  Pydantic query param validation│
└────────────────┬────────────────┘
                 │ TelemetryService(session)
                 ▼
┌─────────────────────────────────┐
│  TelemetryService               │
│  (backend/app/services/telemetry)│
│  1. Node resolution → 404 guard  │
│  2. Delegate to repository       │
│  3. Enrich (SensorReading,Sensor)│
│     → SensorReadingResponse DTOs │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  TelemetryRepository            │
│  (backend/app/repositories/telemetry)
│  • get_readings_by_node()       │
│  • get_latest_reading_per_sensor│
│  • get_window_aggregate()       │
│  • count_readings_in_range()    │
└────────────────┬────────────────┘
                 │ async SQLAlchemy
                 ▼
┌─────────────────────────────────┐
│  sensor_readings  ──join── sensors ──join── integrated_nodes
│  (Phase 2 indexed tables)       │
└─────────────────────────────────┘
```

---

## 4. Endpoints Implemented

| Method | Path | Status Code | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/telemetry/nodes/{node_identifier}/history` | `200 OK` | Paginated historical readings with optional sensor_type / time-window / limit filters |
| `GET` | `/api/v1/telemetry/nodes/{node_identifier}/latest` | `200 OK` | Most-recent reading per active sensor — dashboard snapshot |
| `GET` | `/api/v1/telemetry/nodes/{node_identifier}/aggregate` | `200 OK` | Min/max/avg/count for a sensor type over an optional time window |
| `POST` | `/api/v1/ingestion/telemetry` | `201 Created` | Ingest telemetry frame (Phase 3) |
| `GET` | `/api/v1/health` | `200 OK` | Operational health check (Phase 1) |

### Query Parameters

#### `/history`
| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `sensor_type` | `string` | None | Filter to one sensor category |
| `from_dt` | `datetime` | None | Window start (inclusive, ISO 8601 UTC) |
| `to_dt` | `datetime` | None | Window end (inclusive, ISO 8601 UTC) |
| `limit` | `int` | 500 | Max records; capped at 1000 |

#### `/aggregate`
| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `sensor_type` | `string` | **required** | Sensor category to aggregate |
| `from_dt` | `datetime` | None | Window start |
| `to_dt` | `datetime` | None | Window end |

---

## 5. Automated Test Results

```bash
python -m pytest -v tests/
```

```text
tests/test_database.py::test_database_connection PASSED                  [  3%]
tests/test_database.py::test_domain_hierarchy_persistence PASSED         [  7%]
tests/test_database.py::test_node_identifier_unique_constraint PASSED    [ 11%]
tests/test_database.py::test_mine_name_unique_constraint PASSED          [ 15%]
tests/test_database.py::test_historical_time_series_persistence PASSED   [ 19%]
tests/test_database.py::test_node_wise_time_series_retrieval PASSED      [ 23%]
tests/test_health.py::test_app_instantiation PASSED                      [ 26%]
tests/test_health.py::test_health_endpoint_success PASSED                [ 30%]
tests/test_health.py::test_not_found_standard_error_envelope PASSED      [ 34%]
tests/test_health.py::test_openapi_docs_accessible PASSED                [ 38%]
tests/test_ingestion.py::test_valid_telemetry_ingestion PASSED           [ 42%]
tests/test_ingestion.py::test_full_multimodal_mock_frame_ingestion PASSED [ 46%]
tests/test_ingestion.py::test_unknown_node_rejection PASSED              [ 50%]
tests/test_ingestion.py::test_unknown_sensor_rejection PASSED            [ 53%]
tests/test_ingestion.py::test_malformed_payload_rejection PASSED         [ 57%]
tests/test_ingestion.py::test_dangerous_extreme_values_accepted PASSED   [ 61%]
tests/test_ingestion.py::test_node_last_seen_updated_and_persisted PASSED [ 65%]
tests/test_telemetry.py::test_history_returns_ingested_readings PASSED   [ 69%]
tests/test_telemetry.py::test_history_filtered_by_sensor_type PASSED     [ 73%]
tests/test_telemetry.py::test_history_date_range_filter PASSED           [ 76%]
tests/test_telemetry.py::test_history_limit_respected PASSED             [ 80%]
tests/test_telemetry.py::test_history_unknown_node_returns_404 PASSED    [ 84%]
tests/test_telemetry.py::test_latest_returns_most_recent_per_sensor PASSED [ 88%]
tests/test_telemetry.py::test_latest_unknown_node_returns_404 PASSED     [ 92%]
tests/test_telemetry.py::test_aggregate_min_max_avg PASSED               [ 96%]
tests/test_telemetry.py::test_aggregate_unknown_sensor_type_returns_404 PASSED [100%]

26 passed in 1.57s
```

---

## 6. New Files Created

| File | Purpose |
|:---|:---|
| [`repositories/telemetry.py`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/repositories/telemetry.py) | Async SQLAlchemy time-series query repository |
| [`services/telemetry.py`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/services/telemetry.py) | Service layer: node resolution, enrichment, aggregation |
| [`schemas/telemetry.py`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/schemas/telemetry.py) | 4 Pydantic response DTOs |
| [`api/v1/telemetry.py`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/api/v1/telemetry.py) | 3 GET endpoints (history / latest / aggregate) |
| [`tests/test_telemetry.py`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/tests/test_telemetry.py) | 9 automated tests for Phase 4 |

| File | Change |
|:---|:---|
| [`api/router.py`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/api/router.py) | Registered telemetry router |

---

## 7. Features Deferred to Subsequent Phases

- ❌ **Phase 5**: Live Monitoring & Real-time Feeds (WebSockets / SSE broadcast).
- ❌ **Phase 6**: Risk Scoring & Alert Engine (multi-parameter evaluation, threshold breach detection).
- ❌ **Phase 7**: AI Analytics & Anomaly Detection.
- ❌ **Phase 8**: Dashboard Integration APIs.
- ❌ **Phase 9**: Production Authentication & Security.
