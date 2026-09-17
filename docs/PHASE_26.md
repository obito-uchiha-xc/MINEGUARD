# Phase 26 — Integrated Node Hardware & Embedded Architecture

**Document Version**: 1.0  
**Status**: APPROVED BASELINE ARCHITECTURE  
**Target Phase**: Phase 26 (Stage 2: Hardware & Embedded Engineering)  
**Parent Traceability**: Phase 0 Baseline (`REQUIREMENTS.md`), ADRs (`DECISIONS.md`), Unknowns (`UNKNOWNs.md`), Ingestion Contract (`INGESTION_CONTRACT.md`), Phase 15 Hardware Audit (`PHASE_15.md`), and Master System Overview (`OVERVIEW.md`).

---

## 1. Executive Summary & Engineering Charter

The **MineGuard Integrated Node** is the autonomous, edge-deployed sensor interface and telemetry unit situated directly in active mine zones (open-pit benches, highwalls, underground adits, and haulage sectors). Its sole mission is to reliably interface with physical multi-modal geotechnical and environmental sensors, condition and validate raw physical measurements, encapsulate observation payloads with verifiable node identity and temporal metadata, and deliver formatted telemetry frames to the **MineGuard Mother System** gateway over a low-power, long-range wireless channel.

### Strict Anti-Hallucination & Non-Invention Policy
Per Phase 25 production requirements and system constraints:
1. **No Component Presumption**: No MCU family (e.g., STM32, ESP32, nRF52), LoRa transceiver (e.g., SX1262, SX1276), sensor part number (e.g., MPU6500, VL53L0X, BME280), battery chemistry (e.g., LiFePO4, LiSOCl2), or enclosure rating (e.g., IP67, ATEX Ex d) is assumed as pre-selected unless explicitly mandated by project requirements.
2. **Traceability**: All interfaces, processing rules, and operational requirements must map directly to verified requirements (`BE-REQ-001` through `BE-REQ-034`) or be explicitly designated as a **[PROPOSED DECISION]** or **[🟡 TBD]**.
3. **Hardware Driver Prohibition**: No physical drivers or board support packages (BSP) are implemented in this phase; Phase 26 defines the architectural envelope, interfaces, and evaluation criteria required for physical component selection in Phase 27.

---

## 2. Source-of-Truth Hierarchy

All engineering specifications in this document are governed by the following strict hierarchy of authority:

```
┌────────────────────────────────────────────────────────┐
│ 1. Explicit Project Requirements (Master Problem Spec) │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 2. Verified Phase 25 Production Baseline (Phases 0-19) │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 3. Existing Repository Implementation (DB/API Contract)│
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 4. Documented Engineering Decisions (ADR D-001-D-028)  │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 5. General Systems Engineering Knowledge (Explanatory) │
└────────────────────────────────────────────────────────┘
```

### Contradiction Register: Phase 25 Baseline vs. Historical Artefacts
During repository and documentation analysis, the following discrepancies were audited and reconciled:
- **Discrepancy 1 (Chip Names in UI Drafts)**: Early frontend mockups informally referenced `MPU6500`, `VL53L0X`, and `SX1278`.
  - *Reconciliation*: In Phase 15 (`PHASE_15.md`, Sec. 2 & 5), these specific part references were formally classified as ungrounded synthetic artifacts and excised. The verified baseline mandates functional modalities (`displacement`, `vibration`, `crack_detection`, `temperature`, `humidity`, `pressure`, `methane_ch4`, `carbon_monoxide_co`, `oxygen_o2`) rather than specific chip part numbers.
- **Discrepancy 2 (Battery & SNR in Data Schemas)**: Frontend dashboard views historically provided UI placeholders for Battery % and LoRa RSSI/SNR.
  - *Reconciliation*: Audited in `PHASE_15.md` (Table 2); backend database schema `integrated_nodes` does not persist battery percentage or RF SNR. These parameters are designated as **[PROPOSED EXTENSION — TBD]** for the physical node edge frame.

---

## 3. Mandatory Pre-Design Repository Inspection

A systematic audit of the existing codebase (`c:\Users\SAYAN\OneDrive\Desktop\sih project`) was executed to discover any pre-existing firmware or embedded artifacts prior to architectural design:

