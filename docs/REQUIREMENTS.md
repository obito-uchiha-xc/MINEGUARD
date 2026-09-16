# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 0: Backend Requirements Specification Baseline

**Status**: FROZEN (Phase 0)  
**Classification Guide**:
- `SPEC`: Explicitly stated or directly supported by the project overview document.
- `DECISION`: Implementation choice not specified in the document; must be consciously decided in later phases.
- `TBD`: Information currently unknown/unspecified; must NOT be assumed.

---

## 1. System Architecture & Component Traceability

The project defines an end-to-end 4-tier distributed architecture:
$$\text{Integrated Node} \xrightarrow{\text{LoRa}} \text{Mother System} \xrightarrow{\text{Cloud Ingestion}} \text{Cloud Storage / AI Analysis} \xrightarrow{\text{Data Feeds}} \text{Dashboard}$$

---

## 2. Master Backend Requirements Catalog

| ID | Requirement Statement | Source Reference | Category | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-REQ-001** | Backend must support telemetry ingestion originating from multiple distributed Integrated Nodes. | Sec. 1, 5, 12 (pp. 1, 4, 8) | Architecture / Ingestion | Critical | **SPEC** |
| **BE-REQ-002** | Backend must process data forwarded by a central Mother System gateway acting as the communication bridge. | Sec. 1, 6 (pp. 1, 4) | Ingestion / Gateway | Critical | **SPEC** |
| **BE-REQ-003** | System must uniquely identify individual Integrated Nodes within the network. | Sec. 6, 7 (pp. 4, 5) | Node Management | Critical | **SPEC** |
| **BE-REQ-004** | System must associate and manage telemetry on a node-wise basis. | Sec. 7 (p. 5) | Data Model | High | **SPEC** |
| **BE-REQ-005** | Backend must store and maintain historical sensor telemetry over time. | Sec. 7, 9 (pp. 5, 6) | Storage / Persistence | Critical | **SPEC** |
| **BE-REQ-006** | Backend must enable retrieval of historical time-series data for trend analysis and visualization. | Sec. 7, 9 (pp. 5, 6) | API / Query | High | **SPEC** |
| **BE-REQ-007** | Backend must support continuous and live monitoring telemetry feeds to the dashboard. | Sec. 1, 9 (pp. 1, 6) | Real-time / Telemetry | High | **SPEC** |
| **BE-REQ-008** | Ingestion pipeline must accept displacement/structural deformation data from nodes. | Sec. 4.1 (p. 3) | Sensor Telemetry | Critical | **SPEC** |
| **BE-REQ-009** | Ingestion pipeline must accept vibration dynamic disturbance data from nodes. | Sec. 4.2 (p. 3) | Sensor Telemetry | Critical | **SPEC** |
| **BE-REQ-010** | Ingestion pipeline must accept crack progression data from nodes. | Sec. 4.3 (p. 3) | Sensor Telemetry | Critical | **SPEC** |
| **BE-REQ-011** | Ingestion pipeline must accept environmental data: temperature, humidity, and barometric pressure. | Sec. 4.4 (p. 3) | Sensor Telemetry | High | **SPEC** |
| **BE-REQ-012** | Ingestion pipeline must accept hazardous gas data: Methane ($\text{CH}_4$), Carbon Monoxide ($\text{CO}$), and Oxygen ($\text{O}_2$). | Sec. 4.5 (p. 3) | Sensor Telemetry | Critical | **SPEC** |
| **BE-REQ-013** | Ingestion pipeline must be extensible to accept other relevant gases depending on the deployment environment. | Sec. 4.5 (p. 3) | Sensor Telemetry | Medium | **SPEC** |
| **BE-REQ-014** | AI layer must perform multi-parameter correlation rather than evaluating sensors in isolation. | Sec. 2, 8, 10 (pp. 1, 5, 7) | AI / Risk Engine | Critical | **SPEC** |
| **BE-REQ-015** | AI layer must perform anomaly detection on incoming and historical sensor streams. | Sec. 8, 13 (pp. 5, 9) | AI / Risk Engine | High | **SPEC** |
| **BE-REQ-016** | AI layer must compute node-level risk scoring and risk classification. | Sec. 8, 17 (pp. 6, 11) | AI / Risk Engine | Critical | **SPEC** |
| **BE-REQ-017** | AI layer must support early-warning prediction of developing structural or environmental risks. | Sec. 8 (p. 6) | AI / Prediction | High | **SPEC** |
| **BE-REQ-018** | AI layer must support trend analysis over time-series parameters. | Sec. 8 (p. 6) | AI / Analytics | High | **SPEC** |
| **BE-REQ-019** | Backend must aggregate and map node risk scores to operational mine zones (e.g., Zone A, Zone B, Zone C, Zone D). | Sec. 9 (p. 6) | Spatial / Risk Map | High | **SPEC** |
| **BE-REQ-020** | Backend must trigger and dispatch alerts when sensor values cross defined thresholds. | Sec. 9, 12 (pp. 6, 7) | Alerting | Critical | **SPEC** |
| **BE-REQ-021** | Backend must trigger and dispatch alerts when abnormal patterns are detected by AI. | Sec. 9, 12 (pp. 6, 7) | Alerting | High | **SPEC** |
| **BE-REQ-022** | Backend must trigger and dispatch alerts when multiple parameters jointly indicate increasing risk. | Sec. 9, 10, 12 (pp. 6, 7) | Alerting | Critical | **SPEC** |
| **BE-REQ-023** | Backend must trigger and dispatch alerts when an Integrated Node becomes unresponsive. | Sec. 9, 12 (pp. 6, 7) | Alerting / Health | Critical | **SPEC** |
| **BE-REQ-024** | Architecture must support adding additional Integrated Nodes without redesigning the core system. | Sec. 6, 12 (pp. 4, 8) | Scalability | High | **SPEC** |
| **BE-REQ-025** | Mother System to Cloud transport protocol (e.g., MQTT, HTTPS REST, WebSockets, gRPC). | Not specified in doc | Transport Protocol | High | **DECISION** |
| **BE-REQ-026** | Database management system selection (e.g., PostgreSQL, TimescaleDB, InfluxDB, MongoDB). | Not specified in doc | Persistence Tech | Critical | **DECISION** |
| **BE-REQ-027** | Backend language and application framework (e.g., Python FastAPI, Node.js Express). | Not specified in doc | Backend Tech | Critical | **DECISION** |
| **BE-REQ-028** | Real-time push mechanism to Dashboard (e.g., WebSockets, Server-Sent Events, Long Polling). | Not specified in doc | Presentation Push | High | **DECISION** |
| **BE-REQ-029** | Specific machine learning / statistical algorithms for anomaly detection and risk classification. | Not specified in doc | AI Algorithm | High | **DECISION** |
| **BE-REQ-030** | Authentication and authorization mechanism for dashboard and gateway endpoints. | Not specified in doc | Security | High | **DECISION** |
| **BE-REQ-031** | Numerical safety thresholds for displacement, vibration, cracks, and gas concentrations. | Not specified in doc | Safety Config | High | **TBD** |
| **BE-REQ-032** | Sensor sampling rates, packet transmission intervals, and heartbeat timeout durations. | Not specified in doc | Ingestion Telemetry | High | **TBD** |
| **BE-REQ-033** | Physical units and precision format for sensor readings (e.g., mm, mm/s, ppm, %, hPa). | Not specified in doc | Data Schema | Medium | **TBD** |
| **BE-REQ-034** | Mathematical formula or weighting function for composite multi-parameter risk scoring. | Not specified in doc | Risk Logic | High | **TBD** |

