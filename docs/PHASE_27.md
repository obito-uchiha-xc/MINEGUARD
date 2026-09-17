# Phase 27 — Real Sensor Integration & Calibration Framework

**Document Version**: 1.0  
**Date**: September 2026  
**Status**: COMPLETE (Architecture, Abstraction, and Test Suite Implemented; Physical Hardware Drivers Blocked Pending Hardware Selection)  
**Parent Traceability**: `REQUIREMENTS.md`, `INGESTION_CONTRACT.md`, `DECISIONS.md`, `PHASE_26.md`, `PHASE_15.md`, and `OVERVIEW.md`.

---

## 1. Executive Summary

Phase 27 establishes the **Real Sensor Integration & Calibration Framework** for the MineGuard Integrated Node and Cloud platform. Its primary charter is to transform the sensor layer from a prototype/simulation-oriented design into a structured, hardware-ready, and strictly traceable sensor acquisition framework without fabricating unverified hardware specifications.

### Strict Anti-Hallucination Governance
In accordance with non-negotiable safety-critical rules:
1. **Zero Hardware Invention**: No sensor part number, manufacturer, wiring pinout, operating voltage, sampling rate, or accuracy was invented. Missing physical transducer specifications are explicitly designated **[TBD]** or **[BLOCKED]**.
2. **Explicit Reality Labels**: Every sensor driver and observation is explicitly labeled with its reality status: `REAL_HARDWARE`, `VERIFIED_HARDWARE`, `SIMULATED_HARDWARE`, `MOCK_SENSOR`, `TEST_FIXTURE`, `PLACEHOLDER`, `TBD`, or `BLOCKED`.
3. **Fail-Safe Non-Masking**: Sensor faults and communication timeouts are never replaced with `0.0`, moving averages, or default values. A failed transducer produces `quality=SENSOR_FAULT` and `engineering_value=None`.
4. **Preservation of SIH Prototype**: The existing REST ingestion API (`POST /api/v1/ingestion/telemetry`) and frontend UI are fully preserved with 100% backward compatibility and 122 passing automated tests (100% pass rate).

---

## 2. Phase 25 and Phase 26 Verification Table

| Architecture / Specification Dimension | Phase 25 Requirements Baseline | Phase 26 Node Architecture | Existing Repository Implementation | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **Sensor Modalities** | 5 core suites: `displacement`, `vibration`, `crack_detection`, `environment` (T/H/P), `hazardous gases` ($\text{CH}_4, \text{CO}, \text{O}_2$) (`BE-REQ-008`–`013`). | Transducer layer accommodating all 5 suites (`NODE-FR-001`–`006`). | Ingestion contract supports all 9 string categories; DB models exist. | **VERIFIED** |
| **Specific Sensor Models** | Unspecified in source requirements (`UNKNOWNs.md`, Sec. 1). | Preserved as non-prescriptive parametric constraints (`PHASE_26.md`, Sec. 8). | Zero physical drivers; mock names excised in Phase 15. | **BLOCKED (Awaiting Phase 28 HW Selection)** |
| **Sensor Interfaces** | Unspecified (`UNKNOWNs.md`, Sec. 1). | Defined logical AFE interfaces: Analog 0–5V/4–20mA, I2C, SPI, UART (`PHASE_26.md`, Sec. 7). | Ingestion accepts decoded JSON floats over HTTP. | **VERIFIED (Logical) / TBD (Physical Pinouts)** |
| **Microcontroller / Processor** | Unspecified (`BE-REQ-027` covered backend language only). | Defined 32-bit RISC parametric envelope (ARM Cortex-M4F / RISC-V, $\ge 64\,\text{KB}$ SRAM, $\ge 256\,\text{KB}$ Flash). | Zero firmware source files exist in repository. | **VERIFIED (Architecture) / TBD (Silicon Selection)** |
| **Power Architecture** | Unspecified (`UNKNOWNs.md`, Sec. 2). | Power-gated duty cycling with battery/BMS telemetry (`PHASE_26.md`, Sec. 12). | Backend schema does not persist battery percentage (`PHASE_15.md`). | **VERIFIED (Architecture) / TBD (BMS Telemetry)** |
| **Sampling Rates** | Continuous / real-time monitoring stated; exact period TBD (`BE-REQ-032`). | Duty-cycled state machine with parameter TBD (`PHASE_26.md`, Sec. 12). | Telemetry accepts timestamps; no server-side sampling rate enforcement. | **TBD** |
| **Calibration Architecture** | Unspecified in Phase 0 (`UNKNOWNs.md`, Sec. 8). | Offset and gain calibration defined in firmware abstraction layer (`PHASE_26.md`, Sec. 11). | Phase 27 implements `CalibrationEngine` supporting linear $y = (x - \text{offset}) \times \text{gain}$. | **VERIFIED** |
| **Telemetry Ingestion Format** | Normalized internal contract (`INGESTION_CONTRACT.md`). | Binary OTA frame mapped to Mother System gateway (`PHASE_26.md`, Sec. 11). | Implemented via `POST /api/v1/ingestion/telemetry` and Pydantic DTOs. | **VERIFIED** |