| Inspection Target | Files / Patterns Searched | Repository Inspection Finding | Status |
| :--- | :--- | :--- | :--- |
| **Embedded Firmware Source** | `*.c`, `*.cpp`, `*.h`, `*.hpp`, `*.ino` | Zero embedded C/C++ source or header files found in workspace. | **NONE** |
| **Microcontroller Code** | `*esp32*`, `*stm32*`, `*nrf52*`, `*arduino*` | Zero MCU target builds or hardware runtime trees exist. | **NONE** |
| **Embedded Build Systems** | `platformio.ini`, `CMakeLists.txt`, `Makefile` | Zero embedded project descriptors or toolchain configurations found. | **NONE** |
| **Real-Time Operating Systems** | `FreeRTOS*`, `zephyr*`, `mbed*` | Zero RTOS kernel configurations, tasks, or RTOS dependencies exist. | **NONE** |
| **Physical Sensor Drivers** | SPI/I2C/UART/ADC register drivers | Zero hardware driver implementations exist. | **NONE** |
| **RF / LoRa Implementation** | SX126x/SX127x libraries, LoRaWAN stacks | Zero LoRa radio physical layer code exists in repo. | **NONE** |
| **Edge Gateway Protocols** | MQTT edge client, Serial slip/COBS framing | Zero serial/MQTT gateway scripts exist. | **NONE** |
| **Existing Node Implementation** | `backend/app/models/node.py` | SQLAlchemy ORM model `IntegratedNode` (fields: `id`, `zone_id`, `node_identifier`, `status`, `last_seen_at`). | **SOFTWARE DB ONLY** |
| **Frontend Node Representation** | `frontend/src/pages/NodesPage.tsx` | React dashboard UI presenting node lists, status filters, and telemetry charts. | **SIMULATED UI ONLY** |
| **Node Telemetry Ingestion** | `backend/app/api/v1/ingestion.py` | FastAPI endpoint `POST /api/v1/ingestion/telemetry` accepting decoded JSON from Mother System. | **CLOUD INGESTION** |
| **Synthetic Demo Seeder** | `scripts/seed_demo_data.py` | Python script injecting simulated nodes (`NODE-JHR-01`, etc.) directly into the database. | **SOFTWARE SEEDER** |
| **Device Identity Representation** | `node_identifier` across DB and schemas | String field (1–128 characters), unique constraint, assigned via manual registration. | **LOGICAL ID ONLY** |
| **Local Data Buffering / Flash** | Edge wear-leveling, SPI flash logs | Zero local edge storage or buffering code exists. | **NONE** |
| **Firmware Update (FOTA)** | Dual-bank bootloader, rollback partitions | Zero bootloader or update logic exists. | **NONE** |
| **Hardware Watchdog** | WDT kick routines, brownout reset handlers | Zero hardware supervisor logic exists. | **NONE** |

---

## 4. Current MineGuard Node Status