---

## 3. Data Requirements Analysis

### 3.1 Sensor / Parameter Verification Matrix

| Sensor / Parameter | Explicitly Mentioned? | Required? | Unit Specified in Document? | Sampling Rate Specified? | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Displacement / Deformation** | Yes (Sec. 4.1, p. 3) | Yes | **TBD — Not specified** | **TBD — Not specified** | **SPEC** |
| **Vibration** | Yes (Sec. 4.2, p. 3) | Yes | **TBD — Not specified** | **TBD — Not specified** | **SPEC** |
| **Crack Progression** | Yes (Sec. 4.3, p. 3) | Yes | **TBD — Not specified** | **TBD — Not specified** | **SPEC** |
| **Temperature** | Yes (Sec. 4.4, p. 3) | Yes | **TBD — Not specified** | **TBD — Not specified** | **SPEC** |
| **Humidity** | Yes (Sec. 4.4, p. 3) | Yes | **TBD — Not specified** | **TBD — Not specified** | **SPEC** |
| **Pressure** | Yes (Sec. 4.4, p. 3) | Yes | **TBD — Not specified** | **TBD — Not specified** | **SPEC** |
| **Methane ($\text{CH}_4$)** | Yes (Sec. 4.5, p. 3) | Yes | **TBD — Not specified** | **TBD — Not specified** | **SPEC** |
| **Carbon Monoxide ($\text{CO}$)** | Yes (Sec. 4.5, p. 3) | Yes | **TBD — Not specified** | **TBD — Not specified** | **SPEC** |
| **Oxygen ($\text{O}_2$)** | Yes (Sec. 4.5, p. 3) | Yes | **TBD — Not specified** | **TBD — Not specified** | **SPEC** |
| **Other Relevant Gases** | Yes (Sec. 4.5, p. 3) | Optional/Extensible | **TBD — Not specified** | **TBD — Not specified** | **SPEC** |