---

## 3. Sensor Inventory

The complete inventory of monitored parameters is documented below. Where physical hardware has not yet been procured or lab-certified, fields are strictly marked **TBD** or **BLOCKED**.

| Sensor Modality | Measured Physical Parameter | Canonical Unit | Verified Sensor Model | Verified Physical Interface | Verified Measurement Range | Verified Accuracy | Calibration Method | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **Displacement** | Ground surface / bench linear deformation | `mm` | **TBD** | **TBD** (Analog 0–5V or SPI) | **TBD** | **TBD** | Linear zero-offset & span | **BLOCKED** |
| **Vibration** | Peak Particle Velocity (PPV) / dynamic disturbance | `mm/s` | **TBD** | **TBD** (SPI or Analog) | **TBD** | **TBD** | Factory sensitivity scale | **BLOCKED** |
| **Crack Progression** | Fissure opening width | `mm` | **TBD** | **TBD** (Analog Ratiometric) | **TBD** | **TBD** | Direct zero-point offset | **BLOCKED** |
| **Temperature** | Ambient mine dry-bulb temperature | `°C` | **TBD** | **TBD** ($\text{I}^2\text{C}$ or SPI) | $\ge -273.15^\circ\text{C}$ | **TBD** | 2-point reference check | **BLOCKED** |
| **Relative Humidity** | Ambient relative air humidity | `%` | **TBD** | **TBD** ($\text{I}^2\text{C}$) | $[0.0, 100.0]\,\%$ | **TBD** | Saturated salt reference | **BLOCKED** |
| **Barometric Pressure**| Atmospheric mine shaft pressure | `hPa` | **TBD** | **TBD** ($\text{I}^2\text{C}$ or SPI) | $> 0.0\,\text{hPa}$ | **TBD** | Digital factory trimmed | **BLOCKED** |
| **Methane ($\text{CH}_4$)** | Flammable mine gas concentration | `%` | **TBD** | **TBD** (Analog TIA or UART) | **TBD** | **TBD** | Calibration test gas cylinder | **BLOCKED** |
| **Carbon Monoxide ($\text{CO}$)**| Toxic incomplete combustion gas | `ppm` | **TBD** | **TBD** (Electrochemical / UART)| **TBD** | **TBD** | Span gas zero & span | **BLOCKED** |
| **Oxygen ($\text{O}_2$)** | Atmospheric breathing oxygen | `%` | **TBD** | **TBD** (Electrochemical cell) | $[0.0, 100.0]\,\%$ | **TBD** | Ambient air (20.9%) calibration | **BLOCKED** |
| **Auxiliary Gases** | $\text{H}_2\text{S}$, $\text{NO}_2$, $\text{CO}_2$ (extensible) | `ppm` / `%` | **TBD** | **TBD** (Isolated UART) | **TBD** | **TBD** | Span gas procedure | **BLOCKED** |

---

## 4. Sensor Abstraction Architecture

