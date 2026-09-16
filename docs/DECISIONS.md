# SIH 2026 Integrated Mine Safety Monitoring System
## Architectural Decision Register (ADR)

**Document Version**: 1.0 (Phase 0 Baseline)  
**Status**: All decisions below are **OPEN** and intentionally deferred for conscious selection prior to Phase 1.

---

### D-001: Backend Language and Web Framework
* **Current Status**: **ACCEPTED (Phase 1)**
* **Selected Option**: **Python 3.12 + FastAPI + Uvicorn**
* **Context**: Need a robust, high-concurrency backend to handle ingestion, coordinate with AI models, and serve dashboard APIs.
* **Rationale**: FastAPI delivers ASGI asynchronous concurrency, automatic OpenAPI documentation, strict typing via Pydantic, and native compatibility with future Python-based scientific/ML analytics libraries without requiring multi-language microservices.
* **Alternatives Considered**:
  - Node.js / Express: High I/O throughput, but would require inter-process bridging to run Python ML/analytics pipelines.
  - Go (Golang): High performance, but limited ecosystem for scientific data manipulation and exploratory AI algorithms.

---

### D-002: Persistence & Time-Series Data Storage
* **Current Status**: **ACCEPTED (Phase 2)**
* **Selected Option**: **PostgreSQL as Primary Production Target; SQLite for Local Development / Testing via SQLAlchemy 2.0**
* **Context**: Need to persist node metadata, spatial zones, multi-parameter historical telemetry, risk calculations, and alerts.
* **Rationale**: PostgreSQL offers relational integrity for hierarchy and spatial zones combined with scalable time-series capabilities. Using SQLAlchemy 2.0 dialect-agnostic models allows seamless local development and automated testing via SQLite while deploying to PostgreSQL in staging/production without altering ORM definitions or migration scripts.

---

### D-003: Mother System to Cloud Ingestion Protocol
* **Current Status**: **ACCEPTED (Phase 3)**
* **Selected Option**: **HTTPS REST Ingestion Adapter (`POST /api/v1/ingestion/telemetry`)**
* **Context**: How the Mother System edge gateway forwards aggregated LoRa sensor frames to the cloud backend.
* **Rationale**: HTTPS REST provides reliable request/response acknowledgement, firewall traversal in mine operations, standard HTTP status codes (201, 404, 422), and immediate validation feedback. The decoupled transport adapter pattern allows future addition of MQTT or TCP adapters without changing business logic.

---

### D-004: Dashboard Real-Time Telemetry Push Mechanism
* **Current Status**: **OPEN**
* **Context**: How the unified dashboard receives live sensor telemetry, risk score updates, and immediate alerts without constant full-page reloading.
* **Candidate Options**:
  1. **WebSockets**: Full-duplex, low-latency, supported by all modern browsers and dashboard frameworks.
  2. **Server-Sent Events (SSE)**: Simpler HTTP-based unidirectional push (server to browser), automatic reconnection, ideal for live charts and alert feeds.
  3. **HTTP Polling (e.g., every 2s)**: Simple to implement, stateless, but introduces latency and unnecessary request overhead.
* **Selection Status**: To be finalized prior to Phase 1 setup.

---

### D-005: AI / ML Architecture for Anomaly Detection & Risk Scoring
* **Current Status**: **OPEN**
* **Context**: Meeting the core requirement of multi-parameter correlation, anomaly detection, and early-warning risk scoring without relying on non-existent mine training datasets.
* **Candidate Options**:
  1. **Rule-Based Composite Risk Engine (MCDA / Weighted Index)**: Transparent, deterministic, instantly verifiable against mine safety standards, requires zero initial training data.
  2. **Unsupervised Anomaly Detection (Isolation Forest / Z-score Rolling Window)**: Learns ambient baseline and flags statistical deviations in multi-sensor space without labeled failure data.
  3. **Hybrid Engine**: Weighted multi-parameter heuristic index for safety scoring combined with unsupervised statistical anomaly detection for novel sensor deviations.
* **Selection Status**: To be finalized prior to Phase 1 setup.

---

### D-006: Authentication & Authorization Tier
* **Current Status**: **OPEN**
* **Context**: Securing ingestion endpoints (from Mother System) and user access (to dashboard).
* **Candidate Options**:
  1. **API Key for Gateway + JWT for Users**: Industry standard; gateway uses rotating bearer API key, web operators log in with JWT.
  2. **Basic / Prototype Mock Auth**: Minimal authentication layer allowing rapid prototype validation during hackathon evaluation.
