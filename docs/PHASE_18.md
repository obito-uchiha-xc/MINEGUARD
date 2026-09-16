# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 18: AI / Anomaly Integration + Authentication & User Management

**Document Version**: 1.0  
**Phase Status**: **COMPLETED** (Hard Stop before Phase 19)

---

## 1. Phase Objective

Connect the existing frontend to:
1. The backend's Phase 7 **AI / Anomaly Detection** capabilities; and
2. The backend's **Authentication & User Management** state, adhering strictly to anti-hallucination source-of-truth guidelines.

---

## 2. Existing Architecture Discovered & Used

### AI / Anomaly Detection
- **Backend Service**: `AIService` in `backend/app/services/ai/ai_service.py` wrapping:
  - `StatisticalAnomalyDetector`: Unsupervised rolling window Z-score detector (Z > 3.0, window = 30).
  - `MultiVariateAnomalyDetector`: Mahalanobis covariance distance across multi-sensor pairs.
- **Backend Endpoints**:
  - `GET /api/v1/ai/models`: Model metadata, algorithm, parameters, and assistive disclaimer.
  - `GET /api/v1/ai/nodes/{node_identifier}/latest`: Recent anomaly evaluation records for a node.
  - `GET /api/v1/ai/nodes/{node_identifier}/history`: Historical anomaly records with filters (`sensor_type`, `is_anomaly`, `from_dt`, `to_dt`, `limit`).
- **Endpoint Removed from Client**: `POST /api/v1/ai/nodes/{id}/evaluate` was present in `aiService.ts` but did not exist in backend `ai.py`; removed to avoid unmapped API calls.

### Authentication & User Management
- **Backend Status**: **🟡 TBD** (ADR D-006, BE-REQ-030).
- **Backend Reality**: No user models, no passwords, no tokens, and no user CRUD endpoints exist in the backend. All endpoints are currently unauthenticated in prototype mode.
- **Frontend Action**: Strictly adhering to Sections 4, 21, 29, and 40, no fake frontend authentication (`isLoggedIn = true`) or simulated user database was created. UI prototypes (`UsersPage`, `UserDropdown`) were preserved with transparent 🟡 TBD notices and disabled actions.

---

## 3. Implementation Details

### 3.1 AI Service & Data Layer
- [frontend/src/services/aiService.ts](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/frontend/src/services/aiService.ts):
  - Exposes `getModels()`, `getLatestAnomalies(nodeIdentifier)`, `getAnomalyHistory(nodeIdentifier, params)`.
  - Removed phantom `triggerEvaluation` method.

### 3.2 Analytics Page (`AnalyticsPage.tsx`)
- Refactored to eliminate fabricated AI metrics:
  - Removed hardcoded failure mode probabilities ("Rotational Bench Crest Failure 74%", "Planar Wedge Sliding 38%").
  - Removed fabricated feature weights ("Displacement Rate 32%").
  - Removed fake InSAR satellite R² metric ("0.92 R²").
  - Removed simulated 900ms recalculation timer and browser `alert()` popups.
- Connected real backend capabilities:
  - **Models Tab**: Queries `aiService.getModels()` to display active prototype detectors (`StatisticalAnomalyDetector`, `MultiVariateAnomalyDetector`), their rolling Z-score parameters, algorithms, and disclaimers.
  - **Node Anomaly Inspector**: Interactive node selector loading registered nodes from `nodesService.listNodes()` and displaying real evaluation records from `aiService.getAnomalyHistory()`.
  - **Kinematic & Failure Theory References**: Theoretical geotechnical references are preserved for educational and TARP reference with explicit disclaimers: "Kinematic ML classification 🟡 TBD (Theoretical TARP reference)".

### 3.3 User Management (`UsersPage.tsx` & `UserDropdown.tsx`)
- **`UsersPage.tsx`**:
  - Added an `AlertBanner` stating that backend user provisioning and authentication are unconfigured (🟡 TBD per ADR D-006 and BE-REQ-030).
  - Disabled "Register Personnel" button with clear tooltip.
  - Removed disruptive browser `alert()` call.
- **`UserDropdown.tsx`**:
  - Removed simulated `alert()` calls on "Operator Credentials", "Preferences", and "Lock Session".
  - Added status label indicating: `Session: Local Demo (Auth 🟡 TBD per D-006)`.

---

## 4. Source-of-Truth Classification

### 🟢 SPEC
- `GET /api/v1/ai/models`: Verified OpenAPI schema and handler in `backend/app/api/v1/ai.py`.
- `GET /api/v1/ai/nodes/{node_identifier}/latest`: Verified OpenAPI schema returning `AIAnomalyRecordResponse[]`.
- `GET /api/v1/ai/nodes/{node_identifier}/history`: Verified OpenAPI schema supporting filters.
- AI Assistive Role: AI anomalies do not override Phase 6 deterministic safety rules (BE-REQ-015, D-032).

### 🔵 DECISIONS
- Preserved theoretical Saito inverse velocity curve as an educational/TARP reference card in `AnalyticsPage.tsx` with explicit disclaimer that kinematic failure modeling is 🟡 TBD.
- Kept the personnel roster in `UsersPage.tsx` as a demonstration layout while clearly documenting the lack of backend CRUD endpoints.

### 🟡 TBD / UNKNOWN
- Automated slope failure mechanism classification (rotational, planar, toppling).
- Automated tertiary creep curve fitting and time-to-failure forecasting.
- InSAR / satellite radar interferometry ingestion pipeline.
- Backend user authentication (JWT/OAuth2/SSO), user models, password policies, and RBAC roles (ADR D-006).

---

## 5. Testing & Verification

- **Frontend Tests** (`test/api-client.test.mjs`):
  - Added Suite 6 covering `aiService.getModels`, `aiService.getLatestAnomalies`, `aiService.getAnomalyHistory`, and verification of endpoint contract.
  - All 22 tests passing:
    ```text
    ✔ 1. API Query String Builder (2 tests)
    ✔ 2. Error Parsing & ApiError Model (3 tests)
    ✔ 3. HTTP API Client Execution (4 tests)
    ✔ 4. Data Transformation Adapters (6 tests)
    ✔ 5. UTC Timestamp Utilities (3 tests)
    ✔ 6. AI / Anomaly Detection Service & Verification (4 tests)
    ℹ tests 22, suites 6, pass 22, fail 0
    ```
- **Linter & Build**:
  - `oxlint`: 0 warnings, 0 errors.
  - `tsc -b && vite build`: Succeeded with 0 TypeScript errors.
- **Backend Tests**:
  - `pytest tests/test_ai_anomaly.py`: 31 passed in 2.34s.

---

## 6. Known Limitations

- Real-time AI anomaly WebSocket events (`LiveAnomalyEvent`) are delivered over the WebSocket channel from Phase 5, but on-demand re-training or manual triggering via HTTP POST is unsupported by the backend.
- Full role-based route protection requires implementing backend authentication in a dedicated future security phase.
