# SIH 2026 Integrated Mine Safety Monitoring System
## Normalized Telemetry Ingestion Contract

**Document Version**: 1.0  
**Notice**: This document defines the **backend internal normalized ingestion contract**. It does NOT specify or fabricate the physical LoRa RF protocol, packet byte layout, or edge serial format (which remain TBD).

---

## 1. Overview

The ingestion contract establishes the data schema expected by the backend when the central **Mother System** gateway (or transport adapter) forwards decoded telemetry bursts.

```text
Field Sensing Layer ──(LoRa)──> Mother System ──(HTTP Transport Adapter)──> Ingestion Service ──> Database
```

---

## 2. Ingestion Endpoint Specification

- **HTTP Method**: `POST`
- **Path**: `/api/v1/ingestion/telemetry`
- **Content-Type**: `application/json`
- **Success Status**: `201 Created`

---

## 3. Normalized Request Schema (`TelemetryIngestionRequest`)

```json
{
  "node_identifier": "NODE-SEC-01",
  "timestamp": "2026-09-09T14:30:00Z",
  "readings": [
    {
      "sensor_type": "displacement",
      "value": 1.45,
      "sensor_identifier": "disp_axis_z"
    },
    {
      "sensor_type": "methane_ch4",
      "value": 0.22,
      "sensor_identifier": null
    }
  ]
}
```

### Field Definitions

| Field Name | Type | Mandatory? | Description |
| :--- | :--- | :--- | :--- |
| `node_identifier` | String (1–128 chars) | **Yes** | Physical or logical identifier of the reporting Integrated Node. Must exist in `integrated_nodes` table. |
| `timestamp` | ISO-8601 String (UTC) | No | Observation time recorded at the node/gateway. If omitted or null, backend ingestion time is assigned. |
| `readings` | Array of `MeasurementItem` | **Yes** | Non-empty list of sensor readings gathered during this measurement cycle. |
| `readings[].sensor_type` | String (1–64 chars) | **Yes** | Sensing modality category. Must match an active registered sensor on the node. |
| `readings[].value` | Float | **Yes** | Numerical sensor measurement. |
| `readings[].sensor_identifier` | String (1–64 chars) | No | Optional sub-channel or hardware sensor tag (e.g. `ch4_primary`, `disp_axis_x`). |

---

## 4. Supported Sensor Types (Sec. 4)

The ingestion pipeline accepts any valid string registered for the node, specifically supporting the 9 core project modalities:

1. `displacement` — Structural displacement / ground deformation.
2. `vibration` — Dynamic disturbance and seismic vibrations.
3. `crack_detection` — Crack width and evolution.
4. `temperature` — Ambient environmental temperature.
5. `humidity` — Relative humidity.
6. `pressure` — Barometric pressure.
7. `methane_ch4` — Methane hazardous gas level.
8. `carbon_monoxide_co` — Carbon monoxide toxic gas level.
9. `oxygen_o2` — Oxygen concentration level.
10. *Extensible custom gases* (e.g., `hydrogen_sulfide_h2s`, `nitrogen_dioxide_no2`).

---

## 5. Success Response Schema (`TelemetryIngestionResponse`)

- **Status Code**: `201 Created`

```json
{
  "status": "success",
  "node_identifier": "NODE-SEC-01",
  "readings_persisted": 2,
  "ingested_at": "2026-09-09T14:30:01.124589Z"
}
```

---

## 6. Error Responses & Validation Invariants

All errors follow the centralized API error envelope defined in Phase 1 (`D-008`):

### 6.1 Unregistered Node (`404 Not Found`)
Triggered when `node_identifier` does not match any existing record in `integrated_nodes`:
```json
{
  "error": {
    "code": "NODE_NOT_FOUND",
    "message": "Node 'UNKNOWN-NODE' is not registered in the system.",
    "details": {
      "node_identifier": "UNKNOWN-NODE"
    }
  }
}
```

### 6.2 Unregistered Sensor (`404 Not Found`)
Triggered when a sensor type is not mounted/active on the specified node:
```json
{
  "error": {
    "code": "SENSOR_NOT_FOUND",
    "message": "Sensor of type 'radiation' is not registered or active on node 'NODE-SEC-01'.",
    "details": {
      "node_identifier": "NODE-SEC-01",
      "sensor_type": "radiation"
    }
  }
}
```

### 6.3 Malformed Payload (`422 Unprocessable Entity`)
Triggered when required fields are missing, empty, or have invalid types:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "type": "missing",
        "loc": ["body", "readings"],
        "msg": "Field required"
      }
    ]
  }
}
```

---

## 7. Critical Ingestion Invariants

1. **Decoupling from Safety Evaluation**: The ingestion layer **never rejects** dangerous, high, or critical sensor values. A reading of $50\%\ \text{CH}_4$ is valid data and must be persisted so downstream AI and alerting engines can detect the emergency.
2. **Atomic Ingestion**: All readings in a single telemetry frame are written within a single database transaction. If any reading fails mapping, the entire frame rolls back.
3. **Liveness Heartbeat**: Every successfully processed telemetry frame automatically updates `IntegratedNode.last_seen_at` to the current timestamp and sets `IntegratedNode.status = "ACTIVE"`.
