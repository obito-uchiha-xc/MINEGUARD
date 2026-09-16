# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 6: Risk & Alert Engine Documentation

**Document Version**: 1.0  
**Phase Status**: **COMPLETED** (Strict Stop before Phase 7: AI / Anomaly Detection)  

---

## 1. Phase Objective

Build the backend's **Risk & Alert Engine** on top of the validated and persisted telemetry pipeline from Phases 1–5.

Phase 6 provides:
- Deterministic, configurable safety rule evaluation (threshold rules & multi-parameter correlation rules).
- Explainable node-level risk assessments and zone-level spatial rollups.
- Communication liveness inspection (unresponsive node detection).
- Alert management with automated deduplication, lifecycle transitions (`ACTIVE` $\rightarrow$ `RESOLVED`), and manual operator resolution.
- Real-time live alert streaming over the existing Phase 5 WebSocket infrastructure.

---

## 2. Distinction: Known vs. Implemented vs. TBD

### 2.1 KNOWN (Source of Truth — Project Overview)
- **Multi-parameter correlation**: Safety monitoring must consider multiple parameters together rather than in isolation (Sec. 2, 8, 10).
- **Threshold conditions**: Configured limits trigger abnormal condition indicators and alerts (Sec. 9, 12).
- **Node unresponsiveness**: Nodes that cease transmitting telemetry trigger safety alerts (Sec. 9, 12).
- **Human decision support**: The system provides explainable information to assist human operators and engineers, and does not automate emergency shutdown or replace engineering judgment (Sec. 8, 18).

### 2.2 IMPLEMENTED (Phase 6 Capabilities)
- **Configurable Threshold Rules**: Stored in `threshold_rules` table (`sensor_type`, `operator` [`GT`, `GTE`, `LT`, `LTE`], `threshold_value`, `severity`, `is_active`).
- **Configurable Multi-Parameter Rules**: Stored in `multi_parameter_rules` table (`conditions` list of sensor/operator/threshold sub-conditions).
- **RuleEngine**: Pure domain service (`backend.app.services.rule_engine`) evaluating comparison operators without hardcoding limits.
- **RiskService**: Orchestrates rule evaluation and node liveness checks (`backend.app.services.risk_service`) to produce an explainable `RiskAssessmentResponse` preserving all contributing factors.
- **Node Liveness Watchdog**: Detects unresponsive nodes based on `last_seen_at` and `NODE_UNRESPONSIVE_TIMEOUT_S = 60` (🔵 D-027).
- **Zone Risk Rollup**: Maps node risk assessments to operational mine zones (`backend.app.schemas.risk.ZoneRiskSummaryResponse`, `BE-REQ-019`).
- **AlertService & Deduplication**: Manages alerts in `alerts` table. Deduplicates via `condition_key` (🔵 D-028). Auto-resolves alerts when triggering conditions clear.
- **Live Alert Broadcast**: Reuses Phase 5 WebSocket channel to fan-out `LiveAlertEvent` frames to connected dashboards.
- **REST APIs**: Endpoints for risk assessments, zone summaries, active/historical alerts, manual resolution, and rule configuration.

### 2.3 TBD (Explicitly Excluded / Not Hallucinated)
- **Numerical Safety Limits**: No official regulatory limits are prescribed in the project overview. All threshold numbers are strictly configurable (🟡 BE-REQ-031).
- **Mathematical Risk Formula**: No arbitrary weighting formula ($0\text{--}100$) is invented. Numeric scoring remains 🟡 TBD (BE-REQ-034).
- **AI & Anomaly Detection**: Machine learning models, statistical baselines, and predictive forecasting are deferred to Phase 7.
- **Emergency Control**: No automated actuation or industrial control systems are implemented.

---

## 3. Risk & Alert Evaluation Architecture

```text
Persisted Telemetry (Phase 4)
             │
             ▼
┌──────────────────────────────────────────────┐
│  RuleEngine (Pure Domain Logic)              │
│  • evaluate_threshold_rule(rule, val)        │
│  • evaluate_multi_parameter_rule(rule, map)  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  RiskService                                 │
│  1. Node liveness check (last_seen_at)       │
│  2. Fetch latest reading per sensor          │
│  3. Evaluate active rules                    │
│  4. Assemble ContributingFactor list         │
│  5. Determine risk level (NORMAL/ELEVATED/HIGH)
│  6. Persist RiskAssessmentRecord             │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  AlertService                                │
│  1. Map factors to deterministic condition_key
│  2. Deduplicate against existing ACTIVE alerts
│  3. Trigger new Alert records                │
│  4. Auto-resolve cleared Alert records       │
│  5. Dispatch LiveAlertEvent via Broadcaster  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Phase 5 WebSocket Live Infrastructure       │
│  • Emits 'alert' frame to connected clients  │
└──────────────────────────────────────────────┘
```

---

## 4. Rule Mechanics & Threshold Handling

### 4.1 Configurable Threshold Rules
Rules are created via `POST /api/v1/rules/thresholds` and stored persistently in `threshold_rules`:
- Comparison operators: `GT` ($>$), `GTE` ($\ge$), `LT` ($<$), `LTE` ($\le$).
- Severity: `WARNING` or `CRITICAL` (🔵 D-026).
- If no rule is configured for a sensor, **no default limit is assumed**; the sensor reading produces zero risk factors and the system operates safely without hallucinating safety limits.

