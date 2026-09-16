/**
 * Node Adapter
 *
 * Maps backend NodeSummaryResponse / NodeDetailResponse DTOs into the MapNode
 * structure required by the Live Map, Node Inventory, and Dashboard.
 */

import type { MapNode } from '../../data/mock/nodes';
import type { NodeDetailResponse, NodeSummaryResponse, SensorReadingResponse } from '../../types/api';
import type { SafetyStatus } from '../../types/safety';

// Static spatial coordinate layout map for demonstration schematic visualization
const DEMO_COORDINATES = [
  { xPct: 18, yPct: 24, zone: 'Zone A • Main Haulage', panel: 'Panel 1' },
  { xPct: 35, yPct: 28, zone: 'Zone A • Main Haulage', panel: 'Panel 2' },
  { xPct: 54, yPct: 38, zone: 'Zone B2 • Stope 4B', panel: 'Panel 3' },
  { xPct: 62, yPct: 42, zone: 'Zone B2 • Stope 4B', panel: 'Panel 4' },
  { xPct: 28, yPct: 55, zone: 'Zone C • East Incline', panel: 'Panel 5' },
  { xPct: 45, yPct: 68, zone: 'Zone C • East Incline', panel: 'Panel 6' },
  { xPct: 68, yPct: 62, zone: 'Zone D • Lower Return', panel: 'Panel 7' },
  { xPct: 82, yPct: 45, zone: 'Zone D • Lower Return', panel: 'Panel 8' },
];

const COORDINATE_MAP: Record<string, { xPct: number; yPct: number; zone: string; panel: string }> = {
  'NODE-JHR-01': DEMO_COORDINATES[0],
  'NODE-JHR-02': DEMO_COORDINATES[1],
  'NODE-JHR-03': DEMO_COORDINATES[2],
  'NODE-RNJ-01': DEMO_COORDINATES[3],
  'N01': DEMO_COORDINATES[0],
  'N02': DEMO_COORDINATES[1],
  'N03': DEMO_COORDINATES[2],
  'N04': DEMO_COORDINATES[3],
  'N05': DEMO_COORDINATES[4],
  'N06': DEMO_COORDINATES[5],
  'N07': DEMO_COORDINATES[6],
  'N08': DEMO_COORDINATES[7],
};

/**
 * Derives composite SafetyStatus from node status and optional risk level.
 */
export function deriveNodeSafetyStatus(
  status: string,
  riskLevel?: 'NORMAL' | 'ELEVATED' | 'HIGH'
): SafetyStatus {
  if (status.toUpperCase() === 'UNRESPONSIVE') {
    return 'OFFLINE';
  }
  if (riskLevel === 'HIGH') {
    return 'CRITICAL';
  }
  if (riskLevel === 'ELEVATED') {
    return 'WARNING';
  }
  return 'NORMAL';
}

/**
 * Transforms a backend NodeSummaryResponse into a MapNode.
 */
export function adaptNodeSummaryToMapNode(
  nodeSummary: NodeSummaryResponse,
  readings: SensorReadingResponse[] = [],
  riskLevel?: 'NORMAL' | 'ELEVATED' | 'HIGH'
): MapNode {
  const id = nodeSummary.node_identifier;
  const layout = COORDINATE_MAP[id] || {
    xPct: 50,
    yPct: 50,
    zone: `Zone ${nodeSummary.zone_id}`,
    panel: 'Panel A',
  };

  const hasReadings = readings && readings.length > 0;
  let tiltDeg = 0;
  let displacementMm = 0;
  let vibrationMmS = 0;
  let crackWidthMm = 0;
  let temperatureC = 0;
  let moisturePct = 0;
  let gasStatus = hasReadings ? 'Nominal' : 'Awaiting Telemetry';

  for (const r of readings) {
    const t = r.sensor_type.toLowerCase();
    if (t.includes('tilt')) tiltDeg = r.value;
    else if (t.includes('displacement')) displacementMm = r.value;
    else if (t.includes('vibration')) vibrationMmS = r.value;
    else if (t.includes('crack')) crackWidthMm = r.value;
    else if (t.includes('temp')) temperatureC = r.value;
    else if (t.includes('moisture') || t.includes('humidity')) moisturePct = r.value;
    else if (t.includes('gas') || t.includes('ch4') || t.includes('co')) {
      if (r.value > 50) gasStatus = `Elevated (${r.value})`;
      else gasStatus = `Nominal (${r.value})`;
    }
  }

  const isOnline = nodeSummary.status.toUpperCase() === 'ACTIVE';
  const status = deriveNodeSafetyStatus(nodeSummary.status, riskLevel);

  return {
    id,
    name: `Node ${id}`,
    zone: layout.zone,
    panel: layout.panel,
    xPct: layout.xPct,
    yPct: layout.yPct,
    status,
    tiltDeg,
    displacementMm,
    vibrationLevel: vibrationMmS > 5 ? 'Elevated' : 'Normal',
    vibrationMmS,
    crackWidthMm,
    temperatureC,
    moisturePct,
    gasStatus,
    batteryPct: 0, // Unmonitored in backend Phases 0-10
    aiRiskScore: riskLevel === 'HIGH' ? 80 : riskLevel === 'ELEVATED' ? 50 : 15,
    riskTrend: riskLevel === 'HIGH' ? 'Increasing' : 'Stable',
    isOnline,
    rssiDbm: 0, // Unmonitored in backend Phases 0-10
    lastUpdated: nodeSummary.last_seen_at || 'Never',
    hasReadings,
    sensorCount: nodeSummary.sensor_count,
  };
}

/**
 * Transforms a backend NodeDetailResponse into a MapNode.
 */
export function adaptNodeDetailToMapNode(
  nodeDetail: NodeDetailResponse,
  readings: SensorReadingResponse[] = [],
  riskLevel?: 'NORMAL' | 'ELEVATED' | 'HIGH'
): MapNode {
  const summary: NodeSummaryResponse = {
    id: nodeDetail.id,
    zone_id: nodeDetail.zone_id,
    node_identifier: nodeDetail.node_identifier,
    status: nodeDetail.status,
    last_seen_at: nodeDetail.last_seen_at,
    sensor_count: nodeDetail.sensors.length,
  };

  const adapted = adaptNodeSummaryToMapNode(summary, readings, riskLevel);
  if (nodeDetail.zone_name) {
    adapted.zone = nodeDetail.zone_name;
  }
  adapted.mountedSensors = nodeDetail.sensors.map((s) => ({
    sensor_type: s.sensor_type,
    unit: s.unit ?? null,
    is_active: s.is_active,
  }));
  return adapted;
}