* **Selection Status**: To be finalized prior to Phase 1 setup.

---

### D-007: Message Broker & Inter-Service Bus
* **Current Status**: **OPEN**
* **Context**: Decoupling high-frequency telemetry ingestion from AI analytics computation and dashboard broadcasting.
* **Candidate Options**:
  1. **In-Memory Async Queue (`asyncio.Queue` / Event Emitter)**: Zero infrastructure dependencies, excellent for prototype scope.
  2. **Redis Pub/Sub**: Fast, lightweight, enables horizontal scaling of API workers and WebSocket push instances.
* **Selection Status**: To be finalized prior to Phase 1 setup.

---

### D-008: Standardized API Error Response Envelope
* **Current Status**: **ACCEPTED (Phase 1)**
* **Selected Option**: **Unified JSON error schema with top-level `error` object**
* **Context**: Need a predictable, typed error structure across all future endpoints to prevent client integration inconsistencies.
* **Specification**:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable description",
      "details": null
    }
  }
  ```
* **Rationale**: Decouples internal exception traces from client-facing error handling while providing structured error codes (`NOT_FOUND`, `VALIDATION_ERROR`, etc.).

---

### D-009: Centralized Settings Management Architecture
* **Current Status**: **ACCEPTED (Phase 1)**
* **Selected Option**: **`pydantic-settings.BaseSettings` with cached singleton**
* **Context**: Application requires typed operational parameters loaded from environment variables or `.env` files without hard-coded literals.
* **Rationale**: Type validation at startup, fails fast on malformed configuration, supports `.env` for local development, and allows clean mocking in automated tests.

---

### D-010: ORM Architecture & Modern Declarative Mapping
* **Current Status**: **ACCEPTED (Phase 2)**
* **Selected Option**: **SQLAlchemy 2.0 Declarative Mapping (`Mapped`, `mapped_column`, `lazy="selectin"`)**
* **Context**: Defining Pythonic representations of database entities with async support and type checking.
* **Rationale**: SQLAlchemy 2.0 provides static typing, native async engine compatibility, selectin relationship loading avoiding async greenlet errors, and seamless Alembic integration.

---

### D-011: Database Migration Framework
* **Current Status**: **ACCEPTED (Phase 2)**
* **Selected Option**: **Alembic with Reversible Migrations & Batch Alter Support**
* **Context**: Managing evolutionary database schema changes systematically across development, testing, and production.
* **Rationale**: Declarative autogeneration with `render_as_batch=True` provides fully reversible migrations compatible with both SQLite and PostgreSQL.

---

### D-012: Primary and External Identifier Strategy
* **Current Status**: **ACCEPTED (Phase 2)**
* **Selected Option**: **Integer Surrogate Primary Keys + String External Identifiers**
* **Context**: Identifying physical hardware nodes vs. database rows.
* **Rationale**: Integer PKs maximize index density and foreign key join speed in high-volume time-series queries. Physical node identifiers (`node_identifier`) remain flexible strings (format marked TBD) with a unique index.

---

### D-013: Extensible Sensor Type Representation
* **Current Status**: **ACCEPTED (Phase 2)**
* **Selected Option**: **Indexed String Representation (`sensor_type: String(64)`)**
* **Context**: Supporting current sensor types (displacement, vibration, cracks, temperature, humidity, pressure, CH4, CO, O2) and future gas sensors.
* **Rationale**: Rigid database enums require disruptive schema migrations (`ALTER TYPE`) whenever a new sensor is introduced. Indexed strings provide zero-downtime extensibility.

---

### D-014: Telemetry Time-Series Model & Indexing Strategy
* **Current Status**: **ACCEPTED (Phase 2)**
* **Selected Option**: **Single `SensorReading` table with Composite Indexes on `(node_id, timestamp)` and `(sensor_id, timestamp)`**
* **Context**: Storing high-frequency observations and enabling fast historical queries per node and per sensor.
* **Rationale**: Direct foreign keys to both `node_id` and `sensor_id` allow node-level risk analytics without multi-table joins, while composite indexes optimize chronological slice retrieval.

---

### D-015: Historical Telemetry Immutability & Deletion Policy
* **Current Status**: **ACCEPTED (Phase 2)**
* **Selected Option**: **`RESTRICT` on Telemetry Deletions; Cascade on Facility Hierarchy**
* **Context**: Ensuring safety audit integrity and preventing accidental data loss in mining operations.
* **Rationale**: `mines` $\rightarrow$ `zones` cascades, but `sensor_readings` cannot be deleted via parent cascade (`ondelete="RESTRICT"`). Telemetry records are treated as immutable safety history.

---

### D-016: Decoupled Transport Adapter and Normalized Contract Architecture
* **Current Status**: **ACCEPTED (Phase 3)**
* **Selected Option**: **Clean separation between Transport Adapters and Domain Ingestion Service**
* **Context**: The Mother System edge gateway protocol remains TBD in field deployments.
* **Rationale**: By decoupling transport decoding from internal Pydantic validation and database persistence, the backend can support alternative transports (e.g. MQTT, WebSocket, direct Serial) in the future without altering core ingestion logic.

---

### D-017: Mother System HTTP Ingestion Boundary
* **Current Status**: **ACCEPTED (Phase 3)**
* **Selected Option**: **`POST /api/v1/ingestion/telemetry` returning HTTP 201 Created**
* **Context**: External API route for the Mother System to deliver multi-sensor telemetry frames.
* **Rationale**: Conforms to RESTful resource creation semantics, integrates with OpenAPI documentation, and returns structured confirmation of persisted reading count.

---

### D-018: Strict Node and Sensor Registration Policy
* **Current Status**: **ACCEPTED (Phase 3)**
* **Selected Option**: **Reject unregistered nodes (`NODE_NOT_FOUND`) and unmapped sensors (`SENSOR_NOT_FOUND`) with HTTP 404**
* **Context**: Policy on whether incoming telemetry can silently auto-register unknown nodes/sensors.
* **Rationale**: Silent creation of unknown hardware risks polluting the mine topological registry with corrupted hardware IDs. Unknown devices must be rejected and logged for operator investigation.

---

### D-019: Decoupling of Ingestion Validity from Safety Evaluation
* **Current Status**: **ACCEPTED (Phase 3)**
* **Selected Option**: **Ingestion validates structural integrity only; dangerous sensor values are accepted**
* **Context**: Handling incoming sensor measurements that indicate hazardous or extreme conditions.
* **Rationale**: Ingestion must record reality without filtering. An extreme reading (e.g. high methane or severe ground movement) is valid telemetry and must be persisted so downstream AI and alerting engines can detect the emergency.

---

### D-020: Automatic Node Liveness and Status Updating
* **Current Status**: **ACCEPTED (Phase 3)**
* **Selected Option**: **Update `IntegratedNode.last_seen_at = now` and `status = "ACTIVE"` upon valid telemetry receipt**
* **Context**: Tracking node operational health and enabling dead node detection (`BE-REQ-023`).
* **Rationale**: Embedding liveness refresh directly within the ingestion transaction guarantees real-time node heartbeat tracking without separate polling queries.

---

### D-021: Bounded Per-Client Queue & Drop-Newest Backpressure Policy
* **Current Status**: **ACCEPTED (Phase 5)**
* **Selected Option**: **`asyncio.Queue(maxsize=50)` per client; `put_nowait()` drops newest event on full queue with warning log**
* **Context**: Slow or stalled WebSocket clients consuming real-time telemetry.
* **Rationale**: Prevents slow or hung clients from exhausting server memory or accumulating stale telemetry queues. Live monitoring values recency over exhaustive delivery for slow clients, and historical DB persistence is strictly decoupled and never affected by client queue drops.

---

### D-022: Server-Initiated Keepalive Ping Mechanism
* **Current Status**: **ACCEPTED (Phase 5)**
* **Selected Option**: **Server transmits `{"event_type": "ping", "server_time": ...}` every `WS_KEEPALIVE_INTERVAL_S` (30 seconds)**
* **Context**: Detecting dead TCP sockets through intermediaries, firewalls, and NAT proxies.
* **Rationale**: Keeps WebSocket connections active through standard idle-timeout proxies while allowing clients to monitor connection vitality without requiring complex client-side heartbeat logic.

---

### D-023: WebSocket Unauthenticated Endpoint Policy
* **Current Status**: **ACCEPTED (Phase 5)**
* **Selected Option**: **Endpoint `/api/v1/ws/telemetry` is unauthenticated in Phase 5; authentication remains TBD per Phase 0 baseline**
* **Context**: Security and authentication requirements for real-time live monitoring.
* **Rationale**: Consistent with Phase 1–4 REST endpoints where security/auth mechanisms remain unprescribed by the project overview (D-006). Adding arbitrary authentication would violate Phase 0 anti-hallucination rules.

---

### D-024: Client-Initiated Node Subscription Filtering
* **Current Status**: **ACCEPTED (Phase 5)**
* **Selected Option**: **Optional node filter via `SubscriptionMessage {"action": "subscribe", "node_identifier": "..."}`. Default is all nodes**
* **Context**: Dashboards focusing on a single mine zone or node without wanting the network overhead of all mine telemetry.
* **Rationale**: In-process broadcaster filters at fan-out time in Python memory without requiring multiple WebSocket endpoints or complex routing topics.

---

### D-025: Prototype Risk Classification Scheme (NORMAL / ELEVATED / HIGH)
* **Current Status**: **ACCEPTED (Phase 6)**
* **Selected Option**: **Categorical risk tiers: NORMAL (0 factors), ELEVATED (1 WARNING factor), HIGH (>=2 factors or any CRITICAL factor)**
* **Context**: The project overview mandates node-level risk scoring and classification (BE-REQ-016), but does not define an authoritative regulatory classification scale or quantitative formula.
* **Rationale**: Using the minimal explainable classification allows operators to quickly distinguish normal conditions from single and compound hazard states, while explicitly documenting that this is an engineering prototype rather than a statutory safety standard.

---

### D-026: Prototype Alert Severity Tiers (WARNING / CRITICAL)
* **Current Status**: **ACCEPTED (Phase 6)**
* **Selected Option**: **Two severity levels: WARNING and CRITICAL**
* **Context**: Categorizing alerts triggered by threshold breaches, multi-parameter correlation, and unresponsive nodes.
* **Rationale**: A two-tier model clearly distinguishes advisory conditions (e.g. single environmental parameter elevated) from urgent hazard conditions (e.g. joint multi-parameter correlation or critical gas limit), without creating an ungrounded hierarchy of alert categories.

---

### D-027: Configurable Node Watchdog Inactivity Timeout
* **Current Status**: **ACCEPTED (Phase 6)**
* **Selected Option**: **Configurable `NODE_UNRESPONSIVE_TIMEOUT_S = 60` seconds**
* **Context**: Detecting dead or disconnected nodes (BE-REQ-023). Exact packet intervals are unspecified in the project overview.
* **Rationale**: A 60-second configurable default provides responsive prototype failure detection while remaining adjustable via environment variables for slower field radio schedules without code changes.

---

### D-028: Deterministic Alert Deduplication Key & Auto-Resolution Policy
* **Current Status**: **ACCEPTED (Phase 6)**
* **Selected Option**: **Unique `condition_key` per rule/cause; deduplicate existing ACTIVE alerts; auto-resolve when condition clears**
* **Context**: Continuous high-frequency telemetry satisfying the same breach condition would otherwise generate thousands of duplicate alert records.
* **Rationale**: Keying on `(node_id, condition_key, status='ACTIVE')` maintains an ongoing active state for persistent abnormal conditions while automatically recording resolution timestamps once sensor parameters return to normal.

---

### D-029: AI / Anomaly Detection Algorithm Selection
* **Current Status**: **ACCEPTED (Phase 7)**
* **Selected Option**: **Unsupervised statistical anomaly detection — Rolling Z-score (univariate) + Normalized Euclidean RMS compound deviation (multivariate)**
* **Context**: BE-REQ-015 requires anomaly detection across sensor streams. No labeled mine failure dataset exists; supervised ML cannot be trained responsibly.
* **Rationale**: Statistical Z-score detection is transparent, explainable, zero-training-required, and operates correctly on live telemetry streams from the first warm-up window. The multivariate compound detector adds cross-sensor correlation without any labeled data dependency. Both methods are explicitly labeled as **Prototype Assistive** outputs.
* **Alternatives Rejected**:
  - LSTM / Autoencoder: Requires labeled training data — would fabricate accuracy claims. Deferred.
  - Isolation Forest (scikit-learn): scikit-learn not installed in project; adding it to support production is out of Phase 7 scope.

---

### D-030: AI Anomaly Threshold as Statistical Boundary, Not Safety Limit
* **Current Status**: **ACCEPTED (Phase 7)**
* **Selected Option**: **`τ = 3.0` standard deviations (configurable via `AI_ANOMALY_ZSCORE_THRESHOLD`)**
* **Context**: The decision boundary must be clearly differentiated from Phase 6 engineering safety thresholds.
* **Rationale**: 3σ is a well-established statistical outlier boundary in process monitoring, corresponding to roughly 99.7% of a normal distribution. It is explicitly **NOT** an engineering safety limit. All API responses and model metadata carry a `disclaimer` field encoding this constraint.

---

### D-031: AI Anomaly Persistence in Dedicated Table
* **Current Status**: **ACCEPTED (Phase 7)**
* **Selected Option**: **`ai_anomalies` table; completely separate from `alerts` and `risk_assessments`**
* **Context**: AI evaluation results must not contaminate the deterministic safety record.
* **Rationale**: Keeping AI results in an isolated table ensures that Phase 6 alert deduplication, risk scoring, and regulatory audit trail are never polluted by probabilistic AI signals. The separation also allows the AI table to be cleared or retrained independently.

---

### D-032: AI Strict Assistive Role — No Alert Override
* **Current Status**: **ACCEPTED (Phase 7)**
* **Selected Option**: **AI anomaly records do NOT create Phase 6 alerts; AI evaluation occurs after alert sync**
* **Context**: Must preserve safety determinism. Phase 6 safety rules are the authoritative alert source.
* **Rationale**: If AI scores could generate alerts, safety guarantees would depend on the correctness of a statistical model rather than auditable configuration. The assistive-only constraint means operators are informed by AI without safety-critical decisions being delegated to it.

---

### D-033: Dashboard REST API Resource Hierarchy & Presentation Model
* **Current Status**: **ACCEPTED (Phase 8)**
* **Selected Option**: **Standardized hierarchical REST endpoints (`/mines`, `/zones`, `/nodes`, `/dashboard/overview`)**
* **Context**: The monitoring dashboard requires structured navigation across mine facilities, operational zones, and field-deployed integrated nodes, along with their mounted sensor suites.
* **Rationale**: Mirroring the domain model hierarchy established in Phase 2 allows clean front-end navigation and spatial querying. By providing both lightweight summary models for listings and rich detail models with embedded child relations (e.g. `ZoneSummaryResponse` on Mine detail, `NodeSummaryResponse` on Zone detail, and `SensorInfoResponse` on Node detail), clients minimize over-fetching while getting complete relational context in a single request.

---

### D-034: Presentation Query Filtering & Navigation Conventions
* **Current Status**: **ACCEPTED (Phase 8)**
* **Selected Option**: **Query-parameter filtering (`mine_id` on zones; `zone_id` and `status` on nodes) with deterministic sort order**
* **Context**: Dashboards frequently filter nodes or zones by operational section or health status (e.g., viewing only unresponsive nodes or nodes in a specific extraction gallery).
* **Rationale**: Standardized query filters avoid client-side dataset filtering while maintaining index performance. Consistent sorting by human-readable identifiers provides predictable list stability across polling intervals.

---

### D-035: Dashboard Overview Snapshot Aggregation Semantics
* **Current Status**: **ACCEPTED (Phase 8)**
* **Selected Option**: **Consolidated read-only snapshot delegating directly to `RiskService` and `AlertService` without duplicating domain logic**
* **Context**: The dashboard homepage requires a unified operational overview showing facility counts, node liveness, active alerts breakdown by severity, and zone-level risk statuses for the Mine Risk Map.
* **Rationale**: Thin delegation ensures zero divergence between dashboard numbers and core engine state. Specifically, zone risk rollup invokes `RiskService.evaluate_zone_risk()`, ensuring identical risk level rules and liveness thresholds (`NODE_UNRESPONSIVE_TIMEOUT_S`) apply universally. Active alerts are categorized directly from persisted state by severity tier (WARNING / CRITICAL).

---

### D-036: CORS and HTTP Security Headers Policy
* **Current Status**: **ACCEPTED (Phase 9)**
* **Selected Option**: **Configurable `CORSMiddleware` + mandatory HTTP security response headers**
* **Context**: Need to support cross-origin dashboard communication in development while enforcing standard browser defense-in-depth headers.
* **Rationale**: `CORS_ALLOWED_ORIGINS` defaults to wildcard for developer ease in prototype environments, but is loaded dynamically via Pydantic settings for production confinement. Injected headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`) mitigate MIME-sniffing, clickjacking, and referrer leakage across all endpoints.