Based on the pre-design inspection, the current state of the MineGuard Integrated Node across the system lifecycle is classified as follows:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MINEGUARD NODE STATUS MATRIX                      │
├──────────────────────────────┬────────────────────────┬────────────────┤
│ Subsystem / Component        │ Current Classification │ Evidence       │
├──────────────────────────────┼────────────────────────┼────────────────┤
│ Physical Electronic Hardware │ NOT IMPLEMENTED        │ Zero PCB/BOM   │
│ Embedded Firmware (MCU/RTOS) │ NOT IMPLEMENTED        │ Zero C/C++     │
│ Physical Sensor Transducers  │ NOT IMPLEMENTED        │ Zero HW Drivers│
│ LoRa RF Physical Link        │ NOT IMPLEMENTED (TBD)  │ Zero RF Stacks │
│ Mother System Gateway Bridge │ SIMULATED / DEFERRED   │ ADR D-003/D-016│
│ REST Ingestion Pipeline      │ IMPLEMENTED (100%)     │ FastAPI Route  │
│ Node Liveness Tracking       │ IMPLEMENTED (100%)     │ ADR D-020      │
│ Node Unresponsive Watchdog   │ IMPLEMENTED (100%)     │ ADR D-027      │
│ Dashboard Node Management    │ IMPLEMENTED (UI)       │ React Console  │
│ Synthetic Telemetry Stream   │ SIMULATED              │ Demo Seeder    │
└──────────────────────────────┴────────────────────────┴────────────────┘
```

> [!IMPORTANT]
> **Operational Distinction**: The MineGuard system currently operates an **entirely simulated software node representation**. There is zero physical hardware, zero board schematic, and zero embedded firmware in the repository. Phase 26 establishes the first authoritative hardware and embedded architecture required to transition from this software simulation to physical prototype development.

---

## 5. Node System Boundary & Responsibility Matrix

To eliminate cross-layer scope creep, the operational boundary separating physical sensors, the Integrated Node, the wireless communication link, the Mother System gateway, and the Cloud Backend is strictly defined below.

```
 [ Physical Sensors ]
         │
         │ (Analog mV, 4-20mA, I2C, SPI, UART, Pulse)
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATED NODE BOUNDARY                        │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 1. Sensor Interface & Signal Conditioning Layer               │   │
│   │    - ADC sampling, digital bus polling, power gating           │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                     │
│   ┌──────────────────────────────▼─────────────────────────────────┐   │
│   │ 2. Core Processing & Validation Layer (MCU)                   │   │
│   │    - Range checks, calibration offsets, CRC/integrity          │   │
│   │    - Local timestamping (relative ticks / RTC sync)            │   │
│   │    - Node status & power telemetry packaging                   │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                     │
│   ┌──────────────────────────────▼─────────────────────────────────┐   │
│   │ 3. Edge Buffering & Storage Layer                              │   │
│   │    - Non-volatile circular buffer for link dropouts            │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                     │
│   ┌──────────────────────────────▼─────────────────────────────────┐   │
│   │ 4. Wireless Communication Transceiver                          │   │
│   │    - Framing, forward error correction, radio transmission     │   │
│   └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   │ (LoRa RF Field Uplink — Over the Air)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         MOTHER SYSTEM GATEWAY                          │
│  - LoRa multi-channel concentrator / receiver                          │
│  - Packet deduplication, integrity check, gateway timestamping         │
│  - Protocol translation (LoRa binary payload -> JSON Ingestion Schema) │
│  - Cellular / Ethernet / Satellite WAN uplink adapter                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   │ (HTTPS REST `POST /api/v1/ingestion/telemetry`)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        MINEGUARD CLOUD BACKEND                         │
│  - Relational mapping, historical persistence, live WebSocket push    │
│  - Multi-parameter correlation, statistical AI anomaly detection       │
│  - Master risk scoring, alert deduplication, TARP dispatching          │
└────────────────────────────────────────────────────────────────────────┘
```

### Responsibility Allocation Matrix

| Architectural Function | Detailed Responsibility | Node-Owned? | External Responsibility |
| :--- | :--- | :---: | :--- |
| **Transducer Interfacing** | Physical excitation, analog-to-digital conversion, bus reads. | **YES** | Field Sensor Transducer |
| **Measurement Validation** | Electrical bounds check, open/short detection, raw outlier reject. | **YES** | — |
| **Sensor Calibration** | Applying zero-offset, temperature compensation, gain calibration. | **YES** | Backend (Master calibration profile sync) |
| **Local Timestamping** | High-resolution tick tagging of observation sample. | **YES** | Mother System (UTC wall-clock synchronization) |
| **Local Edge Buffering** | Storing telemetry in non-volatile flash when link is unavailable. | **YES** | — |
| **RF Packet Packaging** | Compacting telemetry into efficient binary over-the-air frames. | **YES** | — |
| **RF Transmission** | Radio physical modulation (LoRa chirp) to Mother System. | **YES** | Mother System Gateway Receiver |
| **Concentration & Aggregation** | Ingesting simultaneous frames from 1..N field nodes. | NO | **Mother System Gateway** |
| **Protocol Conversion** | Translating binary LoRa frames into HTTP/JSON payloads. | NO | **Mother System Gateway** |
| **WAN Backhaul Uplink** | Transporting data across mine site via 4G/LTE, Fiber, or Sat. | NO | **Mother System Gateway** |
| **Multi-Sensor Correlation** | Correlating seismic events, crack evolution, and gas buildup. | NO | **Cloud Backend (Phase 6/7)** |
| **Inverse-Velocity Failure ($t_f$)** | Calculating Fukuzono slope collapse forecasting models. | NO | **Cloud Backend (Phase 7/8)** |
| **TARP / Siren Triggering** | Facility-wide audible sirens, regulatory SMS, evacuation. | NO | **Cloud Backend / Control Room** |
| **Long-Term Persistence** | Storing multi-year sensor histories and compliance audits. | NO | **Cloud Backend (PostgreSQL/SQLite)** |

---

## 6. Node Functional Requirements

The functional requirements of the Integrated Node are derived exclusively from verified Phase 25 specifications (`REQUIREMENTS.md`, `INGESTION_CONTRACT.md`, and architectural baselines).

| Requirement ID | Functional Area | Requirement Statement | Traceability | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **NODE-FR-001** | Sensor Acquisition | Node must acquire measurements from structural deformation/displacement transducers. | `BE-REQ-008` | **SPEC** |
| **NODE-FR-002** | Sensor Acquisition | Node must acquire dynamic disturbance/vibration measurements. | `BE-REQ-009` | **SPEC** |
| **NODE-FR-003** | Sensor Acquisition | Node must acquire structural crack progression measurements. | `BE-REQ-010` | **SPEC** |
| **NODE-FR-004** | Sensor Acquisition | Node must acquire ambient temperature, relative humidity, and barometric pressure. | `BE-REQ-011` | **SPEC** |
| **NODE-FR-005** | Sensor Acquisition | Node must acquire hazardous gas concentrations: Methane ($\text{CH}_4$), Carbon Monoxide ($\text{CO}$), and Oxygen ($\text{O}_2$). | `BE-REQ-012` | **SPEC** |
| **NODE-FR-006** | Sensor Extensibility | Node interface architecture must accommodate auxiliary environmental or toxic gas sensors. | `BE-REQ-013` | **SPEC** |
| **NODE-FR-007** | Device Identity | Node must transmit an immutable, factory-provisioned or securely configured unique hardware identifier corresponding to `node_identifier`. | `BE-REQ-003`, `D-018` | **SPEC** |
| **NODE-FR-008** | Sensor Channel ID | Node must map measurements to distinct sensor channel identifiers corresponding to `sensor_identifier`. | `INGESTION_CONTRACT.md` | **SPEC** |
| **NODE-FR-009** | Measurement Validation | Node must perform preliminary physical plausibility validation (e.g. out-of-bounds ADC, disconnected bus probe). | `INGESTION_CONTRACT.md` | **PROPOSED DECISION** |
| **NODE-FR-010** | Relative Timestamping | Node must timestamp each measurement cycle using an internal monotonic counter or synchronized RTC clock. | `INGESTION_CONTRACT.md` | **PROPOSED DECISION** |
| **NODE-FR-011** | Local Processing | Local processing must be strictly limited to signal conditioning, calibration offsets, digital filtering, and payload serialization (no high-level AI model execution on node). | `BE-REQ-014`, `D-005` | **PROPOSED DECISION** |
| **NODE-FR-012** | Telemetry Creation | Node must assemble validated readings into an energy-efficient binary payload structure matching the backend contract requirements. | `INGESTION_CONTRACT.md` | **SPEC** |
| **NODE-FR-013** | Node Health Telemetry | Node must package internal diagnostic telemetry: supply voltage (battery state), internal temperature, and communication status. | `PHASE_15.md`, `D-020` | **PROPOSED DECISION** |
| **NODE-FR-014** | Offline Buffering | Node must buffer observation frames locally in non-volatile memory during wireless link interruption and flush upon link restoration. | `UNKNOWNs.md` (Sec. 3) | **PROPOSED DECISION** |
| **NODE-FR-015** | Communication Interface| Node must transmit telemetry bursts to the Mother System gateway over a long-range, sub-GHz wireless radio link (LoRa). | `REQUIREMENTS.md` (Sec. 1), `OVERVIEW.md` | **SPEC** |
| **NODE-FR-016** | Power Management | Node must support duty-cycled autonomous operation, entering low-power sleep modes between measurement cycles. | `UNKNOWNs.md` (Sec. 2) | **PROPOSED DECISION** |
| **NODE-FR-017** | Hardware Fault Handling| Node must incorporate an independent hardware watchdog timer capable of recovering the system from firmware execution stall within $\le 2.0$ seconds. | Safety Systems Baseline | **PROPOSED DECISION** |
| **NODE-FR-018** | Configuration & Provisioning | Node must support secure local or over-the-air setting of reporting intervals, sensor channel enables, and calibration offsets. | `UNKNOWNs.md` (Sec. 8) | **🟡 TBD** |
| **NODE-FR-019** | Sampling Rates | Sampling interval and cadence per sensor channel. | `BE-REQ-032` | **🟡 TBD** |
| **NODE-FR-020** | Physical Enclosure & Ingress | Hazardous location certification (ATEX/IECEx/DGMS) and ingress protection. | `UNKNOWNs.md` | **🟡 TBD** |

---

## 7. Logical Hardware Architecture

The logical hardware block diagram below specifies the functional blocks required inside the Integrated Node. It contains **only** verified or explicitly proposed architectural blocks without premature physical component selection.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MINEGUARD INTEGRATED NODE HARDWARE                                     │
│                                                                                                        │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                                    TRANSDUCER / SENSOR LAYER                                       │ │
│ │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐ │ │
│ │  │ Displacement  │ │   Vibration   │ │Crack Extension│ │ Environmental │ │ Hazardous Gas Suite │ │ │
│ │  │ (Linear/Tilt) │ │ (Geophone/Acc)│ │(Potentiometer)│ │(Temp/Hum/Baro)│ │ (CH4, CO, O2, Aux) │ │ │
│ │  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────────┬───────────┘ │ │
│ └──────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────────┼─────────────┘ │
│            │ (Analog/4-20mA) │ (Analog/SPI)    │ (Analog/I2C)    │ (I2C/SPI)           │ (UART/Analog) │
│ ┌──────────▼─────────────────▼─────────────────▼─────────────────▼─────────────────────▼─────────────┐ │
│ │                           SIGNAL CONDITIONING & SENSOR INTERFACE SUBSYSTEM                         │ │
│ │  ┌───────────────────────────────────┐ ┌────────────────────────────────────────────────────────┐  │ │
│ │  │ Analog Front-End (AFE)            │ │ Digital Sensor Bus Isolation & Level Shifting          │  │ │
│ │  │ - Instrumentation Amplifiers      │ │ - I2C Bus Multiplexer / Buffer                         │  │ │
│ │  │ - Active Anti-Aliasing Filters    │ │ - SPI High-Speed Bus Interface                         │  │ │
│ │  │ - Multi-Channel Precision ADC     │ │ - UART Isolated Transceiver                            │  │ │
│ │  └───────────────────────────────────┘ └────────────────────────────────────────────────────────┘  │ │
│ └────────────────────────────────────────┬────────────────────────────────────────────────────────────┘ │
│                                          │ Conditioned Data & Bus Lines                                 │
│ ┌────────────────────────────────────────▼────────────────────────────────────────────────────────────┐ │
│ │                                 PROCESSING & CONTROL SUBSYSTEM                                      │ │
│ │                                                                                                     │ │
│ │  ┌───────────────────────────────────────────────────────────────────────────────────────────────┐  │ │
│ │  │ Microcontroller Unit (MCU) Core                                                               │  │ │
│ │  │  - Sensor Sampling & Power-Gated Excitation Scheduling                                        │  │ │
│ │  │  - Engineering Unit Conversion & Local Sensor Offset Calibration                              │  │ │
│ │  │  - Measurement Plausibility & Fault Detection (Open/Short Circuit)                            │  │ │
│ │  │  - Binary Telemetry Frame Serialization & Checksum (CRC-16/32) Computation                    │  │ │
│ │  │  - Power Management Controller (Active / Sleep / Deep-Sleep State Machine)                    │  │ │
│ │  └───────────────────────────────────────────────────────────────────────────────────────────────┘  │ │
│ └───────┬───────────────────────────────┬──────────────────────────────┬──────────────────────────────┘ │
│         │ SPI / QSPI Bus                │ Memory Bus / I2C             │ Direct SPI / UART Link         │
│ ┌───────▼─────────────────────────────┐ ┌▼─────────────────────────────┐ ┌▼───────────────────────────┐ │
│ │     LOCAL NON-VOLATILE STORAGE      │ │     SYSTEM SUPERVISORY       │ │     WIRELESS TRANSCEIVER    │ │
│ │                                     │ │                              │ │                             │ │
│ │ - Circular FIFO Telemetry Buffer    │ │ - Hardware Watchdog Timer    │ │ - Sub-GHz LoRa Transceiver  │ │
│ │   (Flash memory for offline cache)  │ │ - Hardware Brownout Detector │ │ - RF Front-End & Matching   │ │
│ │ - Calibration Parameter Storage     │ │ - Real-Time Clock (RTC)      │ │ - Tuned Industrial Antenna  │ │
│ │ - Node Identification (Secure EUI)  │ │ - Tamper / Integrity Monitor │ │   (865–867 / 868 / 915 MHz) │ │
│ └─────────────────────────────────────┘ └──────────────────────────────┘ └──────────────┬──────────────┘ │
│                                                                                         │ (Chirp RF)    │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │               │
│ │                              POWER ARCHITECTURE SUBSYSTEM                           │ │               │
│ │                                                                                     │ │               │
│ │  [ Primary / Secondary Power Source (Battery / Solar Harvester) ]                   │ │               │
│ │      │                                                                              │ │               │
│ │      ▼                                                                              │ │               │
│ │  [ Battery Management System (BMS) / Coulomb Counter / Fuel Gauge ]                 │ │               │
│ │      │                                                                              │ │               │
│ │      ├─► [ Regulated 3.3V Digital Rail (MCU, Flash, Transceiver) ]                  │ │               │
│ │      └─► [ Gated High-Voltage Sensor Power Rails (5V / 12V / 24V Transducer Boost) ]│ │               │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │               │
└─────────────────────────────────────────────────────────────────────────────────────────┼───────────────┘
                                                                                          │
                                                                                          ▼
                                                                           Mother System Gateway Receiver
```

