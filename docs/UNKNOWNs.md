# SIH 2026 Integrated Mine Safety Monitoring System
## Register of Project Unknowns & Unspecified Parameters

**Document Version**: 1.0 (Phase 0 Baseline)  
**Strict Anti-Hallucination Policy**: Every item listed below is confirmed to be **TBD — Not specified in project overview document**. Under Phase 0 rules, none of these may be assumed or invented without a documented decision.

---

## 1. Sensor & Data Acquisition Unknowns

| Parameter / Item | What is Known from Document | What is Unknown / Unspecified (TBD) |
| :--- | :--- | :--- |
| **Displacement / Deformation** | Measures changes in position or deformation (Sec. 4.1). | Physical unit (mm, cm, microstrain), measurement axis (1D/2D/3D), resolution, sensor model. |
| **Vibration** | Measures vibration and dynamic disturbances (Sec. 4.2). | Metric format (Peak Particle Velocity in mm/s, Acceleration in g, or RMS frequency spectrum). |
| **Crack Progression** | Monitors crack evolution over time (Sec. 4.3). | Measurement unit (mm, μm, optical/resistive displacement), sensor mechanism. |
| **Temperature** | Environmental context (Sec. 4.4). | Scale (°C, °F, K), precision, expected mine operating range. |
| **Humidity** | Environmental context (Sec. 4.4). | Absolute vs Relative Humidity (% RH), operating limits. |
| **Barometric Pressure** | Environmental context (Sec. 4.4). | Units (hPa, mbar, kPa), typical mine atmospheric range. |
| **Methane ($\text{CH}_4$)** | Hazardous gas sensing (Sec. 4.5). | Measurement unit (% by volume or % LEL - Lower Explosive Limit), sensor type (catalytic, NDIR). |
| **Carbon Monoxide ($\text{CO}$)** | Hazardous gas sensing (Sec. 4.5). | Measurement unit (ppm), sensor technology (electrochemical). |
| **Oxygen ($\text{O}_2$)** | Hazardous gas sensing (Sec. 4.5). | Measurement unit (% concentration by volume). |
| **Other Relevant Gases** | Extensible gas monitoring mentioned (Sec. 4.5). | Specific identities of additional gases (e.g., $\text{H}_2\text{S}$, $\text{NO}_2$, $\text{CO}_2$). |
| **Sampling Frequency** | Continuous / real-time monitoring stated (Sec. 1). | Exact period (1 sec, 5 sec, 10 sec, 60 sec, event-driven). |

---

## 2. LoRa & Communication Unknowns

| Item | What is Known from Document | What is Unknown / Unspecified (TBD) |
| :--- | :--- | :--- |
| **LoRa Protocol Stack** | Nodes communicate with Mother System via LoRa (Sec. 5). | Raw proprietary LoRa point-to-multipoint vs. standardized LoRaWAN stack. |
| **Radio Frequency Band** | Low power, long distance stated (Sec. 5). | Regional frequency allocation (e.g., IN865 for India, EU868, US915). |
| **Modulation Parameters** | LoRa modulation used (Sec. 5). | Spreading Factor (SF7–SF12), Bandwidth (125/250/500 kHz), Coding Rate (4/5 to 4/8). |
| **Payload Data Format** | Sensor data transmitted (Sec. 5). | Byte packing specification (CBOR, Protocol Buffers, packed binary struct, or JSON string). |
| **Radio Encryption** | Secure communication implied by safety context. | Over-the-air cryptographic protocol (AES-128, session keys, or unencrypted prototype). |

---

## 3. Mother System Gateway Unknowns

| Item | What is Known from Document | What is Unknown / Unspecified (TBD) |
| :--- | :--- | :--- |
| **Uplink Transport** | Forwards data toward cloud infrastructure (Sec. 6). | Network protocol (HTTPS REST, MQTT broker connection, WebSocket stream, gRPC). |
| **Hardware Platform** | Aggregation layer & communication bridge (Sec. 6). | Edge device platform (Raspberry Pi, industrial SBC, ESP32 gateway, laptop). |
| **Edge Storage Buffer** | Local aggregation supported (Sec. 6). | Offline buffering capacity when cloud connection drops. |

---

## 4. AI & Risk Engine Unknowns