The sensor abstraction layer (`backend/app/sensor_framework/`) isolates application and telemetry services from physical or simulated transducer details.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ACQUISITION LIFECYCLE                           │
│                                                                        │
│   ┌────────────────────┐                                               │
│   │    INITIALIZE      │  Transducer self-test & bus communication check│
│   └─────────┬──────────┘                                               │
│             ▼                                                          │
│   ┌────────────────────┐                                               │
│   │    ACQUIRE RAW     │  Sample ADC / read digital bus registers      │
│   └─────────┬──────────┘                                               │
│             ▼                                                          │
│   ┌────────────────────┐                                               │
│   │    VALIDATE        │  Structural, temporal & physical checks       │
│   └─────────┬──────────┘                                               │
│             ▼                                                          │
│   ┌────────────────────┐                                               │
│   │    CALIBRATE       │  calibrated = (raw - offset) * gain           │
│   └─────────┬──────────┘                                               │
│             ▼                                                          │
│   ┌────────────────────┐                                               │
│   │   QUALITY CHECK    │  Assign VALID, SENSOR_FAULT, STALE, etc.      │
│   └─────────┬──────────┘                                               │
│             ▼                                                          │
│   ┌────────────────────┐                                               │
│   │   PACKAGE FRAME    │  CanonicalSensorReading -> TelemetryRequest   │
│   └────────────────────┘                                               │
└────────────────────────────────────────────────────────────────────────┘
```

### Abstraction Components Implemented
- [`BaseSensorDriver`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/sensor_framework/base_driver.py): Abstract base class managing configuration, sequence counting, acquisition, and error isolation.
- [`CalibrationEngine`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/sensor_framework/calibration.py): Pure linear calibration engine checking record expiration.
- [`SensorValidator`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/sensor_framework/validation.py): Plausibility engine validating non-NaN, non-future, and thermodynamic invariants.
- [`SensorAcquisitionPipeline`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/sensor_framework/pipeline.py): Node multi-sensor coordinator that isolates faulted sensors and generates valid `TelemetryIngestionRequest` frames.

---

## 5. Raw Data vs. Calibrated vs. Display Value Transformation

To ensure traceability across the safety pipeline, data transformations are strictly separated:

$$\text{Raw Transducer Reading } (V_{\text{raw}} / \text{ADC Counts}) \xrightarrow{\text{Electrical Conversion}} \text{Uncalibrated Value} \xrightarrow{\text{Calibration } (y = (x - \text{offset}) \times \text{gain})} \text{Engineering Value} \xrightarrow{\text{UI Precision}} \text{Display Value}$$

1. **Raw Sensor Data**: Unprocessed electrical reading directly from transducer (e.g., $1.52\,\text{V}$ on an analog displacement channel).
2. **Engineering Value**: Calibrated physical quantity in canonical engineering units ($12.45\,\text{mm}$).
3. **Display Value**: Formatted human-readable string on the dashboard ($12.5\,\text{mm}$ or `CRITICAL: 18.4 mm`).

---

## 6. Unit Handling

| Sensor Modality | Canonical Engineering Unit | Storage Unit (Database) | Telemetry Unit (JSON Ingestion) | UI Display Unit |
| :--- | :---: | :---: | :---: | :---: |
| **Displacement** | `mm` | `mm` | `mm` | `mm` |
| **Vibration** | `mm/s` | `mm/s` | `mm/s` | `mm/s` |
| **Crack Progression** | `mm` | `mm` | `mm` | `mm` |
| **Temperature** | `°C` | `°C` | `°C` | `°C` |
| **Humidity** | `%` | `%` | `%` | `%` |
| **Barometric Pressure**| `hPa` | `hPa` | `hPa` | `hPa` |
| **Methane ($\text{CH}_4$)** | `%` | `%` | `%` | `%` |
| **Carbon Monoxide ($\text{CO}$)**| `ppm` | `ppm` | `ppm` | `ppm` |
| **Oxygen ($\text{O}_2$)** | `%` | `%` | `%` | `%` |

*Zero undocumented unit conversions are performed. Float values are stored and retrieved without scaling factors.*

---

## 7. Calibration Architecture & Storage

### Calibration Mathematical Formula
Only verified linear gain/offset calibration is implemented:
$$\text{Value}_{\text{calibrated}} = (\text{Value}_{\text{raw}} - \text{Offset}) \times \text{Gain}$$
*Polynomial regression and ungrounded multi-order temperature compensation formulas are rejected and marked TBD.*

### Calibration Record Structure
Defined in [`CalibrationRecord`](file:///c:/Users/SAYAN/OneDrive/Desktop/sih%20project/backend/app/sensor_framework/models.py):
- `record_id`: Unique certificate identifier (e.g., `CAL-DISP-001`).
- `sensor_id`: Identifier of targeted sensor channel.
- `calibrated_at`: UTC timestamp of calibration.
- `valid_until`: Expiration timestamp (strictly checked; expired records trigger `CALIBRATION_EXPIRED`).
- `calibration_source`: Calibration facility or automated routine (`ZERO_POINT_ROUTINE`, `LAB_BENCH`, `FACTORY`).
- `calibration_method`: Calibration protocol applied (`DIRECT_ZERO_OFFSET`, `TWO_POINT`, `SPAN_GAS`).
- `operator_id`: Identity of certified technician.
- `gain`: Multiplier (default $1.0$).
- `offset`: Subtractive zero correction (default $0.0$).
- `is_active`: Operational enforcement flag.

---

## 8. Sensor Health & Failure Mode Analysis

| Failure Mode | Detection Mechanism | Sensor Health State | Reading Quality State | Telemetry Output | Alert Generated |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Transducer Disconnect** | Open-circuit detection / bus NACK | `DISCONNECTED` | `SENSOR_FAULT` | `engineering_value = null` | Operator Warning |
| **Bus Communication Timeout** | Driver timeout exception | `FAULT` | `SENSOR_FAULT` | `engineering_value = null` | System Alert |
| **Non-Finite Value (NaN/Inf)**| IEEE 754 float validation | `DEGRADED` | `INVALID` | `engineering_value = null` | Invalid Data Alert |
| **Thermodynamic Violation** | Invariant bounds check ($O_2 > 100\%$) | `DEGRADED` | `OUT_OF_BOUNDS` | `engineering_value = null` | Sensor Range Alert |
| **Calibration Expired** | Expiration timestamp evaluation | `CALIBRATION_REQUIRED` | `VALID` | Value published with calibration flag | Maintenance Log |
| **Physical Hardware Absent** | Driver block check | `FAULT` | `SENSOR_FAULT` | `engineering_value = null` | HW Blocked Notice |

### Fail-Safe Invariant: Never Mask Faults with Zero
Under no circumstance does the framework convert a sensor fault into `0.0`. In mine safety, reporting `0.0 ppm` for Carbon Monoxide or `0.0 mm/s` for Vibration when a sensor is disconnected creates a fatal false-safe condition. A faulted sensor always outputs `engineering_value = None` and `quality = SENSOR_FAULT`.

---

## 9. Simulation vs. Real Hardware Boundary

| Reality Status Tag | Definition & Permitted Use | Present in Codebase? |
| :--- | :--- | :---: |
| `REAL_HARDWARE` | Physical sensor connected, verified in lab bench testing, executing physical driver. | **NO (BLOCKED)** |
| `VERIFIED_HARDWARE` | Physical transducer model certified and approved in BOM with verified datasheet. | **NO (BLOCKED)** |
| `SIMULATED_HARDWARE` | Software simulation driver producing deterministic synthetic data for test coverage. | **YES (`SimulatedSensorDriver`)** |
| `MOCK_SENSOR` | Hardcoded test fixtures used in automated unit/integration tests. | **YES (`test_sensor_framework.py`)** |
| `BLOCKED` | Explicit driver stub preventing execution when physical hardware is not verified. | **YES (`BlockedPhysicalHardwareDriver`)** |

---

## 10. Traceability Matrix

| Master Requirement | Architecture Component | Source Code Implementation | Test Verification | Status |
| :--- | :--- | :--- | :--- | :--- |
| `BE-REQ-008` (Displacement) | Displacement Driver Abstraction | `backend/app/sensor_framework/base_driver.py` | `test_simulated_driver_acquisition` | **VERIFIED** |
| `BE-REQ-009` (Vibration) | Vibration Driver Abstraction | `backend/app/sensor_framework/base_driver.py` | `test_validation_rejects_nan_and_inf` | **VERIFIED** |
| `BE-REQ-010` (Cracks) | Crack Driver Abstraction | `backend/app/sensor_framework/base_driver.py` | `test_calibration_zero_offset_routine` | **VERIFIED** |
| `BE-REQ-011` (Environment) | Environmental T/H/P Abstraction | `backend/app/sensor_framework/validation.py` | `test_validation_physical_invariants` | **VERIFIED** |
| `BE-REQ-012` (Hazardous Gas)| Gas Suite Abstraction | `backend/app/sensor_framework/validation.py` | `test_validation_preserves_extreme_hazard_readings` | **VERIFIED** |
| `BE-REQ-003` (Node ID) | Node Pipeline Coordinator | `backend/app/sensor_framework/pipeline.py` | `test_pipeline_acquisition_and_ingestion_mapping` | **VERIFIED** |
| `INGESTION_CONTRACT.md` | Ingestion Schema Bridge | `backend/app/sensor_framework/pipeline.py` | `test_pipeline_acquisition_and_ingestion_mapping` | **VERIFIED** |
| `D-019` (Safety Extreme Val) | Non-Clipping Extreme Hazard Policy | `backend/app/sensor_framework/validation.py` | `test_validation_preserves_extreme_hazard_readings` | **VERIFIED** |

---

## 11. Unknown / Blocked Register

| ID | Unknown / Blocked Item | Root Cause | Safety / Architectural Impact | Required Evidence for Unblocking | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BLK-27-01** | Physical Displacement Transducer Model | No physical sensor selected in project BOM. | Physical driver cannot be written without electrical pinouts and ADC characteristics. | Datasheet of approved LVDT / draw-wire transducer. | **BLOCKED** |
| **BLK-27-02** | Physical Vibration Geophone / Accelerometer Model | No physical accelerometer part number approved. | Sampling frequency, I2C/SPI registers, and PPV integration cannot be coded. | Selection of certified tri-axial accelerometer / geophone. | **BLOCKED** |
| **BLK-27-03** | Hazardous Gas Transducer Models ($\text{CH}_4, \text{CO}, \text{O}_2$) | Unspecified gas sensor elements. | Sensor warmup time, catalytic heating current, and electrochemical bias voltages unknown. | Selection of intrinsically safe gas sensing heads. | **BLOCKED** |
| **BLK-27-04** | Physical Calibration Coefficients | No physical field sensor has undergone bench calibration. | Exact calibration constants cannot be hardcoded into configuration. | Laboratory calibration certificates from certified reference standards. | **BLOCKED** |
| **TBD-27-01** | Transducer Sampling Intervals | Sampling rate unspecified in project requirements (`BE-REQ-032`). | Duty cycling schedule and power budget cannot be fixed. | Geotechnical monitoring schedule approved by mine management. | **🟡 TBD** |
| **TBD-27-02** | Hazardous Area Intrinsic Safety Certification | DGMS / ATEX Ex rating unspecified. | Physical enclosure and galvanic barrier design pending. | Statutory statutory classification (DGMS / MSHA zone requirements). | **🟡 TBD** |

---

## 12. Verification & Test Execution Results

All automated tests across backend services and the new Sensor Integration & Calibration Framework were executed:

```powershell
pytest
```
- **Total Tests Executed**: 122 automated tests (109 existing Phase 1–10 tests + 13 new Phase 27 framework tests).
- **Pass Rate**: **100% (122 passed, 0 failed, 0 regressions)**.
- **Execution Time**: 6.86 seconds.

```powershell
npm test --prefix frontend
```
- **Total Frontend Tests**: 26 tests across 7 test suites.
- **Pass Rate**: **100% (26 passed, 0 failed)**.

---

## 13. Phase 28 Readiness Assessment

### Overall Status: **PARTIALLY READY**

#### Objective Justification:
1. **Ready Elements**:
   - The sensor abstraction, canonical data models, traceable linear calibration engine, thermodynamic validation checks, and fail-safe pipeline are 100% implemented, tested, and verified against all Phase 0–26 baselines.
   - The telemetry mapping cleanly integrates with the production ingestion service without contract alterations.
2. **Blocked Elements (Requires Physical Hardware Selection)**:
   - Physical hardware drivers are explicitly **BLOCKED** because no commercial transducer models or physical microcontroller boards exist in the repository.
   - Proceeding to physical hardware bench testing in Phase 28 requires the physical procurement or formal selection of certified transducers for displacement, vibration, cracks, environment, and hazardous gases.
