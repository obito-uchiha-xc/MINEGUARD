import type { SafetyStatus } from '../../types/safety';

export type SensorHealthState = 'Healthy' | 'Warning' | 'Fault' | 'Offline';

export interface HardwareSensorHealth {
  mpu6500: SensorHealthState;       // Tilt & dynamic motion (MPU-6500 6-axis IMU)
  sw1801p: SensorHealthState;       // Shock & mechanical vibration (SW-1801P)
  soilMoisture: SensorHealthState;  // Soil / strata moisture probe
  mq2: SensorHealthState;           // Combustible & hazardous gas detector (MQ-2)
  vl53l0x: SensorHealthState;       // Laser distance / crack displacement proxy (VL53L0X)
  lora: 'Connected' | 'Warning' | 'Offline'; // LoRa SX1278 transceiver
  battery: 'Healthy' | 'Warning' | 'Critical'; // ESP32 power management
}

export interface SensorAnomalyStates {
  tilt: 'Normal' | 'Increasing' | 'Rapid Increase' | 'Elevated';
  displacement: 'Normal' | 'Increasing' | 'Rapid Increase' | 'Elevated';
  vibration: 'Normal' | 'Elevated' | 'High' | 'Severe';
  crackWidth: 'Normal' | 'Increasing' | 'Rapid Expansion';
  soilMoisture: 'Normal' | 'Elevated' | 'Saturated';
  gas: 'Normal' | 'Elevated' | 'Hazardous';
  temperature: 'Normal' | 'Elevated' | 'Critical';
}

export interface NodeCommunication {
  protocol: string;
  signal: 'Excellent' | 'Good' | 'Fair' | 'Weak' | 'Lost';
  lastPacket: string;
  packetAgeSec: number;
  packetLossPct: number;
}

export interface TrendPoint {
  time: string;
  value: number;
}

export interface NodeTrendSet {
  tilt: TrendPoint[];
  displacement: TrendPoint[];
  vibration: TrendPoint[];
  crackWidth: TrendPoint[];
}

export interface MapNode {
  id: string;
  name: string;
  zone: string;
  panel: string;
  xPct: number; // 0 to 100 for SVG/CSS positioning
  yPct: number;
  status: SafetyStatus;
  tiltDeg: number;
  displacementMm: number;
  vibrationLevel: string;
  vibrationMmS: number;
  crackWidthMm: number;
  temperatureC: number;
  moisturePct: number;
  gasStatus: string;
  batteryPct: number;
  aiRiskScore: number;
  riskTrend: 'Increasing' | 'Stable' | 'Decreasing';
  isOnline: boolean;
  rssiDbm: number;
  lastUpdated: string;
  coverageRadiusM?: number;

  // Stage 5 Enriched Telemetry & Planned Hardware
  distanceCm?: number;          // VL53L0X laser distance proxy
  pressureHpa?: number;         // Barometric atmospheric pressure
  gridPosition?: string;        // E.g. "B2-N04"
  lat?: number;
  lng?: number;
  sensorHealth?: HardwareSensorHealth;
  anomalyStates?: SensorAnomalyStates;
  communication?: NodeCommunication;
  nodeHealthPct?: number;       // Demo health score (e.g. 92%)
  riskIndicators?: string[];    // Explainability factors
  acknowledged?: boolean;       // Local acknowledgement flag
  hasReadings?: boolean;        // Whether live telemetry readings exist
  sensorCount?: number;         // Count of registered sensors
  mountedSensors?: Array<{ sensor_type: string; unit: string | null; is_active: boolean }>;
}

