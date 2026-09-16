# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 9: Security + Reliability Documentation

**Document Version**: 1.0  
**Phase Status**: **COMPLETED** (Hard Stop before Phase 10: Testing + Deployment)

---

## 1. Phase Objective

Harden the existing backend for **security, fault tolerance, reliability, safe configuration, operational observability, and graceful degradation** across all implemented subsystems (Phases 1–8).

Phase 9 strengthens the prototype backend without redesigning the architecture, adding frontend components, or introducing ungrounded business requirements.

---

## 2. Anti-Hallucination Statement

> **CRITICAL ARCHITECTURAL CONSTRAINTS**:
>
> - **NO Fabricated Authentication / Authorization**: Neither user accounts, passwords, nor artificial roles (`Admin`, `Engineer`, `Operator`, `Viewer`) were invented. Per BE-REQ-030 and ADRs D-006/D-023, authentication remains **🟡 TBD**.
> - **NO Fabricated Retention or Backup Policies**: Historical time-series telemetry is preserved indefinitely by default. No arbitrary retention horizons (e.g. 30 days) or backup frequencies were invented; these remain **🟡 TBD**.
> - **NO Business Logic Alteration**: Safety thresholds, risk classification tiers, and AI mathematical boundaries from Phases 6 and 7 were preserved without modification.
> - **Strict Failure Isolation Preserved**: Non-critical downstream components (live streaming, risk scoring, AI anomaly detection) are strictly isolated so that exceptions can never roll back or fail raw telemetry persistence in the database.

---

## 3. Security Controls

### 3.1 Authentication & Authorization
* **Status**: **🟡 TBD** (BE-REQ-030).
* **Rationale**: The SIH 2026 project overview does not specify authentication schemes or user roles. Inventing mock authentication would violate anti-hallucination rules. Endpoints remain unauthenticated in prototype mode with clear architectural hooks for enterprise identity providers.

### 3.2 Configuration & Secrets Management
* Centralized in `Settings` via `pydantic-settings` ([backend/app/core/config.py](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/core/config.py)).
* `.gitignore` excludes `.env` and `.env.*.local` files.
* [.env.example](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/.env.example) provides documented placeholders for all settings without embedding real credentials.

### 3.3 Diagnostic Credential Masking
* Added `mask_sensitive_url()` in [backend/app/core/logging.py](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/core/logging.py).
* Automatically scrubs passwords from database URLs (`postgresql://user:***@host...`) to prevent secret leakage in server logs and diagnostic traces.

### 3.4 Input Validation & Bounding Guard
* Bounded `TelemetryIngestionRequest.readings` to a maximum of 500 items ([schemas/ingestion.py](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/schemas/ingestion.py)) to prevent memory exhaustion and denial-of-service from malfunctioning or rogue edge nodes (🔵 D-037).
* Enforced string length bounds on `node_identifier` (`1..128` chars).
* Strict Pydantic parsing with `extra="forbid"` rejects unexpected or malformed payload fields.

### 3.5 HTTP Security & CORS
* **CORS**: Configurable via `CORS_ALLOWED_ORIGINS` in settings (🔵 D-036).
* **Security Response Headers**: Injected across all responses via middleware in [backend/app/main.py](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/main.py):
  - `X-Content-Type-Options: nosniff` (prevents MIME-type confusion attacks)
  - `X-Frame-Options: DENY` (mitigates clickjacking)
  - `X-XSS-Protection: 1; mode=block` (browser XSS filtering)
  - `Referrer-Policy: strict-origin-when-cross-origin` (restricts referrer leakage)

### 3.6 Information Leakage Prevention
* Centralized exception handlers in [backend/app/core/errors.py](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/core/errors.py) intercept unhandled internal exceptions and return a sanitized standard error envelope:
  ```json
  {
    "error": {
      "code": "INTERNAL_SERVER_ERROR",
      "message": "An unexpected internal server error occurred.",
      "details": null
    }
  }
  ```
* Internal stack traces and database SQL syntax are never leaked in client responses.

---

## 4. Reliability Controls