---

### D-037: Input Payload Bounding for Telemetry Ingestion (Max Readings per Frame)
* **Current Status**: **ACCEPTED (Phase 9)**
* **Selected Option**: **`max_length=500` readings per `TelemetryIngestionRequest` frame**
* **Context**: Unbounded arrays in HTTP payloads allow denial-of-service or memory exhaustion via single oversized requests.
* **Rationale**: Prototype mine node frames typically carry 5–20 readings per transmission. A ceiling of 500 allows generous room for multi-modality bursts or gateway buffering while preventing memory exhaustion attacks.

---

### D-038: Separation of Liveness and Readiness Probes
* **Current Status**: **ACCEPTED (Phase 9)**
* **Selected Option**: **`/health/liveness` for process heartbeat; `/health/readiness` with live DB connectivity probe (`SELECT 1`) returning 503 on database disconnect**
* **Context**: Container orchestrators and load balancers must distinguish whether the Python process is alive versus capable of servicing operational database transactions.
* **Rationale**: `/health` is preserved as 200 OK for backward compatibility. `/health/liveness` checks process execution, while `/health/readiness` verifies database reachability. Downstream optional subsystems (AI, WebSockets) do not fail readiness, preventing false cascade outages.

---

### D-039: Graceful Lifecycle Resource Shutdown Architecture
* **Current Status**: **ACCEPTED (Phase 9)**
* **Selected Option**: **Lifespan hook calling `telemetry_broadcaster.shutdown()` and `close_db_engine()`**
* **Context**: SIGTERM/SIGINT during deployments or container recycling can cause connection leaks, stranded client queues, or uncommitted transaction deadlocks.
* **Rationale**: Disconnecting and draining in-process WebSocket client queues releases memory immediately, and `await engine.dispose()` closes pooled database connections cleanly without socket corruption.

