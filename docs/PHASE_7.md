# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 7: AI / Anomaly Detection Documentation

**Document Version**: 1.0  
**Phase Status**: **COMPLETED** (Hard Stop before Phase 8: Dashboard UI / APIs)

---

## 1. Phase Objective

Introduce an **assistive AI / anomaly detection layer** on top of the validated telemetry pipeline and deterministic Risk & Alert Engine from Phases 1–6.

The AI layer provides:
- Unsupervised statistical anomaly detection per sensor stream (rolling Z-score).
- Multivariate compound anomaly evaluation across multiple sensors on the same node.
- Persistent anomaly evaluation records in a dedicated `ai_anomalies` table.
- Real-time anomaly streaming to live monitoring clients via Phase 5 WebSocket.
- REST API for querying anomaly history, latest evaluations, and model metadata.
- Strict failure isolation: AI failures never impact ingestion, Phase 4 telemetry persistence, or Phase 6 deterministic alerts.

---

## 2. Anti-Hallucination Statement

> **CRITICAL**: This AI layer is a **Prototype Assistive Model**.
>
> - No model is trained on labeled mine failure datasets.
> - No neural network, LSTM, or autoencoder is used.
> - Statistical thresholds (σ boundaries) are **NOT** authoritative mine engineering safety limits.
> - AI anomaly results do NOT replace, override, or trigger Phase 6 deterministic safety rules.
> - The system does NOT perform automated emergency shutdown based on AI scores.
>
> All model metadata responses carry an explicit `disclaimer` field encoding this.

---

## 3. Distinction: Known vs. Implemented vs. TBD

### 3.1 KNOWN (Source of Truth — Project Overview)
- **Anomaly detection across multiple sensor streams** (BE-REQ-015): The system must identify unusual patterns in sensor telemetry.
- **No autonomous safety actions**: AI assists human operators; it does NOT automate shutdown (Sec. 8, 18).
- **Prototype scope**: No real mine failure data is available for training supervised models.

### 3.2 IMPLEMENTED (Phase 7 Capabilities)
| Capability | Implementation |
|---|---|
| Univariate anomaly detection | Rolling Z-score with variance floor (`StatisticalAnomalyDetector`) |
| Multivariate compound anomaly | Normalized Euclidean RMS deviation (`MultiVariateAnomalyDetector`) |
| Baseline feature extraction | `FeatureService` — sliding window from `sensor_readings` table |
| Anomaly persistence | `AIAnomalyRecord` → `ai_anomalies` table |
| Live WebSocket streaming | `LiveAnomalyEvent` emitted on confirmed anomalies |
| REST API | `/ai/nodes/{id}/latest`, `/ai/nodes/{id}/history`, `/ai/models` |
| Ingestion hook | Step 8 in `TelemetryIngestionService.ingest_telemetry()` |
| Failure isolation | AI exceptions logged as warnings; ingestion response unaffected |
| Model metadata | Explicit `is_assistive=True` + `disclaimer` in all model responses |

### 3.3 NOT IMPLEMENTED (TBD — Future Phases)
- Supervised ML models (requires real labeled mine safety data).
- LSTM-based temporal pattern detection.
- Autoencoder reconstruction error.
- AI-driven automatic alert generation (Phase 6 rules own alert creation).
- Per-mine threshold tuning and per-sensor fine-grained windows.

---

## 4. Algorithm Details

### 4.1 Univariate Rolling Z-Score (🔵 D-029)

**StatisticalAnomalyDetector**

```
Z = |x - μ| / max(σ, σ_min)
```

Where:
- `x` = current sensor observation
- `μ` = mean of the N most recent readings (rolling baseline window)
- `σ` = standard deviation of the baseline window
- `σ_min = 1e-4` (variance floor, prevents division by zero on flatline data)

**Decision Rule**: `is_anomaly = (Z >= threshold)`

**Threshold (🔵 D-030)**: `τ = 3.0` standard deviations (configurable via `AI_ANOMALY_ZSCORE_THRESHOLD`).

> This is a **statistical decision boundary**, NOT an engineering safety limit.

**Baseline Window**: Last `AI_BASELINE_WINDOW_SIZE = 30` readings per sensor (configurable).

**Minimum Samples**: Requires `AI_MIN_SAMPLES_FOR_INFERENCE = 5` readings before evaluating.
During warm-up, `is_anomaly=False` is returned with an explanatory message.

### 4.2 Multivariate Compound Deviation (🔵 D-029)

**MultiVariateAnomalyDetector**

```
D = sqrt((1/K) * Σ Z_k²)
```

Where:
- `Z_k` = univariate Z-score for sensor `k`
- `K` = number of sensors with sufficient baseline history
- `D` = compound root-mean-square deviation score

**Decision Rule**: `is_anomaly = (D >= threshold)`  
**Minimum sensors**: Requires at least 2 sensors with sufficient history; returns `None` otherwise.

---

## 5. Data Model