export const MAP_NODES: MapNode[] = [
  {
    id: 'N01',
    name: 'Main Haulage Adit North',
    zone: 'Zone A',
    panel: 'Panel A',
    xPct: 14,
    yPct: 22,
    status: 'NORMAL',
    tiltDeg: 0.12,
    displacementMm: 0.8,
    vibrationLevel: 'Low',
    vibrationMmS: 0.42,
    crackWidthMm: 0.15,
    temperatureC: 22.4,
    moisturePct: 28,
    gasStatus: 'Normal (CH4: 110ppm)',
    batteryPct: 94,
    aiRiskScore: 12,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -68,
    lastUpdated: 'Just now',
    coverageRadiusM: 45,
  },
  {
    id: 'N02',
    name: 'Shaft 1 Base Pillar',
    zone: 'Zone A',
    panel: 'Panel A',
    xPct: 24,
    yPct: 26,
    status: 'NORMAL',
    tiltDeg: 0.22,
    displacementMm: 1.1,
    vibrationLevel: 'Low',
    vibrationMmS: 0.58,
    crackWidthMm: 0.22,
    temperatureC: 23.8,
    moisturePct: 32,
    gasStatus: 'Normal (CH4: 125ppm)',
    batteryPct: 92,
    aiRiskScore: 16,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -70,
    lastUpdated: '1m ago',
    coverageRadiusM: 45,
  },
  {
    id: 'N03',
    name: 'Crosscut 3 West Rib',
    zone: 'Zone B',
    panel: 'Panel B',
    xPct: 44,
    yPct: 32,
    status: 'WARNING',
    tiltDeg: 0.94,
    displacementMm: 2.8,
    vibrationLevel: 'Moderate',
    vibrationMmS: 1.84,
    crackWidthMm: 0.65,
    temperatureC: 27.2,
    moisturePct: 46,
    gasStatus: 'Elevated (CH4: 340ppm)',
    batteryPct: 88,
    aiRiskScore: 42,
    riskTrend: 'Increasing',
    isOnline: true,
    rssiDbm: -78,
    lastUpdated: 'Just now',
    coverageRadiusM: 40,
  },
  {
    id: 'N04',
    name: 'Sub-level Stope 4B Pillar',
    zone: 'Zone B',
    panel: 'Panel B',
    xPct: 58,
    yPct: 40,
    status: 'CRITICAL',
    tiltDeg: 1.82,
    displacementMm: 4.7,
    vibrationLevel: 'High',
    vibrationMmS: 3.85,
    crackWidthMm: 1.2,
    temperatureC: 30.8,
    moisturePct: 62,
    gasStatus: 'Anomaly (CH4: 680ppm, CO: 28ppm)',
    batteryPct: 87,
    aiRiskScore: 78,
    riskTrend: 'Increasing',
    isOnline: true,
    rssiDbm: -84,
    lastUpdated: 'Just now',
    coverageRadiusM: 40,
  },
  {
    id: 'N05',
    name: 'Stope 4B Hanging Wall',
    zone: 'Zone B',
    panel: 'Panel B',
    xPct: 66,
    yPct: 36,
    status: 'HIGH_RISK',
    tiltDeg: 1.64,
    displacementMm: 4.1,
    vibrationLevel: 'High',
    vibrationMmS: 3.12,
    crackWidthMm: 1.05,
    temperatureC: 30.2,
    moisturePct: 58,
    gasStatus: 'Elevated (CH4: 490ppm)',
    batteryPct: 79,
    aiRiskScore: 72,
    riskTrend: 'Increasing',
    isOnline: true,
    rssiDbm: -82,
    lastUpdated: '2m ago',
    coverageRadiusM: 40,
  },
  {
    id: 'N06',
    name: 'Main Conveyor Gallery Entry',
    zone: 'Zone A',
    panel: 'Panel A',
    xPct: 30,
    yPct: 18,
    status: 'NORMAL',
    tiltDeg: 0.16,
    displacementMm: 0.7,
    vibrationLevel: 'Low',
    vibrationMmS: 0.38,
    crackWidthMm: 0.12,
    temperatureC: 22.1,
    moisturePct: 24,
    gasStatus: 'Normal (CH4: 95ppm)',
    batteryPct: 96,
    aiRiskScore: 8,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -64,
    lastUpdated: '1m ago',
    coverageRadiusM: 45,
  },
  {
    id: 'N07',
    name: 'Access Ramp 2 Midpoint',
    zone: 'Zone B',
    panel: 'Panel B',
    xPct: 50,
    yPct: 24,
    status: 'NORMAL',
    tiltDeg: 0.28,
    displacementMm: 1.2,
    vibrationLevel: 'Low',
    vibrationMmS: 0.74,
    crackWidthMm: 0.25,
    temperatureC: 24.5,
    moisturePct: 34,
    gasStatus: 'Normal (CH4: 140ppm)',
    batteryPct: 91,
    aiRiskScore: 19,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -72,
    lastUpdated: '3m ago',
    coverageRadiusM: 45,
  },
  {
    id: 'N08',
    name: 'Electrical Substation Vault B',
    zone: 'Zone B',
    panel: 'Panel B',
    xPct: 38,
    yPct: 42,
    status: 'NORMAL',
    tiltDeg: 0.2,
    displacementMm: 0.9,
    vibrationLevel: 'Low',
    vibrationMmS: 0.52,
    crackWidthMm: 0.18,
    temperatureC: 25.8,
    moisturePct: 30,
    gasStatus: 'Normal (CH4: 115ppm)',
    batteryPct: 93,
    aiRiskScore: 14,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -69,
    lastUpdated: 'Just now',
    coverageRadiusM: 45,
  },
  {
    id: 'N09',
    name: 'Stope 4B Footwall Shear',
    zone: 'Zone B',
    panel: 'Panel B',
    xPct: 62,
    yPct: 48,
    status: 'HIGH_RISK',
    tiltDeg: 1.52,
    displacementMm: 3.8,
    vibrationLevel: 'High',
    vibrationMmS: 2.95,
    crackWidthMm: 0.98,
    temperatureC: 31.0,
    moisturePct: 60,
    gasStatus: 'Elevated (CH4: 460ppm)',
    batteryPct: 81,
    aiRiskScore: 70,
    riskTrend: 'Increasing',
    isOnline: true,
    rssiDbm: -83,
    lastUpdated: '1m ago',
    coverageRadiusM: 40,
  },
  {
    id: 'N10',
    name: 'Refuge Chamber 2 Portal',
    zone: 'Zone C',
    panel: 'Panel C',
    xPct: 70,
    yPct: 22,
    status: 'NORMAL',
    tiltDeg: 0.14,
    displacementMm: 0.5,
    vibrationLevel: 'Low',
    vibrationMmS: 0.35,
    crackWidthMm: 0.1,
    temperatureC: 21.8,
    moisturePct: 22,
    gasStatus: 'Normal (CH4: 90ppm)',
    batteryPct: 98,
    aiRiskScore: 7,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -62,
    lastUpdated: 'Just now',
    coverageRadiusM: 45,
  },
  {
    id: 'N11',
    name: 'East Incline Gallery Crown',
    zone: 'Zone C',
    panel: 'Panel C',
    xPct: 78,
    yPct: 46,
    status: 'WARNING',
    tiltDeg: 0.88,
    displacementMm: 2.4,
    vibrationLevel: 'Moderate',
    vibrationMmS: 1.95,
    crackWidthMm: 0.74,
    temperatureC: 28.1,
    moisturePct: 50,
    gasStatus: 'Moderate (CH4: 310ppm)',
    batteryPct: 84,
    aiRiskScore: 46,
    riskTrend: 'Increasing',
    isOnline: true,
    rssiDbm: -76,
    lastUpdated: 'Just now',
    coverageRadiusM: 40,
  },
  {
    id: 'N12',
    name: 'Ventilation Raise 2 Intake',
    zone: 'Zone A',
    panel: 'Panel A',
    xPct: 18,
    yPct: 48,
    status: 'NORMAL',
    tiltDeg: 0.18,
    displacementMm: 0.9,
    vibrationLevel: 'Low',
    vibrationMmS: 0.62,
    crackWidthMm: 0.18,
    temperatureC: 21.5,
    moisturePct: 25,
    gasStatus: 'Normal (CH4: 105ppm)',
    batteryPct: 96,
    aiRiskScore: 11,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -65,
    lastUpdated: '2m ago',
    coverageRadiusM: 45,
  },
  {
    id: 'N13',
    name: 'Conveyor Drive Head Station',
    zone: 'Zone A',
    panel: 'Panel A',
    xPct: 28,
    yPct: 58,
    status: 'NORMAL',
    tiltDeg: 0.35,
    displacementMm: 1.4,
    vibrationLevel: 'Low',
    vibrationMmS: 0.85,
    crackWidthMm: 0.3,
    temperatureC: 24.0,
    moisturePct: 30,
    gasStatus: 'Normal (CH4: 130ppm)',
    batteryPct: 91,
    aiRiskScore: 20,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -72,
    lastUpdated: 'Just now',
    coverageRadiusM: 45,
  },
  {
    id: 'N14',
    name: 'Drainage Crosscut 5 Intersect',
    zone: 'Zone D',
    panel: 'Panel D',
    xPct: 34,
    yPct: 70,
    status: 'NORMAL',
    tiltDeg: 0.26,
    displacementMm: 1.1,
    vibrationLevel: 'Low',
    vibrationMmS: 0.65,
    crackWidthMm: 0.22,
    temperatureC: 24.8,
    moisturePct: 42,
    gasStatus: 'Normal (CH4: 120ppm)',
    batteryPct: 89,
    aiRiskScore: 16,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -75,
    lastUpdated: '4m ago',
    coverageRadiusM: 45,
  },
  {
    id: 'N15',
    name: 'Return Air Drift 3 South',
    zone: 'Zone D',
    panel: 'Panel D',
    xPct: 46,
    yPct: 66,
    status: 'NORMAL',
    tiltDeg: 0.32,
    displacementMm: 1.3,
    vibrationLevel: 'Low',
    vibrationMmS: 0.8,
    crackWidthMm: 0.28,
    temperatureC: 26.2,
    moisturePct: 36,
    gasStatus: 'Normal (CH4: 155ppm)',
    batteryPct: 88,
    aiRiskScore: 21,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -74,
    lastUpdated: '1m ago',
    coverageRadiusM: 45,
  },
  {
    id: 'N16',
    name: 'Deep Drift South Face',
    zone: 'Zone D',
    panel: 'Panel D',
    xPct: 54,
    yPct: 72,
    status: 'HIGH_RISK',
    tiltDeg: 1.45,
    displacementMm: 3.9,
    vibrationLevel: 'High',
    vibrationMmS: 2.9,
    crackWidthMm: 0.92,
    temperatureC: 32.4,
    moisturePct: 64,
    gasStatus: 'Elevated (CH4: 480ppm, CO: 18ppm)',
    batteryPct: 75,
    aiRiskScore: 68,
    riskTrend: 'Increasing',
    isOnline: true,
    rssiDbm: -88,
    lastUpdated: 'Just now',
    coverageRadiusM: 40,
  },
  {
    id: 'N17',
    name: 'Crown Pillar Monitor East',
    zone: 'Zone C',
    panel: 'Panel C',
    xPct: 86,
    yPct: 34,
    status: 'NORMAL',
    tiltDeg: 0.22,
    displacementMm: 0.9,
    vibrationLevel: 'Low',
    vibrationMmS: 0.55,
    crackWidthMm: 0.2,
    temperatureC: 25.4,
    moisturePct: 26,
    gasStatus: 'Normal (CH4: 110ppm)',
    batteryPct: 93,
    aiRiskScore: 14,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -67,
    lastUpdated: '2m ago',
    coverageRadiusM: 45,
  },
  {
    id: 'N18',
    name: 'Sub-station Transformer Vault',
    zone: 'Zone C',
    panel: 'Panel C',
    xPct: 84,
    yPct: 56,
    status: 'NORMAL',
    tiltDeg: 0.15,
    displacementMm: 0.6,
    vibrationLevel: 'Low',
    vibrationMmS: 0.35,
    crackWidthMm: 0.1,
    temperatureC: 26.8,
    moisturePct: 22,
    gasStatus: 'Normal (CH4: 95ppm)',
    batteryPct: 95,
    aiRiskScore: 9,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -62,
    lastUpdated: 'Just now',
    coverageRadiusM: 45,
  },
  {
    id: 'N19',
    name: 'Haulage Decline Junction C',
    zone: 'Zone C',
    panel: 'Panel C',
    xPct: 74,
    yPct: 68,
    status: 'NORMAL',
    tiltDeg: 0.38,
    displacementMm: 1.5,
    vibrationLevel: 'Low',
    vibrationMmS: 0.88,
    crackWidthMm: 0.32,
    temperatureC: 27.0,
    moisturePct: 35,
    gasStatus: 'Normal (CH4: 140ppm)',
    batteryPct: 90,
    aiRiskScore: 23,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -71,
    lastUpdated: '3m ago',
    coverageRadiusM: 45,
  },
  {
    id: 'N20',
    name: 'Ore Pass 3 Chute Wall',
    zone: 'Zone B',
    panel: 'Panel B',
    xPct: 48,
    yPct: 54,
    status: 'WARNING',
    tiltDeg: 0.78,
    displacementMm: 2.1,
    vibrationLevel: 'Moderate',
    vibrationMmS: 1.75,
    crackWidthMm: 0.58,
    temperatureC: 28.5,
    moisturePct: 48,
    gasStatus: 'Moderate (CH4: 290ppm)',
    batteryPct: 82,
    aiRiskScore: 40,
    riskTrend: 'Increasing',
    isOnline: true,
    rssiDbm: -80,
    lastUpdated: 'Just now',
    coverageRadiusM: 40,
  },
  {
    id: 'N21',
    name: 'Deep Drift Extraction Drift 2',
    zone: 'Zone D',
    panel: 'Panel D',
    xPct: 62,
    yPct: 76,
    status: 'HIGH_RISK',
    tiltDeg: 1.38,
    displacementMm: 3.5,
    vibrationLevel: 'High',
    vibrationMmS: 2.75,
    crackWidthMm: 0.88,
    temperatureC: 31.8,
    moisturePct: 61,
    gasStatus: 'Elevated (CH4: 420ppm)',
    batteryPct: 77,
    aiRiskScore: 65,
    riskTrend: 'Increasing',
    isOnline: true,
    rssiDbm: -86,
    lastUpdated: 'Just now',
    coverageRadiusM: 40,
  },
  {
    id: 'N22',
    name: 'Return Airway 4 Regulator',
    zone: 'Zone D',
    panel: 'Panel D',
    xPct: 70,
    yPct: 82,
    status: 'NORMAL',
    tiltDeg: 0.28,
    displacementMm: 1.2,
    vibrationLevel: 'Low',
    vibrationMmS: 0.72,
    crackWidthMm: 0.25,
    temperatureC: 27.9,
    moisturePct: 38,
    gasStatus: 'Normal (CH4: 160ppm)',
    batteryPct: 89,
    aiRiskScore: 18,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -74,
    lastUpdated: '2m ago',
    coverageRadiusM: 45,
  },
  {
    id: 'N23',
    name: 'Drainage Sump Pump Alcove',
    zone: 'Zone E',
    panel: 'Panel E',
    xPct: 38,
    yPct: 85,
    status: 'NORMAL',
    tiltDeg: 0.24,
    displacementMm: 1.0,
    vibrationLevel: 'Low',
    vibrationMmS: 0.68,
    crackWidthMm: 0.2,
    temperatureC: 25.1,
    moisturePct: 55,
    gasStatus: 'Normal (CH4: 110ppm)',
    batteryPct: 90,
    aiRiskScore: 17,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -77,
    lastUpdated: '1m ago',
    coverageRadiusM: 45,
  },
  {
    id: 'N24',
    name: 'Water Discharge Borehole Shaft',
    zone: 'Zone E',
    panel: 'Panel E',
    xPct: 52,
    yPct: 88,
    status: 'NORMAL',
    tiltDeg: 0.18,
    displacementMm: 0.8,
    vibrationLevel: 'Low',
    vibrationMmS: 0.45,
    crackWidthMm: 0.15,
    temperatureC: 23.9,
    moisturePct: 48,
    gasStatus: 'Normal (CH4: 100ppm)',
    batteryPct: 92,
    aiRiskScore: 12,
    riskTrend: 'Stable',
    isOnline: true,
    rssiDbm: -73,
    lastUpdated: ' Just now',
    coverageRadiusM: 45,
  },
  {
    id: 'N25',
    name: 'Exploratory Borehole Collar',
    zone: 'Zone E',
    panel: 'Panel E',
    xPct: 88,
    yPct: 78,
    status: 'OFFLINE',
    tiltDeg: 0.0,
    displacementMm: 0.0,
    vibrationLevel: 'Unknown',
    vibrationMmS: 0.0,
    crackWidthMm: 0.0,
    temperatureC: 0.0,
    moisturePct: 0,
    gasStatus: 'Offline',
    batteryPct: 0,
    aiRiskScore: 0,
    riskTrend: 'Stable',
    isOnline: false,
    rssiDbm: -120,
    lastUpdated: '3h ago (Timeout)',
    coverageRadiusM: 0,
  },
];