---

### D-040: Configurable In-Memory Rate Limiting Abuse Guard
* **Current Status**: **ACCEPTED (Phase 9)**
* **Selected Option**: **Configurable toggle (`RATE_LIMIT_ENABLED=false`, `RATE_LIMIT_PER_MINUTE=600`)**
* **Context**: Protecting ingestion and query endpoints against flooding during production operations without breaking local integration tests or rapid benchmark ingestion.
* **Rationale**: Disabled by default in development to prevent test suite interference, with configurable settings ready for production activation.

---

### D-041: Containerization Architecture (Dockerfile & Multi-Profile Docker Compose)
* **Current Status**: **ACCEPTED (Phase 10)**
* **Selected Option**: **Lightweight `python:3.12-slim` base with non-root user and multi-service Compose supporting local SQLite and PostgreSQL targets**
* **Context**: The prototype backend requires reproducible deployment without assuming proprietary cloud services or Kubernetes orchestration.
* **Rationale**: A standardized Docker container with non-root security (`appuser`) and container `HEALTHCHECK` probe provides portable deployment across any Docker-compatible server. Docker Compose orchestrates the FastAPI application alongside a production-grade PostgreSQL 16 container while maintaining volume persistence.

---

### D-042: CI Automated Validation Workflow (GitHub Actions)
* **Current Status**: **ACCEPTED (Phase 10)**
* **Selected Option**: **GitHub Actions workflow (`.github/workflows/ci.yml`) validating dependencies, database migrations, and complete test suite**
* **Context**: Preventing regressions and ensuring that all migration revisions apply cleanly to fresh databases on every pull request and push.
* **Rationale**: Zero-configuration, standard across modern git repositories, and executes the exact same migration and pytest commands run locally.

---

### D-043: Synthetic Demonstration Data Strategy
* **Current Status**: **ACCEPTED (Phase 10)**
* **Selected Option**: **Standalone CLI seeder (`scripts/seed_demo_data.py`) with explicit synthetic disclaimer**
* **Context**: Live demonstrations and integration evaluation require populated facilities, operational zones, integrated nodes across all 9 sensor capabilities, active and unresponsive nodes, prototype safety rules, and initial historical telemetry.
* **Rationale**: Generates structured, deterministic demonstration data without contaminating code with hard-coded records or falsifying real mine safety claims. All output prominently carries synthetic disclaimers.