### `ai_anomalies` Table (🔵 D-031)

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-incremented record ID |
| `node_id` | INTEGER FK | Reference to `integrated_nodes` (CASCADE DELETE) |
| `sensor_type` | VARCHAR(64) | Sensor type, or `"MULTIVARIATE_CLUSTER"` |
| `is_anomaly` | BOOLEAN | True if evaluation exceeded threshold |
| `anomaly_score` | FLOAT | Computed Z-score or compound score |
| `threshold` | FLOAT | Threshold applied at evaluation time |
| `model_name` | VARCHAR(64) | Name of detector used |
| `model_version` | VARCHAR(32) | Version of detector |
| `features` | JSON | Feature snapshot (mean, std, z_score, etc.) |
| `explanation` | VARCHAR(255) | Human-readable explanation of result |
| `detected_at` | DATETIME(tz) | UTC timestamp of evaluation |

**Indexes**: `node_id`, `sensor_type`, `is_anomaly`, `detected_at`

---

## 6. API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/ai/nodes/{node_identifier}/latest` | Latest N anomaly evaluation records for a node |
| `GET` | `/api/v1/ai/nodes/{node_identifier}/history` | Filtered history (sensor_type, is_anomaly, time range) |
| `GET` | `/api/v1/ai/models` | Metadata for all active anomaly detection models |

### Query Parameters (`/history`)
| Parameter | Type | Description |
|---|---|---|
| `sensor_type` | `str` | Filter by sensor type |
| `is_anomaly` | `bool` | Filter by anomaly flag |
| `from_dt` | `datetime` | Start of time range (UTC ISO 8601) |
| `to_dt` | `datetime` | End of time range (UTC ISO 8601) |
| `limit` | `int (1-500)` | Max records (default 100) |

---

## 7. Integration Points

### 7.1 Ingestion Pipeline Hook (Step 8)

After all previous steps (persistence, live broadcast, risk/alert evaluation):

```
POST /api/v1/ingestion/telemetry
    ↓
Step 1–5: Validation, node resolution, sensor mapping, persistence
    ↓
Step 6: Live WebSocket broadcast (Phase 5)
    ↓
Step 7: Risk & Alert Engine evaluation (Phase 6)
    ↓
Step 8: AI anomaly evaluation (Phase 7) ← try/except isolated
    ↓
Return TelemetryIngestionResponse
```

Any failure in Step 8 is caught, logged as `WARNING`, and does NOT affect the response.

### 7.2 WebSocket Live Anomaly Events

When `is_anomaly=True`, a `LiveAnomalyEvent` (event_type: `"anomaly"`) is published
to the Phase 5 `TelemetryBroadcaster` for delivery to subscribed WebSocket clients.

```json
{
  "event_type": "anomaly",
  "node_identifier": "NODE-001",
  "node_id": 1,
  "sensor_type": "temperature",
  "is_anomaly": true,
  "anomaly_score": 4.72,
  "threshold": 3.0,
  "model_name": "StatisticalZScoreDetector",
  "model_version": "1.0.0",
  "explanation": "Statistical anomaly detected for temperature: ...",
  "detected_at": "2026-09-09T15:30:00Z"
}
```

---

## 8. Configuration (via `.env` / `Settings`)

| Setting | Default | Description |
|---|---|---|
| `AI_ANOMALY_ZSCORE_THRESHOLD` | `3.0` | Z-score threshold (statistical boundary, NOT safety limit) |
| `AI_BASELINE_WINDOW_SIZE` | `30` | Number of recent readings for rolling baseline |
| `AI_MIN_SAMPLES_FOR_INFERENCE` | `5` | Minimum history samples required before evaluating |

---

## 9. Alembic Migration

Migration ID: `4463c79c1f55_phase7_ai_anomalies`  
Parent: `40f229aa162b_phase6_rules_risk_alerts`

Creates table: `ai_anomalies`  
Creates indexes: `ix_ai_anomalies_node_id`, `ix_ai_anomalies_sensor_type`, `ix_ai_anomalies_is_anomaly`, `ix_ai_anomalies_detected_at`

---

## 10. Test Coverage

**Phase 7 tests**: `tests/test_ai_anomaly.py` — **31 tests**

| Category | Tests | Coverage |
|---|---|---|
| `StatisticalAnomalyDetector` | 7 | Warm-up, normal, anomaly, variance floor, boundary, timestamp, fields |
| `MultiVariateAnomalyDetector` | 5 | Normal, anomaly, insufficient sensors, empty history, explanation |
| `FeatureService` | 3 | Window size, empty result, all-sensor baselines |
| `AIService` | 6 | Normal eval, spike eval, DB persistence, history query, filter, metadata |
| API Endpoints | 5 | Unknown node 404, known node 200, model list, filter params |
| Ingestion Integration | 2 | Hook returns success, spike still succeeds |
| Phase 6 Non-regression | 3 | Rule eval independent, AI score no Phase 6 alert |

**Full suite**: **86 tests, 0 failures, 0 regressions**

---

## 11. Decisions Recorded

| Decision | Summary |
|---|---|
| 🔵 D-029 | Statistical unsupervised anomaly detection (rolling Z-score + multivariate compound deviation) |
| 🔵 D-030 | Threshold `τ=3.0σ` is a statistical boundary, NOT an engineering safety limit |
| 🔵 D-031 | Anomaly evaluations persisted in dedicated `ai_anomalies` table, separate from alerts |
| 🔵 D-032 | AI acts as assistive intelligence only; cannot override Phase 6 deterministic rules |
