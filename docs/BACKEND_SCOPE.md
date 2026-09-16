# SIH 2026 Integrated Mine Safety Monitoring System
## Backend Scope Boundary Document

**Document Version**: 1.0 (Phase 0 Baseline)  
**Authoritative Reference**: SIH 2026 Overview Document (Sections 13 & 14)

---

## 1. IN SCOPE (Prototype Backend Baseline)

The backend scope for the prototype covers solely the core architectural capabilities mandated by the project overview (Sec. 13):

1. **Multi-Sensor Telemetry Ingestion Pipeline**:
   - Ingestion of displacement, vibration, crack progression, environmental (temperature, humidity, barometric pressure), and gas ($\text{CH}_4$, $\text{CO}$, $\text{O}_2$) telemetry.
   - Extensible data ingestion format allowing for additional mine gas sensors.

2. **Node Identification & Gateway Interface**:
   - Processing data forwarded from a central Mother System gateway.
   - Unique node identification and node-to-zone spatial association.
   - Monitoring node communication liveness / unresponsive node detection.

3. **Cloud Storage & Persistence Engine**:
   - Time-series persistence of all historical sensor telemetry.
   - Node-wise historical query capability for trend rendering and longitudinal analysis.

4. **AI Analytics & Multi-Parameter Risk Engine**:
   - Anomaly detection across incoming and historical sensor streams.
   - Multi-parameter correlation engine (e.g., compounding displacement + vibration + crack progression + environmental shifts).
   - Node-level risk scoring and categorical risk classification.
   - Trend analysis and early-warning indicators.

5. **Alert Management & Event Dispatcher**:
   - Evaluating and firing alerts for:
     1. Sensor threshold crossings.
     2. Anomaly detection flags.
     3. Multi-parameter combined risk conditions.
     4. Node unresponsive timeout states.

6. **Dashboard Data Feeds & Spatial Zone Aggregation**:
   - Serving live telemetry feeds per node.
   - Serving spatial zone risk aggregation (e.g., Zone A, Zone B, Zone C, Zone D) for the Mine Risk Map.
   - Serving historical trend series for charting.
   - Serving active and historical alert feeds.

7. **Scalability Demonstration**:
   - Architectural capability to handle multiple concurrent nodes ($N \ge 2$) without redesigning the ingestion or storage pipeline.

---

## 2. OUT OF SCOPE FOR PHASE 0

The following activities are strictly prohibited during Phase 0:

- Writing application framework code (e.g., FastAPI routes, Express controllers, Django apps).
- Writing database schema migrations, ORM models, or spinning up database containers.
- Writing production machine learning models, training scripts, or heuristic code.
- Installing runtime dependencies (`npm install`, `pip install`, `poetry install`).
- Configuring cloud infrastructure, Dockerfiles, or CI/CD pipelines.
- Inventing and fixing numerical safety limits or proprietary protocol formats.

---

## 3. FUTURE SCOPE (Explicitly Documented in Section 14)

The project overview explicitly designates the following capabilities as future work to be implemented beyond the initial prototype:

1. **Larger Node Networks**:
   - Mass deployment of nodes across widespread underground mine shafts and deep extraction galleries.
2. **Improved AI Models**:
   - Training complex machine learning / deep learning models on large-scale, real-world historical mining datasets to refine early-warning precision.
3. **Predictive Safety Forecasting**:
   - Moving from current anomaly/risk detection to multi-step temporal forecasting of potential structural or gas failures *before* thresholds are approached.
4. **Edge Intelligence**:
   - Deploying embedded AI inference directly on the Integrated Nodes or Mother System hardware for ultra-low-latency local autonomous decisions and reduced bandwidth.
5. **Industrial-Grade Certified Sensors**:
   - Replacing prototype sensors with intrinsically safe, explosion-proof, and mining-certified sensor instrumentation.
6. **Integration with Existing Mine Infrastructure**:
   - Interfacing with existing SCADA, industrial PLCs, ventilation controllers, and mine communication backbones.
7. **Automated Emergency Response**:
   - Actuating automated sirens, emergency ventilation boosters, automated shaft barriers, or personnel evacuation triggers.