---

## 8. Sensor Interface Architecture

The Integrated Node must interface with 5 distinct physical sensing categories defined in Phase 25. The electrical and logical interface requirements for each category are specified below:

| Sensor Modality | Required Physical Parameter (`BE-REQ`) | Candidate Transducer Physics | Required Electrical Interface | Conditioning & Sampling Considerations |
| :--- | :--- | :--- | :--- | :--- |
| **Displacement / Deformation** | Ground kinematics, bench displacement (`BE-REQ-008`) | Linear Variable Differential Transformer (LVDT), Draw-wire sensor, InSAR ground prism target, Potentiometric displacement | Precision Analog (0–5V / 4–20mA) or Digital SPI/SSI | Requires low-noise differential amplification, temperature compensation, and ratiometric ADC conversion. |
| **Vibration Disturbances** | Dynamic rock movement, blasting shock (`BE-REQ-009`) | Piezoelectric geophone or tri-axial MEMS accelerometer | High-speed SPI or High-Bandwidth Analog ADC | Requires anti-aliasing low-pass filter; local peak particle velocity (PPV) or RMS calculation to prevent continuous RF streaming. |
| **Crack Progression** | Surface fissure opening rate (`BE-REQ-010`) | Resistive crack gauge, vibrating wire jointmeter, or optical displacement sensor | Ratiometric Analog Voltage (ADC) or Frequency Counter (Vibrating Wire) | High resolution ($\le 0.05\,\text{mm}$) required; low sampling frequency ($\le 0.1\,\text{Hz}$), high DC stability. |
| **Environmental Conditions** | Atmospheric pressure, ambient temp, relative humidity (`BE-REQ-011`) | Piezoresistive pressure cell, capacitive RH element, bandgap temperature diode | Digital $\text{I}^2\text{C}$ or SPI | Low-power digital sensor polling; periodic burst sampling prior to RF uplink. |
| **Hazardous Gas Suite** | $\text{CH}_4$, $\text{CO}$, $\text{O}_2$, Extensible gases (`BE-REQ-012`, `BE-REQ-013`) | Catalytic pellistor / NDIR ($\text{CH}_4$), Electrochemical ($\text{CO}$, $\text{O}_2$) | Analog Transimpedance Amp (TIA) or Isolated Digital UART | Catalytic sensors require high peak heating current; electrochemical sensors require continuous bias voltage; warmup time stabilization required before sampling. |