### 3.2 Node & Spatial Metadata Requirements
* **Node Identity**: Required (System must identify individual nodes, Sec. 6).
* **Location / Zone Association**: Required (System must represent monitored zones like Zone A, B, C, D, Sec. 9).
* **Node Status**: Required (System must detect when a node is unresponsive, Sec. 9).
* **Mine Association**: Stated at architectural level; precise coordinate format (2D vs 3D) is **TBD — Not specified in project overview**.

### 3.3 Historical & Risk Data Requirements
* **Historical Telemetry**: Retention of time-series records across all parameters for long-term trend evaluation.
* **Risk Data Output**:
  - Node-level risk score: **SPEC**
  - Zone-level risk status: **SPEC**
  - Risk classification category: **SPEC**
  - Trend / Early warning indicators: **SPEC**
  - Exact numerical scale of risk score: **TBD — Not specified in project overview**

### 3.4 Alert Trigger Specification

| Trigger Condition | Supported by Document? | Threshold / Logic Specified in Source? | Status |
| :--- | :--- | :--- | :--- |
| **Sensor threshold crossing** | Yes (Sec. 9, p. 7) | **TBD — Numerical threshold not specified** | **SPEC** |
| **Abnormal pattern detected** | Yes (Sec. 9, p. 7) | **TBD — Pattern detection algorithm not specified** | **SPEC** |
| **Multiple parameters indicating risk** | Yes (Sec. 9, 10, p. 7) | **TBD — Correlation formula/model not specified** | **SPEC** |
| **Node becomes unresponsive** | Yes (Sec. 9, p. 7) | **TBD — Heartbeat timeout duration not specified** | **SPEC** |

---

## 4. Communication & Gateway Specification

### What the Document Establishes about LoRa:
* Integrated Nodes communicate with Mother System via **LoRa**.
* Rationale: Long communication distance, low-power devices, distributed nodes, low-bandwidth data, and lack of underground Wi-Fi.
* Architecture: Multiple nodes uplink to a central Mother System.

### What is Explicitly NOT Specified (Do NOT Assume):
* **LoRaWAN vs. Proprietary Point-to-Multipoint LoRa**: **TBD**
* **Frequency bands (865–867 MHz, 915 MHz, 433 MHz)**: **TBD**
* **Spreading Factor (SF7–SF12) & Bandwidth**: **TBD**
* **Packet payload structure (Binary packed, JSON, Protocol Buffers)**: **TBD**
* **Encryption (AES-128, TLS over gateway bridge)**: **TBD**

---

## 5. Prototype Scope Freeze (Section 13)

The prototype backend must demonstrate:
1. Multi-sensor ingestion (all 5 sensing modalities).
2. Sensor data acquisition from nodes.
3. LoRa-based communication path representation.
4. Mother System gateway data reception and relay.
5. Cloud data transmission and persistence.
6. AI-based multi-parameter correlation / anomaly detection.
7. Risk visualization data feeds (for Mine Risk Map & Gauges).
8. Historical time-series query feeds for trends.
9. Alert generation on the 4 defined conditions.
10. Multi-node scalability concept (handling $N \ge 2$ nodes across multiple zones).