| Item | What is Known from Document | What is Unknown / Unspecified (TBD) |
| :--- | :--- | :--- |
| **Risk Scoring Formula** | Qualitative correlation: $\Delta\text{Disp} + \Delta\text{Vib} + \Delta\text{Crack} + \Delta\text{Env} \rightarrow \text{Risk}$ (Sec. 8, 10). | Mathematical weighting formula, normalizations, and quantitative index scale (0–100, 0.0–1.0). |
| **Anomaly Detection Algorithm** | Anomaly detection function required (Sec. 8, 13). | Algorithm class (Isolation Forest, One-Class SVM, Mahalanobis distance, Autoencoder, Z-Score). |
| **Training / Historical Dataset** | Cloud stores historical data (Sec. 7); AI analyzes trends (Sec. 8). | Zero baseline training datasets provided in project documentation. |
| **Inference Latency Target** | Early warning and live risk assessment stated (Sec. 1, 8). | Concrete latency budget for computing risk after telemetry arrival (e.g., < 100ms, < 1s). |

---

## 5. Alert & Safety Threshold Unknowns

| Item | What is Known from Document | What is Unknown / Unspecified (TBD) |
| :--- | :--- | :--- |
| **Sensor Threshold Limits** | Threshold crossing triggers alert (Sec. 9, 12). | Numerical limits are unspecified (TBD); handled via configurable `threshold_rules` (Phase 6). |
| **Heartbeat Timeout** | Unresponsive node triggers alert (Sec. 9, 12). | Packet timeout unspecified (TBD); configured via `NODE_UNRESPONSIVE_TIMEOUT_S = 60s` (🔵 D-027). |
| **Alert Severity Levels** | Alerts generated (Sec. 9, 12). | Regulatory tiers unspecified (TBD); prototype uses `WARNING` and `CRITICAL` (🔵 D-026). |


---

## 6. Spatial & UI Unknowns

| Item | What is Known from Document | What is Unknown / Unspecified (TBD) |
| :--- | :--- | :--- |
| **Mine Risk Map Geometry** | Monitored zones represented (e.g., Zone A, B, C, D) (Sec. 9). | Coordinate system (2D planar grid, SVG schematic, or 3D tunnel mesh). |
| **Dashboard Technology** | Unified dashboard interface (Sec. 9). | Frontend framework (React, Vue, Vanilla HTML/CSS/JS, Next.js). |

---

## 7. Security & Authentication Unknowns

| Item | What is Known from Document | What is Unknown / Unspecified (TBD) |
| :--- | :--- | :--- |
| **User Authentication** | Dashboard provides human decision interface (Sec. 18). | User identity provider, JWT / OAuth specification, credential storage, password policy (🟡 TBD). |
| **Role-Based Access Control** | Assists human operators (Sec. 8). | Specific user roles and permission matrices (e.g., Viewer, Operator, Administrator) (🟡 TBD). |
| **WebSocket Client Authentication** | Live dashboard feeds telemetry over WebSockets (Sec. 9). | Handshake authentication protocol (query token, auth ticket, or header) is TBD (D-023). |
| **Gateway Ingestion Authentication** | Edge gateway forwards data to backend (Sec. 6). | Gateway mTLS, bearer API key, or HMAC signature protocol is TBD (🟡 TBD). |


---

## 8. Database & Telemetry Storage Unknowns

| Item | What is Known from Document | What is Unknown / Unspecified (TBD) |
| :--- | :--- | :--- |
| **Telemetry Retention Policy** | Historical data storage & long-term trends required (Sec. 7). | Exact retention time window (e.g., 30 days, 1 year, indefinite audit retention) (🟡 TBD). |
| **Backup & Disaster Recovery** | High-reliability mine monitoring required (Sec. 1). | Backup schedule, RPO/RTO targets, offsite replication strategy (🟡 TBD). |
| **Physical Node ID Format** | System must identify individual nodes (Sec. 6). | Exact hardware identifier string format (e.g., MAC address, LoRa DevEUI, integer serial). |
| **Sensor Calibration Metadata** | Multi-sensor integration inside node (Sec. 4). | Storage schema for zero-offset calibration, slope multipliers, or sensitivity constants. |
| **Time-Series Partitioning Scale** | Scalable multi-node architecture (Sec. 12). | Exact data volume threshold where PostgreSQL table partitioning or TimescaleDB becomes necessary. |