---

## 9. Microcontroller / Processor Requirements

Rather than presuming a specific commercial chip part number, the processing unit must satisfy the following architectural bounds derived from the system requirements:

1. **Processing Architecture**:
   - 32-bit RISC architecture (e.g., ARM Cortex-M or RISC-V).
   - Clock Frequency: Minimum 48 MHz for digital signal filtering and CRC computation; capable of frequency scaling down to $\le 2\,\text{MHz}$ in low-power modes.
   - Hardware Floating-Point Unit (FPU) recommended for rapid local engineering unit conversion and polynomial calibration curves.
2. **Memory Footprint**:
   - Internal SRAM: Minimum 64 KB (permits packet buffering, DMA receive buffers, and RTOS task stacks).
   - Internal Non-Volatile Flash: Minimum 256 KB (accommodates robust application image, dual-bank bootloader, and factory calibration tables).
3. **Peripheral Complement**:
   - Minimum 1x SPI controller (dedicated to LoRa transceiver).
   - Minimum 1x $\text{I}^2\text{C}$ bus master (supporting standard 100 kHz and fast 400 kHz modes for environmental sensors).
   - Minimum 2x UART interfaces (1x isolated debug/configuration, 1x digital gas sensor module).
   - Minimum 8-channel, 12-bit successive-approximation ADC with internal voltage reference.
   - Minimum 4x Independent DMA channels to offload ADC and SPI transfers without waking the CPU core.
   - Hardware cyclic redundancy check (CRC) calculation engine.
