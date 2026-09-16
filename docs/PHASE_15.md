# Phase 15 — Nodes + Mine Map Integration

**Date:** September 2026  
**Status:** ✅ Complete

---

## 1. Objective

Integrate the frontend Nodes Management ecosystem and the Mine Map with real backend data from Phases 0–10, using the Phase 12 API client and services architecture.

---

## 2. Backend Capability Audit (Anti-Hallucination)

Before writing any code, the actual backend was inspected for what it truly provides:

| Feature | Backend Status |
|---|---|
| `GET /api/v1/nodes` — list all nodes | ✅ Implemented |
| `GET /api/v1/nodes/{identifier}` — node detail + sensors | ✅ Implemented |
| `GET /api/v1/telemetry/nodes/{id}/latest` — latest readings | ✅ Implemented |
| `POST /api/v1/nodes` — create node via HTTP | ❌ Not implemented |
| Battery % monitoring | ❌ Not in schema |
| LoRa RSSI/SNR monitoring | ❌ Not in schema |
| GPS latitude/longitude per node | ❌ Not in schema |
| Per-chip firmware health (MPU6500 etc.) | ❌ Not in schema |

---

## 3. Components Changed

### `nodeAdapter.ts`
- Added `?? null` coercion for `unit` field in `mountedSensors` to satisfy TypeScript strict type.
- Real mounted sensors from `NodeDetailResponse.sensors` are mapped into `MapNode.mountedSensors`.

### `NodeDetailsDrawer.tsx` *(Major Refactor)*
- **Removed** `enrichNode()` call — the synthetic enrichment function generated fake Dhanbad GPS coordinates, chip names (MPU6500, VL53L0X), packet loss, and hardware health badges.
- **Added** real backend fetch on drawer open: `nodesService.getNodeDetail()` + `telemetryService.getLatestReadings()`.
- Shows loading spinner while data is fetching.
- Shows error notice if backend calls fail.
- **Sensor Health section** now shows real backend `NodeDetailResponse.sensors` list (sensor_type, unit, is_active state).
- Battery and RSSI render `—` (explicitly labeled "Not monitored via API").
- GPS geographic coords render `—` (explicitly labeled "GPS not tracked by backend").
- Communication section uses real `node.isOnline` and `node.lastUpdated`.

### `AddNodeModal.tsx` *(Replaced)*
- The synthetic form (creating fake nodes in memory via `Math.random()`) was replaced with an informative notice explaining that node provisioning is done through LoRa gateway hardware ingestion, not HTTP POST.

### `NodeDetailsPanel.tsx`
- Battery and RSSI now render `—` with a caption "not tracked by backend API".
- All telemetry values are now gated on `node.hasReadings` — showing `—` when no live data exists.

### `LiveMapPage.tsx`
- Added an "Illustrative Schematic — Positions are approximate" disclaimer badge in the page header.
- The TARP exclusion banner is now conditional on real backend data (`isLiveBackend && nodes.some((n) => n.status === 'CRITICAL')`), removing the hardcoded reference to `Node N04`.

### `NodesPage.tsx`
- Removed the now-unused `handleAddNode` handler.
- `AddNodeModal` is passed only `isOpen` and `onClose` (no synthetic create callback).

---

## 4. Verification Results

| Check | Result |
|---|---|
| `npm run build` (TypeScript + Vite) | ✅ Exit 0 |
| `npm run lint` (oxlint) | ✅ 0 warnings, 0 errors |
| `npm test` (18 tests) | ✅ 18 pass, 0 fail |

---

## 5. Known Limitations (Honest Constraints)

These limitations reflect the actual backend implementation (Phases 0–10) and are explicitly surfaced in the UI:

1. **Node provisioning via HTTP** — Not supported. Nodes appear only through hardware ingestion.
2. **Battery % & LoRa RSSI** — Not tracked in the backend schema. Displayed as `—`.
3. **GPS coordinates** — Not stored per-node. Mine map uses an illustrative schematic layout.
4. **Per-chip firmware health** — Not tracked (MPU6500, VL53L0X, SX1278 are not individually reported).
5. **Historical trend sparklines in drawer** — Removed because the mock `generateNodeTrends()` function generated fake data. Real trend history can be added in a future phase using `telemetryService.getHistory()`.