/**
 * Enriches a MapNode with hardware mappings, communication stats,
 * and explainability metrics for deep telemetry inspection.
 */
export function enrichNode(node: MapNode): MapNode {
  // If already enriched with hardware diagnostics, return
  if (node.sensorHealth && node.communication && node.anomalyStates) {
    return node;
  }

  const isOffline = !node.isOnline || node.status === 'OFFLINE';
  const isCritical = node.status === 'CRITICAL';
  const isHighRisk = node.status === 'HIGH_RISK';
  const isWarning = node.status === 'WARNING';

  // Zone & Grid mapping
  const zoneCode = node.zone.replace('Zone ', '');
  const panelCode = node.panel.replace('Panel ', '');
  const gridPosition = `${zoneCode}${panelCode}-${node.id}`;

  // Geotechnical coordinates (Dhanbad coal belt reference)
  const lat = Number((23.75412 + (node.yPct - 50) * 0.00032).toFixed(5));
  const lng = Number((86.41890 + (node.xPct - 50) * 0.00045).toFixed(5));

  // VL53L0X laser distance proxy & Barometric pressure
  const distanceCm = isOffline ? 0 : node.id === 'N04' ? 12.4 : Number((15.0 - Math.min(8.0, node.displacementMm * 0.6)).toFixed(1));
  const pressureHpa = isOffline ? 0 : node.id === 'N04' ? 1012 : 1010 + Math.round((node.yPct / 100) * 8);

  // Hardware sensor diagnostics (MPU6500, SW-1801P, Soil, MQ-2, VL53L0X, LoRa SX1278, ESP32)
  const sensorHealth: HardwareSensorHealth = isOffline
    ? {
        mpu6500: 'Offline',
        sw1801p: 'Offline',
        soilMoisture: 'Offline',
        mq2: 'Offline',
        vl53l0x: 'Offline',
        lora: 'Offline',
        battery: 'Critical',
      }
    : node.id === 'N04'
    ? {
        mpu6500: 'Healthy',
        sw1801p: 'Healthy',
        soilMoisture: 'Healthy',
        mq2: 'Healthy',
        vl53l0x: 'Healthy',
        lora: 'Connected',
        battery: 'Healthy',
      }
    : {
        mpu6500: isCritical ? 'Warning' : 'Healthy',
        sw1801p: node.vibrationMmS > 3.0 ? 'Warning' : 'Healthy',
        soilMoisture: 'Healthy',
        mq2: node.gasStatus.includes('Elevated') ? 'Warning' : 'Healthy',
        vl53l0x: 'Healthy',
        lora: node.rssiDbm < -85 ? 'Warning' : 'Connected',
        battery: node.batteryPct < 25 ? 'Warning' : 'Healthy',
      };

  // Sensor Anomaly Status breakdown
  const anomalyStates: SensorAnomalyStates = isOffline
    ? {
        tilt: 'Normal',
        displacement: 'Normal',
        vibration: 'Normal',
        crackWidth: 'Normal',
        soilMoisture: 'Normal',
        gas: 'Normal',
        temperature: 'Normal',
      }
    : node.id === 'N04'
    ? {
        tilt: 'Increasing',
        displacement: 'Rapid Increase',
        vibration: 'Elevated',
        crackWidth: 'Increasing',
        soilMoisture: 'Normal',
        gas: 'Normal',
        temperature: 'Normal',
      }
    : {
        tilt: node.tiltDeg >= 1.5 ? 'Increasing' : node.tiltDeg >= 0.8 ? 'Elevated' : 'Normal',
        displacement: node.displacementMm >= 4.0 ? 'Rapid Increase' : node.displacementMm >= 2.5 ? 'Increasing' : 'Normal',
        vibration: node.vibrationMmS >= 3.0 ? 'Elevated' : node.vibrationMmS >= 1.8 ? 'High' : 'Normal',
        crackWidth: node.crackWidthMm >= 1.0 ? 'Increasing' : node.crackWidthMm >= 0.5 ? 'Increasing' : 'Normal',
        soilMoisture: node.moisturePct >= 60 ? 'Elevated' : 'Normal',
        gas: node.gasStatus.includes('Anomaly') ? 'Hazardous' : node.gasStatus.includes('Elevated') ? 'Elevated' : 'Normal',
        temperature: node.temperatureC >= 30.0 ? 'Elevated' : 'Normal',
      };

  // Communication diagnostics (LoRa SX1278)
  const signalQuality = isOffline ? 'Lost' : node.rssiDbm >= -70 ? 'Excellent' : node.rssiDbm >= -78 ? 'Good' : node.rssiDbm >= -86 ? 'Fair' : 'Weak';
  const packetAgeSec = isOffline ? 10800 : node.id === 'N04' ? 4 : Math.floor(Math.random() * 6) + 2;
  const packetLossPct = isOffline ? 100 : node.id === 'N04' ? 1.2 : Number((Math.random() * 1.5).toFixed(1));

  const communication: NodeCommunication = {
    protocol: 'LoRa SX1278 (868 MHz)',
    signal: signalQuality,
    lastPacket: isOffline ? '3h ago' : '10:24:36 AM',
    packetAgeSec,
    packetLossPct,
  };

  // Explainability: Why is this node flagged?
  const riskIndicators: string[] = [];
  if (!isOffline) {
    if (node.id === 'N04') {
      riskIndicators.push('Displacement increasing (+1.4 mm in 6h)');
      riskIndicators.push('Tilt above baseline (1.82°)');
      riskIndicators.push('Vibration anomaly detected (3.8 mm/s)');
      riskIndicators.push('Crack width increasing (1.2 mm)');
    } else {
      if (node.displacementMm >= 3.0) riskIndicators.push('Displacement increasing');
      else if (node.displacementMm >= 2.0) riskIndicators.push('Displacement above baseline');
      if (node.tiltDeg >= 0.8) riskIndicators.push('Tilt above baseline');
      if (node.vibrationMmS >= 2.0) riskIndicators.push('Vibration anomaly detected');
      if (node.crackWidthMm >= 0.6) riskIndicators.push('Crack width increasing');
      if (node.moisturePct >= 55) riskIndicators.push('High strata moisture level');
      if (node.gasStatus.includes('Elevated') || node.gasStatus.includes('Anomaly')) {
        riskIndicators.push('Elevated gas concentration detected');
      }
      if (riskIndicators.length === 0 && (isCritical || isHighRisk || isWarning)) {
        riskIndicators.push('Elevated subsidence indicators detected');
      }
    }
  }

  // Node health percentage (UI demo score)
  const nodeHealthPct = isOffline
    ? 0
    : node.id === 'N04'
    ? 92
    : Math.min(99, Math.max(55, Math.round(100 - node.aiRiskScore * 0.35 - (100 - node.batteryPct) * 0.1)));

  return {
    ...node,
    distanceCm,
    pressureHpa,
    gridPosition,
    lat,
    lng,
    sensorHealth,
    anomalyStates,
    communication,
    nodeHealthPct,
    riskIndicators,
  };
}