4. **Power Profile Requirements**:
   - Active Run Mode Current: $\le 150\,\mu\text{A}/\text{MHz}$.
   - Deep Sleep / Standby Current: $\le 5\,\mu\text{A}$ with Real-Time Clock (RTC) and RAM retention enabled.
   - Wake-Up Latency: $\le 50\,\mu\text{s}$ from deep sleep to active execution.

---

## 10. Communication Interface Requirements (Node to Mother System)

The physical and link layer between the Integrated Node and the Mother System gateway is governed by the following constraints:

1. **Radio Frequency Technology**: Sub-GHz Long Range (LoRa) chirp spread spectrum (CSS) modulation (`REQUIREMENTS.md`, Sec. 5).
2. **Frequency Allocation**:
   - Must support regional industrial ISM bands:
     - **India**: $865–867\,\text{MHz}$ (IN865 per WPC guidelines).
     - **Europe**: $868\,\text{MHz}$ (EU868).
     - **Americas**: $915\,\text{MHz}$ (US915).
3. **Modulation & Data Rates**:
   - Configurable Spreading Factor: SF7 (high throughput, short range) to SF12 (maximum penetration through mine rock/topography).
   - RF Bandwidth: $125\,\text{kHz}$ standard, $250\,\text{kHz}$ optional.
   - Coding Rate: $4/5$ standard forward error correction.
4. **Link Integrity & Checksums**:
   - Every over-the-air packet must include hardware CRC-16 validation. Corrupted frames must be discarded at the Mother System concentrator.