### 4.2 Multi-Parameter Correlation Rules
Rules are created via `POST /api/v1/rules/correlations` and stored persistently in `multi_parameter_rules`:
- Joint conditions require all sub-conditions to be satisfied concurrently in the latest telemetry snapshot.
- Generates a `MULTI_PARAMETER_CORRELATION` contributing factor and alert.

---

## 5. Explainable Risk Classification & Scoring

### 5.1 Classification Policy (🔵 DECISION D-025)
Every assessment preserves an explicit list of `contributing_factors`:
- **`NORMAL`**: 0 active contributing factors; node communication is active.
- **`ELEVATED`**: Exactly 1 active `WARNING` factor.
- **`HIGH`**: Any active `CRITICAL` factor OR $\ge 2$ concurrent active factors.

> **Disclaimer**: This classification is a prototype implementation decision (🔵 D-025) to provide immediate situational awareness. It is **NOT** an official or regulatory mine-safety classification.

### 5.2 Numeric Scoring
No numeric scoring formula (e.g. weighted score $0\text{--}100$) was prescribed by the project overview. To avoid hallucination, no arbitrary mathematical scoring is introduced. Quantitative risk models are deferred to Phase 7 (AI).

---

## 6. Node Unresponsiveness Watchdog

- Configured via `NODE_UNRESPONSIVE_TIMEOUT_S` (default: 60s, 🔵 D-027).
- If `(now - last_seen_at) > timeout`, a `NODE_UNRESPONSIVE` factor is generated.
- Generates an active `NODE_UNRESPONSIVE` alert (`condition_key="node_unresponsive"`).
- Automatically resolves when fresh telemetry is ingested and `last_seen_at` is updated.

---

## 7. Alert Lifecycle & Deduplication (🔵 DECISION D-028)

### 7.1 Deduplication Policy
- Every condition generates a deterministic `condition_key`:
  - Threshold: `threshold:{sensor_type}:{rule_name}`
  - Multi-parameter: `multi:{rule_name}`
  - Node unresponsive: `node_unresponsive`
- When incoming telemetry continues to breach an existing active condition, the system recognizes the existing `ACTIVE` alert and does **NOT** insert duplicate database rows.

### 7.2 Lifecycle States
```text
  [Condition Detected]
           │
           ▼
        ACTIVE ────────┐
           │           │ [Operator Manual Resolve]
           │           ▼
           │        RESOLVED (via POST /alerts/{id}/resolve)
           ▼
        RESOLVED (Auto-resolved when sensor recovers or node reports)
```

---

## 8. Live Monitoring Integration

Alert events are streamed over the existing WebSocket transport (`/api/v1/ws/telemetry`):
```json
{
  "event_type": "alert",
  "node_identifier": "NODE-01",
  "node_id": 1,
  "alert_id": 42,
  "alert_type": "THRESHOLD",
  "severity": "CRITICAL",
  "status": "ACTIVE",
  "message": "Sensor 'methane_ch4' observed value 1.5 crossed configured threshold (GT 1.0) in rule 'Gas Critical'.",
  "context_data": {
    "sensor_type": "methane_ch4",
    "observed_value": 1.5,
    "threshold_value": 1.0,
    "operator": "GT",
    "rule_name": "Gas Critical"
  },
  "emitted_at": "2026-09-09T20:50:00Z"
}
```

---

## 9. Endpoints Implemented

| Method | Path | Status Code | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/risk/nodes/{node_identifier}/latest` | `200 OK` | Get latest explainable risk assessment for a node |
| `GET` | `/api/v1/risk/zones/{zone_id}` | `200 OK` | Get aggregated zone risk summary (rollup) |
| `GET` | `/api/v1/alerts/active` | `200 OK` | List active alerts (optional `node_identifier` filter) |
| `GET` | `/api/v1/alerts/history` | `200 OK` | Query historical alerts with pagination and filters |
| `POST` | `/api/v1/alerts/{alert_id}/resolve` | `200 OK` | Manually mark an alert as resolved |
| `GET` | `/api/v1/rules/thresholds` | `200 OK` | List configured threshold rules |
| `POST` | `/api/v1/rules/thresholds` | `201 Created` | Create a configurable threshold rule |
| `GET` | `/api/v1/rules/correlations` | `200 OK` | List multi-parameter correlation rules |
| `POST` | `/api/v1/rules/correlations` | `201 Created` | Create a multi-parameter correlation rule |

---

## 10. Verification & Test Coverage Summary

15 automated tests in `tests/test_risk_and_alerts.py` verify all Phase 6 capabilities:
- Numeric comparisons (`GT`, `GTE`, `LT`, `LTE`).
- Threshold rule evaluation and disabled rule handling.
- Multi-parameter joint correlation evaluation (partial vs full satisfaction).
- Rule creation and listing API endpoints.
- Normal, elevated, and unresponsive node risk evaluations.
- Zone risk aggregation rollups.
- Alert generation and deduplication under repeated readings.
- Alert auto-resolution on condition recovery.
- Manual alert resolution endpoint.
- Live alert WebSocket broadcast.
- Unconfigured sensor safety handling (no invented limits).
- Ingestion failure isolation.

**All 55 tests in the complete backend test suite pass with zero regressions.**