/**
 * Generates mini sparkline trend curves for Tilt, Displacement, Vibration, Crack Width
 * across 1H, 6H, 24H, 7D time ranges for the Node Details panel.
 */
export function generateNodeTrends(
  node: MapNode,
  timeRange: '1H' | '6H' | '24H' | '7D'
): NodeTrendSet {
  const pointsCount = timeRange === '1H' ? 7 : timeRange === '6H' ? 9 : timeRange === '24H' ? 12 : 14;
  const isIncreasing = node.riskTrend === 'Increasing' || node.status === 'CRITICAL' || node.status === 'HIGH_RISK';

  const times: string[] = [];
  for (let i = pointsCount - 1; i >= 0; i--) {
    if (timeRange === '1H') {
      times.push(`${i * 10}m ago`);
    } else if (timeRange === '6H') {
      times.push(`${(i * 0.75).toFixed(1)}h`);
    } else if (timeRange === '24H') {
      times.push(`${i * 2}h`);
    } else {
      times.push(`D-${i}`);
    }
  }
  times[times.length - 1] = 'Now';

  const buildSeries = (currentVal: number, _spreadPct: number): TrendPoint[] => {
    return times.map((t, idx) => {
      const progress = idx / (pointsCount - 1); // 0 at oldest, 1 at Now
      const baseline = isIncreasing
        ? currentVal * (0.65 + 0.35 * Math.pow(progress, 1.4))
        : currentVal * (0.95 + 0.05 * progress);
      const jitter = (Math.sin(idx * 1.7) * 0.05) * currentVal;
      const val = Math.max(0, Number((baseline + jitter).toFixed(2)));
      return {
        time: t,
        value: idx === pointsCount - 1 ? currentVal : val,
      };
    });
  };

  return {
    tilt: buildSeries(node.tiltDeg, 0.4),
    displacement: buildSeries(node.displacementMm, 0.5),
    vibration: buildSeries(node.vibrationMmS, 0.4),
    crackWidth: buildSeries(node.crackWidthMm, 0.3),
  };
}