5. **Channel Access Policy**:
   - Node-initiated uplink transmission using Listen-Before-Talk (LBT) or randomized transmission offsets (jitter: $\pm 10\%$) to minimize packet collisions in high-density node clusters.

---

## 11. Local Processing & Telemetry Framing

### Processing Scope on the Edge Node
To maintain system safety and architectural separation of concerns, local processing on the Integrated Node is strictly bounded:

- **Permitted Local Operations**:
  - Raw sensor oversampling and moving-average digital filtering to suppress high-frequency electrical noise.
  - Applying factory calibration coefficients: $\text{Value}_{\text{physical}} = (\text{Raw} - \text{ZeroOffset}) \times \text{GainMultiplier}$.
  - Electrical fault detection (detecting open-circuit / short-circuit transducer lines).
  - Serializing normalized readings into compact binary telemetry payloads.
- **Prohibited Local Operations**:
  - No complex machine learning model execution (Z-score anomaly scoring, Euclidean clustering, or neural networks). These are strictly owned by Cloud Backend Phases 6 & 7.
  - No autonomous declaration of mine-wide evacuation or safety alert state.
  - No arbitrary suppression of valid sensor observations.

### Binary Over-the-Air Telemetry Frame Architecture
To conserve RF airtime and maximize battery life, the node must serialize telemetry into a compact binary frame rather than verbose JSON:

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Preamble &   │ Node Identity│ Frame Counter│ Battery &    │ Telemetry    │ Frame CRC    │
│ Protocol Ver │ (Node UID)   │ (Sequence No)│ Status Byte  │ Payload Data │ (CRC-16)     │
│ (2 Bytes)    │ (4 Bytes)    │ (2 Bytes)    │ (2 Bytes)    │ (N Bytes)    │ (2 Bytes)    │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

#### Field Specifications:
1. **Protocol Version**: Identifies payload schema format and compatibility.
2. **Node UID**: 32-bit hardware identifier mapped to `node_identifier` (e.g. `NODE-JHR-01`) at the Mother System.
3. **Frame Sequence Counter**: Monotonically increasing unsigned 16-bit integer for packet loss detection.
4. **Status Byte**: Bitfield reporting internal supply voltage, sensor bus health, and buffer overflow flags.
5. **Telemetry Payload**: Compact fixed-point or IEEE 754 half-precision float array representing active channels (`displacement`, `vibration`, `crack`, `temp`, `hum`, `baro`, `ch4`, `co`, `o2`).
6. **Frame CRC**: 16-bit CRC over entire payload ensuring bit-level RF transmission integrity.

---

## 12. Power Architecture & Energy Budget

1. **Power Source Architecture**:
   - Autonomous Field Power: Designed for primary non-rechargeable industrial battery packs (e.g., Lithium Thionyl Chloride $\text{Li-SOCl}_2$ for multi-year lifespan) or secondary rechargeable packs with optional solar energy harvesting for surface bench deployment.
2. **Power Gating Strategy**:
   - To eliminate parasitic leakage current, all high-draw sensor front-ends (specifically catalytic gas sensors and excitation bridges) must be equipped with hardware load switches (MOSFET power gates). Power to sensors is switched ON only during the active sampling window and powered OFF during sleep.
3. **Operational State Machine**:
   - **Deep Sleep State** ($98.5\%$ of lifecycle): MCU in standby ($\le 10\,\mu\text{A}$), sensors unpowered, radio in sleep mode.
   - **Warmup & Sample State** ($1.0\%$ of lifecycle): Power gates active, transducers energized, ADC DMA acquisition executed.
   - **Processing State** ($0.2\%$ of lifecycle): MCU active at low frequency, calibrating and framing payload.
   - **Radio TX Burst State** ($0.3\%$ of lifecycle): LoRa transceiver active at $+14\,\text{dBm}$ to $+20\,\text{dBm}$ transmitting payload ($20–120\,\text{ms}$ duration).

---

## 13. Fault Handling, Resilience & Watchdogs

The Integrated Node must be fail-safe and self-recovering in harsh, inaccessible mining environments:

1. **Hardware Supervisory Watchdog**:
   - Independent external or windowed hardware watchdog timer clocked by an isolated low-speed internal oscillator (LSI).
   - Firmware must service the watchdog only upon verified completion of the main operational loop.
   - Stalled execution or memory deadlock triggers an automatic hardware reset within $\le 2.0$ seconds.
2. **Brownout & Voltage Supervisor**:
   - Hardware brownout reset (BOR) circuitry with programmable trip levels.
   - In the event of temporary supply sagging during radio transmit bursts, the MCU must safely halt flash write operations to prevent non-volatile memory corruption.
