# SIH 2026 Integrated Mine Safety Monitoring System
## Assumption Register

**Document Version**: 1.0 (Phase 0 Baseline)  
**Strict Anti-Hallucination Policy**: No assumption listed below is treated as a confirmed project requirement.

---

### A-001: Backend Application Framework
- **Assumption**: Backend will be built using Python with FastAPI.
- **Status**: **NOT CONFIRMED (DECISION REQUIRED)**
- **Reason**: The project overview does not specify any backend programming language, runtime, or web framework.
- **Decision Required**: Yes, must be decided before Phase 1 implementation.

---

### A-002: Persistence / Database Management System
- **Assumption**: A time-series database (e.g., TimescaleDB, InfluxDB) or relational DB (PostgreSQL) is required.
- **Status**: **NOT CONFIRMED (DECISION REQUIRED)**
- **Reason**: The overview only states "Historical data storage" and "Cloud storage", without prescribing a database technology.
- **Decision Required**: Yes, database engine and schema design must be selected in Phase 1.

---

### A-003: Mother System to Cloud Communication Protocol
- **Assumption**: Mother System forwards data via MQTT broker or HTTPS REST POST.
- **Status**: **NOT CONFIRMED (DECISION REQUIRED)**
- **Reason**: The overview states "Forwarding data toward cloud infrastructure" via a "communication bridge", but does not mandate MQTT, HTTP, WebSockets, or gRPC.
- **Decision Required**: Yes, protocol contract must be formally decided.

---

### A-004: Dashboard Real-Time Transport
- **Assumption**: Live monitoring requires WebSockets for real-time pushing.
- **Status**: **NOT CONFIRMED (DECISION REQUIRED)**
- **Reason**: The overview states "Live Monitoring" and "Continuous monitoring", but Server-Sent Events (SSE), WebSockets, or short polling could satisfy this.
- **Decision Required**: Yes, transport mechanism must be chosen.

---

### A-005: Authentication and Access Control
- **Assumption**: The system requires JWT/OAuth authentication with distinct roles (Safety Officer, Admin, Field Engineer).
- **Status**: **NOT CONFIRMED (RECOMMENDED BUT NOT SOURCE SPECIFIED)**
- **Reason**: The project overview document does not mention user accounts, logins, roles, or access tokens.
- **Decision Required**: Yes, security and user management architecture must be evaluated.

---

### A-006: AI / ML Algorithm Selection
- **Assumption**: Anomaly detection and risk classification will use Isolation Forest, Autoencoder, or LSTM neural networks.
- **Status**: **NOT CONFIRMED (DECISION REQUIRED)**
- **Reason**: The document lists capabilities ("Anomaly detection", "Risk classification", "Sensor-data correlation") without mandating any specific ML model, algorithm, or statistical methodology.
- **Decision Required**: Yes, an algorithm or heuristic approach must be selected based on dataset availability.

---

### A-007: Sensor Physical Units
- **Assumption**: Displacement is in millimeters (mm), Vibration in mm/s or g, Temperature in °C, Humidity in %, Pressure in hPa, and Gases in ppm or %.
- **Status**: **NOT CONFIRMED (TBD)**
- **Reason**: The document mentions the parameters by name only, with zero units specified.
- **Decision Required**: Yes, standard SI / mining units must be explicitly assigned.

---

### A-008: Sampling Frequency and Transmission Interval
- **Assumption**: Nodes transmit sensor packets every 1 to 5 seconds.
- **Status**: **NOT CONFIRMED (TBD)**
- **Reason**: LoRa duty-cycle limits and low-power requirements in field deployments often require intervals of 10s–60s, but the document gives no specific frequency.
- **Decision Required**: Yes, prototype packet interval must be defined.

---

### A-009: Numerical Safety Thresholds
- **Assumption**: Critical alerts fire when Methane > 1.0% volume, CO > 50 ppm, or O2 < 19.5%.
- **Status**: **NOT CONFIRMED (TBD)**
- **Reason**: Standard DGMS/OSHA regulatory limits exist in industry, but the source document specifies zero numerical threshold values.
- **Decision Required**: Yes, safety threshold configuration must be defined for prototype demonstration.

---

### A-010: Multi-Parameter Risk Formula
- **Assumption**: Risk score is computed using a weighted linear combination of normalized sensor deviations.
- **Status**: **NOT CONFIRMED (DECISION / TBD)**
- **Reason**: The document illustrates a qualitative concept ($\text{Displacement} \uparrow + \text{Vibration} \uparrow + \text{Crack progression} \uparrow + \text{Env change} \rightarrow \text{Increasing risk}$) but gives no mathematical formula or weights.
- **Decision Required**: Yes, a concrete risk scoring logic must be formulated.

---

### A-011: Node Heartbeat Timeout for Unresponsive State
- **Assumption**: A node is marked unresponsive after 60 seconds of missing packets.
- **Status**: **NOT CONFIRMED (TBD)**
- **Reason**: The document states "A node becomes unresponsive" triggers an alert, but specifies no timeout threshold.
- **Decision Required**: Yes, timeout period must be configured.

---

### A-012: LoRa Implementation Protocol
- **Assumption**: LoRa communication implies standard LoRaWAN with an official LoRaWAN Gateway and Network Server (e.g., ChirpStack / The Things Network).
- **Status**: **NOT CONFIRMED (DECISION REQUIRED)**
- **Reason**: The document explicitly states "LoRa", not "LoRaWAN". It could be point-to-multipoint raw LoRa (e.g., SX1276/SX1262 SPI module with ESP32) or a LoRaWAN stack.
- **Decision Required**: Yes, hardware/firmware LoRa architecture must be decided.

---

### A-013: Cloud Deployment Provider
- **Assumption**: The cloud backend will be hosted on AWS, Microsoft Azure, or Google Cloud.
- **Status**: **NOT CONFIRMED (DECISION REQUIRED)**
- **Reason**: The document refers generically to "cloud infrastructure" and "cloud storage" without vendor mandates.
- **Decision Required**: Yes, deployment target must be determined.