### 4.1 Database Connection Pool Reliability
* Configured `pool_pre_ping=True` in `create_async_engine` ([backend/app/db/session.py](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/db/session.py)). SQLAlchemy tests connection vitality prior to executing queries, automatically reconnecting dropped sockets.
* Configured `pool_recycle=1800` (30 minutes) for connection pooling targets.

### 4.2 Graceful Lifecycle Resource Shutdown
* Added `lifespan` cleanup in [backend/app/main.py](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/main.py):
  1. `telemetry_broadcaster.shutdown()`: Drains and disconnects active in-process WebSocket client queues.
  2. `close_db_engine()`: Gracefully disposes pooled database connections.

### 4.3 Operational Health & Readiness Probes
* **`GET /api/v1/health`**: Backward-compatible liveness probe returning `{"status": "ok"}`.
* **`GET /api/v1/health/liveness`**: Process execution probe returning `{"status": "alive"}`.
* **`GET /api/v1/health/readiness`**: Operational dependency check executing `SELECT 1` on the database session. Returns 200 `ready` when database is healthy; returns 503 `DATABASE_UNAVAILABLE` when unreachable (🔵 D-038).

### 4.4 Subsystem Failure Isolation
The telemetry pipeline in `TelemetryIngestionService.ingest_telemetry()` strictly guarantees failure containment:
```text
Incoming Data
      ↓
Node Resolution & Validation
      ↓
Database Persistence (Atomic Commit) ← [CRITICAL PERSISTENCE POINT]
      ↓
Live Broadcaster (try/except)        ← [NON-FATAL]
      ↓
Risk & Alert Sync (try/except)       ← [NON-FATAL]
      ↓
AI Anomaly Evaluation (try/except)   ← [NON-FATAL]
      ↓
Response to Gateway (201 Created)
```
Even if the live broadcaster crashes, the risk evaluation raises an exception, or the AI model fails, raw telemetry is safely committed and acknowledged to the Mother System edge gateway.

---

## 5. Architectural Decisions (ADRs)

- **D-036**: CORS and HTTP Security Headers Policy.
- **D-037**: Input Payload Bounding for Telemetry Ingestion (Max Readings per Frame = 500).
- **D-038**: Separation of Liveness and Readiness Probes (`/health/liveness` vs `/health/readiness`).
- **D-039**: Graceful Lifecycle Resource Shutdown Architecture.
- **D-040**: Configurable In-Memory Rate Limiting Abuse Guard.

---

## 6. Verification & Automated Test Suite

All Phase 9 security and reliability behaviors are verified in [tests/test_security_and_reliability.py](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/tests/test_security_and_reliability.py):
- `test_security_headers_present`: Injected browser security headers.
- `test_cors_headers_applied`: Cross-origin allowance and origin reflection.
- `test_health_backward_compatible`: Backward compatibility of `/health`.
- `test_liveness_probe`: `/health/liveness` returns process alive status.
- `test_readiness_probe_healthy`: `/health/readiness` returns 200 when database is alive.
- `test_readiness_probe_unhealthy_when_db_fails`: `/health/readiness` returns 503 when database is unreachable.
- `test_payload_reading_limit_rejected`: Payloads >500 items rejected with 422.
- `test_payload_node_identifier_length_validation`: Enforces node_identifier length bounds.
- `test_unhandled_exception_sanitized`: Internal errors return 500 without leaking stack traces.
- `test_broadcaster_shutdown_cleans_clients`: In-process client queues cleanly disposed.
- `test_close_db_engine_executes_safely`: Engine disposed without leaks.
- `test_ingestion_persists_even_when_broadcaster_fails`: Broadcaster exception does not abort persistence.
- `test_ingestion_persists_even_when_risk_engine_fails`: Risk engine exception does not abort persistence.
- `test_ingestion_persists_even_when_ai_engine_fails`: AI anomaly exception does not abort persistence.
- `test_credential_masking`: URL password sanitizer removes secrets.

**Test Suite Status**: **108 passed** (15 new Phase 9 tests + 93 existing tests, 0 failures, 0 regressions).