3. **Sensor Bus Resilience**:
   - $\text{I}^2\text{C}$ bus recovery routine (clock toggling) to clear hung slave devices.
   - Open-circuit and out-of-range sensor detection: Node must report a dedicated status flag rather than transmitting invalid or zero values when a transducer is disconnected.
4. **Offline Buffer Overflow Protection**:
   - Local circular FIFO flash buffer operates a drop-oldest policy when buffer capacity is exceeded during prolonged communication outages, guaranteeing that the most recent geotechnical telemetry is preserved.

---

## 14. Firmware Architecture (Logical Abstraction Layers)

The embedded firmware structure is partitioned into 4 strict hierarchical layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   APPLICATION & ORCHESTRATION LAYER                    │
│  - System State Machine (Sleep / Sample / Transmit / Recover)          │
│  - Measurement Scheduler & Power Manager                               │
│  - Telemetry Frame Builder & Serialization                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    SERVICES & PROTOCOL STACK LAYER                     │
│  - Sensor Calibration & Offset Engine                                  │
│  - Local Circular Storage / Buffer Manager                             │
│  - LoRa Physical Framing & MAC Handler                                 │
│  - Health Diagnostics & Fault Monitor                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                   HARDWARE ABSTRACTION LAYER (HAL)                     │
│  - Sensor Driver Interfaces (Generic ADC, I2C, SPI, UART Abstractions) │
│  - Power Gate Control Abstraction (GPIO Load Switches)                 │
│  - Watchdog & System Timer Drivers                                     │
│  - Non-Volatile Flash Memory Drivers                                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  MICROCONTROLLER SILICON HARDWARE                      │
│  - MCU Core, Peripherals, Timers, Interrupt Controllers, Transceivers   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Security & Device Identity Baseline

1. **Hardware Identity**:
   - Every node must possess a factory-flashed, tamper-evident 64-bit hardware Unique Identifier (UID) or cryptographically protected DevEUI.
   - This identity maps directly to the verified `node_identifier` database entity (`BE-REQ-003`).
2. **Payload Protection**:
   - Message integrity verification using CRC-16 or AES-CMAC over the air to prevent packet injection or transmission corruption.
   - Network session framing ensuring that only nodes provisioned to the specific mine site are recognized by the Mother System gateway.
3. **Interface Lockdown**:
   - Production firmware must disable debug access ports (JTAG / SWD) or configure hardware read-out protection (RDP Level 1/2) to prevent firmware extraction or tampering in active mine pits.

---

## 16. Verification & Validation Strategy (Phase 26 Architectural Exit Criteria)

To satisfy the exit requirements of Phase 26 and unlock physical implementation in Phase 27, the node architecture must be verified against the following criteria:

| Verification Gate | Validation Method | Acceptance Criteria |
| :--- | :--- | :--- |
| **Requirements Traceability** | Bidirectional Traceability Audit | 100% of node functional requirements trace to Phase 25/Phase 0 baseline without orphan requirements. |
| **Interface Compatibility** | Schema Validation | Binary frame payload maps losslessly to `TelemetryIngestionRequest` schema in `INGESTION_CONTRACT.md`. |
| **Sensor Coverage** | Modality Audit | Architecture explicitly provisions for all 5 verified sensor suites (`displacement`, `vibration`, `cracks`, `environment`, `hazardous gases`). |
| **Zero Component Hallucination** | Architectural Review | Document contains zero unverified commercial chip assumptions; all component specifications are defined as parametric constraints. |
| **Discrepancy Reconciliation** | Documentation Review | Discrepancies between early mockups and production backend schemas are explicitly logged and resolved. |

---

## 17. Engineering Decisions & TBD Action Items for Phase 27

| Item ID | Category | Description | Status |
| :--- | :--- | :--- | :--- |
| **D-HW-001** | Architecture | Formalize binary payload layout (fixed-point vs. CBOR vs. Protobuf). | **PROPOSED FOR PHASE 27** |
| **D-HW-002** | Hardware Selection | Evaluate candidate ultra-low-power MCU silicon platforms based on Section 9 criteria. | **PENDING PHASE 27** |
| **D-HW-003** | Radio Selection | Select candidate Sub-GHz LoRa transceivers matching Section 10 RF criteria. | **PENDING PHASE 27** |
| **D-HW-004** | Transducer Selection | Compile certified commercial transducer catalog for mine deformation, vibration, and gas sensors. | **PENDING PHASE 27** |
| **TBD-HW-01**| Certification | Define specific hazardous-area certification requirements (e.g. DGMS Approval, ATEX Zone 1/2). | **🟡 TBD** |
| **TBD-HW-02**| Mechanical | Specify enclosure IP rating, mechanical mounting brackets, and antenna protection. | **🟡 TBD** |
