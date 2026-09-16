# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 3: Node + Mother System Ingestion Documentation

**Document Version**: 1.0  
**Phase Status**: **COMPLETED** (Strict Stop before Phase 4)

---

## 1. Phase Objective

Establish the backend's controlled ingestion boundary for multi-parameter telemetry received from the external Mother System gateway, without coupling to physical LoRa radio hardware or fabricating communication protocols.

---

## 2. Distinction: Known vs. Implemented vs. TBD

### 2.1 KNOWN (Source of Truth — Project Overview)
- **Multi-sensor Integration**: Each Integrated Node combines displacement, vibration, cracks, environmental (T, H, P), and gases ($\text{CH}_4$, $\text{CO}$, $\text{O}_2$) (Sec. 4).
- **Communication Flow**: Nodes transmit to a central Mother System via LoRa (Sec. 5).
- **Mother System Role**: Central gateway responsible for node identification, data aggregation, and forwarding toward cloud infrastructure (Sec. 6).
- **Multi-node Network**: Architecture supports multiple distributed nodes across mine zones (Sec. 12).

### 2.2 IMPLEMENTED (Phase 3 Backend Capabilities)
- **Transport Adapter**: HTTP REST ingestion endpoint (`POST /api/v1/ingestion/telemetry`).
- **Normalized Ingestion Contract**: Structured Pydantic DTOs enforcing schema validity, typing, and non-empty reading batches.
- **Node & Sensor Resolution**:
  - Rejects unknown nodes with controlled `404 NODE_NOT_FOUND`.
  - Rejects unmapped sensors with controlled `404 SENSOR_NOT_FOUND`.
  - No silent auto-creation of unverified hardware nodes.
- **Liveness Tracking**: Telemetry reception automatically refreshes `IntegratedNode.last_seen_at` and marks `status = "ACTIVE"`.
- **Atomic Persistence**: Persists all measurements in a batch as immutable `SensorReading` records in a single database transaction.
- **Decoupled Safety Logic**: Ingestion checks structural validity only; dangerous values are accepted as valid telemetry observations.
- **Development Mock Adapter**: [`MockMotherSystemAdapter`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/utils/mock_adapter.py) providing synthetic multi-modal bursts for automated testing and local simulation.

### 2.3 TBD (Unresolved External Protocol Details)
- **Physical LoRa Parameters**: Carrier frequency, Spreading Factor, Bandwidth, and Coding Rate remain **TBD**.
- **Radio Stack**: LoRaWAN vs. raw proprietary LoRa point-to-multipoint remains **TBD**.
- **Field Gateway Uplink**: Physical connection between Mother System and Cloud (cellular NB-IoT, Ethernet, Wi-Fi backhaul, satellite) remains **TBD**.
- **Edge Serialization**: Byte packing / bitmasking over LoRa RF link remains **TBD**.
- **Over-the-air Encryption & Auth**: Device credentials (AES-128 keys, DevEUI/AppEUI) remain **TBD**.

---

## 3. Ingestion Architecture Flow

```text
┌───────────────────────────────┐
│     Mother System Gateway     │
└───────────────┬───────────────┘
                │ HTTP POST /api/v1/ingestion/telemetry
                ▼
┌───────────────────────────────┐
│      HTTP Transport Adapter   │
│  (backend/app/api/v1/ingestion)│
└───────────────┬───────────────┘
                │ TelemetryIngestionRequest
                ▼
┌───────────────────────────────┐
│    Pydantic Schema Validator  │
│  (backend/app/schemas/ingestion)
└───────────────┬───────────────┘
                │ Validated DTO
                ▼
┌───────────────────────────────┐
│       Ingestion Service       │
│  (backend/app/services/ingestion)
│  1. Node Lookup (Reject if missing)
│  2. Sensor Resolution (Reject if missing)
│  3. Update Node.last_seen_at
│  4. Atomic Batch Insert       │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│   Database: sensor_readings   │
│   (Phase 2 Relational Storage)│
└───────────────────────────────┘
```

---

## 4. Endpoints Implemented

| Method | Path | Status Code | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ingestion/telemetry` | `201 Created` | Ingest multi-sensor telemetry frame from Mother System gateway |
| `GET` | `/api/v1/health` | `200 OK` | Operational health check (Phase 1) |

---

## 5. Automated Test Results

Executed automated test suite via pytest:
```bash
python -m pytest -v tests/
```

Results:
```text
tests/test_database.py::test_database_connection PASSED                  [  5%]
tests/test_database.py::test_domain_hierarchy_persistence PASSED         [ 11%]
tests/test_database.py::test_node_identifier_unique_constraint PASSED    [ 17%]
tests/test_database.py::test_mine_name_unique_constraint PASSED          [ 23%]
tests/test_database.py::test_historical_time_series_persistence PASSED   [ 29%]
tests/test_database.py::test_node_wise_time_series_retrieval PASSED      [ 35%]
tests/test_health.py::test_app_instantiation PASSED                      [ 41%]
tests/test_health.py::test_health_endpoint_success PASSED                [ 47%]
tests/test_health.py::test_not_found_standard_error_envelope PASSED      [ 52%]
tests/test_health.py::test_openapi_docs_accessible PASSED                [ 58%]
tests/test_ingestion.py::test_valid_telemetry_ingestion PASSED           [ 64%]
tests/test_ingestion.py::test_full_multimodal_mock_frame_ingestion PASSED [ 70%]
tests/test_ingestion.py::test_unknown_node_rejection PASSED              [ 76%]
tests/test_ingestion.py::test_unknown_sensor_rejection PASSED            [ 82%]
tests/test_ingestion.py::test_malformed_payload_rejection PASSED         [ 88%]
tests/test_ingestion.py::test_dangerous_extreme_values_accepted PASSED   [ 94%]
tests/test_ingestion.py::test_node_last_seen_updated_and_persisted PASSED [100%]

17 passed in 1.22s
```

---

## 6. Features Deferred to Subsequent Phases

- ❌ **Phase 4**: Telemetry Processing & Persistence (window aggregation, multi-sensor batch queries).
- ❌ **Phase 5**: Live Monitoring & Real-time Feeds (WebSockets / SSE broadcast).
- ❌ **Phase 6**: Risk Scoring & Alert Engine (multi-parameter evaluation, threshold breach detection).
- ❌ **Phase 7**: AI Analytics & Anomaly Detection.
- ❌ **Phase 8**: Dashboard Integration APIs.
- ❌ **Phase 9**: Production Authentication & Security.
