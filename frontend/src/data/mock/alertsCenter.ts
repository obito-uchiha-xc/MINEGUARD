export type AlertSeverityLevel = 'CRITICAL' | 'HIGH_RISK' | 'WARNING';

export type AlertOperationalStatus = 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';

export type AlertCategory =
  | 'GROUND_MOVEMENT'
  | 'SENSOR_ANOMALY'
  | 'NODE_HEALTH'
  | 'COMMUNICATION'
  | 'ENVIRONMENTAL';

export interface SensorContributionState {
  sensor: string;
  parameter: string;
  hardwareDevice: string;
  status: 'Increasing' | 'Rapid Increase' | 'Elevated' | 'Expanding' | 'Stable' | 'Normal';
  currentVal: string;
  baselineVal: string;
  deviation: string;
  isContributing: boolean;
}

export interface EscalationPoint {
  time: string;
  severity: AlertSeverityLevel;
  label: string;
}

export interface AuditLogEntry {
  time: string;
  action: string;
  actor: string;
  notes?: string;
}

export interface NearbyNodeStatus {
  nodeId: string;
  zone: string;
  severity: AlertSeverityLevel | 'NORMAL';
  trend: string;
}

export interface MineAlert {
  id: string; // e.g. "MG-0042"
  timestamp: string;
  relativeTime: string;
  duration: string;
  nodeId: string;
  zone: string;
  panel: string;
  severity: AlertSeverityLevel;
  status: AlertOperationalStatus;
  category: AlertCategory;
  title: string;
  description: string;
  riskScore: number;
  riskTrend: 'Increasing' | 'Stable' | 'Decreasing';
  confidencePct: number;
  contributingSensors: SensorContributionState[];
  contributingCount: number;
  totalSensorsCount: number;
  spatialCorrelation: {
    nearbyNodes: string[];
    nodeStatuses: NearbyNodeStatus[];
    clusterSummary: string;
  };
  temporalProgression: {
    time: string;
    parameter: string;
    description: string;
  }[];
  escalationHistory: EscalationPoint[];
  auditHistory: AuditLogEntry[];
  recommendedAction: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  investigatingAt?: string;
  investigatingBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  sparkline?: number[];
  reasoning?: string;
  telemetryRate?: string;
}

export interface AlertFilterState {
  searchQuery: string;
  severity: AlertSeverityLevel | 'ALL';
  status: AlertOperationalStatus | 'ALL' | 'UNRESOLVED';
  zone: string;
  node?: string;
  category: AlertCategory | 'ALL';
  sortBy: 'SEVERITY_DESC' | 'RISK_SCORE_DESC' | 'TIMESTAMP_DESC' | 'TIMESTAMP_ASC';
}

/**
 * Shared mock alert dataset.
 * Counts strictly satisfy Stage 7 specifications:
 * Total: 11 alerts
 * Critical: 1
 * High Risk: 4
 * Warning: 6
 * Acknowledged: 5
 * Unresolved: 6 (4 New, 2 Investigating)
 */
export const INITIAL_MINE_ALERTS: MineAlert[] = [
  // 1. CRITICAL ALERT (N04 - NEW, UNRESOLVED)
  {
    id: 'MG-0042',
    timestamp: '10:24:36 AM',
    relativeTime: '12 sec ago',
    duration: '18 min active',
    nodeId: 'N04',
    zone: 'Zone B',
    panel: 'Panel B',
    severity: 'CRITICAL',
    status: 'NEW',
    category: 'GROUND_MOVEMENT',
    title: 'Progressive Ground Movement Detected',
    description:
      'Displacement increased by 62%, tilt deviation detected, vibration elevated, crack aperture expanding across sub-level stope.',
    riskScore: 82,
    riskTrend: 'Increasing',
    confidencePct: 88,
    contributingSensors: [
      {
        sensor: 'Displacement',
        parameter: 'Surface Displacement',
        hardwareDevice: 'VL53L0X Laser Proxy',
        status: 'Rapid Increase',
        currentVal: '4.7 mm',
        baselineVal: '2.9 mm',
        deviation: '+62%',
        isContributing: true,
      },
      {
        sensor: 'Tilt Angle',
        parameter: 'Angular Deviation',
        hardwareDevice: 'MPU6500 6-Axis IMU',
        status: 'Increasing',
        currentVal: '1.82°',
        baselineVal: '0.72°',
        deviation: '+153%',
        isContributing: true,
      },
      {
        sensor: 'Vibration',
        parameter: 'Dynamic Seismicity',
        hardwareDevice: 'SW-1801P Shock Sensor',
        status: 'Elevated',
        currentVal: '3.85 mm/s',
        baselineVal: '1.20 mm/s',
        deviation: '+220%',
        isContributing: true,
      },
      {
        sensor: 'Crack Width',
        parameter: 'Aperture Expansion',
        hardwareDevice: 'Strain Gauge / Laser',
        status: 'Expanding',
        currentVal: '1.20 mm',
        baselineVal: '0.50 mm',
        deviation: '+140%',
        isContributing: true,
      },
      {
        sensor: 'Soil Moisture',
        parameter: 'Strata Pore Saturation',
        hardwareDevice: 'Resistive Soil Probe',
        status: 'Stable',
        currentVal: '62%',
        baselineVal: '40%',
        deviation: '+55%',
        isContributing: false,
      },
    ],
    contributingCount: 4,
    totalSensorsCount: 5,
    spatialCorrelation: {
      nearbyNodes: ['N03', 'N04', 'N05'],
      nodeStatuses: [
        { nodeId: 'N03', zone: 'Zone B', severity: 'WARNING', trend: 'Tilt variance' },
        { nodeId: 'N04', zone: 'Zone B', severity: 'CRITICAL', trend: 'Accelerating shear' },
        { nodeId: 'N05', zone: 'Zone B', severity: 'HIGH_RISK', trend: 'Hanging wall deformation' },
      ],
      clusterSummary:
        '3 nearby nodes show related deformation trends within a 45m radius in Stope 4B.',
    },
    temporalProgression: [
      { time: '10:05 AM', parameter: 'Tilt', description: 'Angular deviation above normal baseline (0.95°)' },
      { time: '10:11 AM', parameter: 'Crack Width', description: 'Crack expansion velocity accelerated to +0.03 mm/hr' },
      { time: '10:18 AM', parameter: 'Vibration', description: 'Dynamic micro-seismic shock registered (3.85 mm/s)' },
      { time: '10:24 AM', parameter: 'Displacement', description: 'Laser displacement threshold breach (4.7 mm)' },
    ],
    escalationHistory: [
      { time: '09:55 AM', severity: 'WARNING', label: 'Single-sensor variance detected' },
      { time: '10:12 AM', severity: 'HIGH_RISK', label: 'Cross-parameter multi-sensor correlation active' },
      { time: '10:24 AM', severity: 'CRITICAL', label: 'Multi-parameter threshold breach' },
    ],
    auditHistory: [
      { time: '10:24:36 AM', action: 'Critical Alert Generated', actor: 'Automated Early Warning Engine' },
    ],
    recommendedAction:
      'Inspect affected monitoring zone and verify field conditions according to mine safety procedures.',
  },

  // 2. HIGH RISK (N05 - INVESTIGATING, UNRESOLVED)
  {
    id: 'MG-0041',
    timestamp: '10:18:22 AM',
    relativeTime: '6 min ago',
    duration: '24 min active',
    nodeId: 'N05',
    zone: 'Zone B',
    panel: 'Panel B',
    severity: 'HIGH_RISK',
    status: 'INVESTIGATING',
    category: 'GROUND_MOVEMENT',
    title: 'Hanging Wall Deformation Progression',
    description:
      'Sustained displacement acceleration observed (+0.38 mm/hr) along Stope 4B Hanging Wall.',
    riskScore: 72,
    riskTrend: 'Increasing',
    confidencePct: 82,
    contributingSensors: [
      {
        sensor: 'Displacement',
        parameter: 'Surface Displacement',
        hardwareDevice: 'VL53L0X Laser Proxy',
        status: 'Rapid Increase',
        currentVal: '4.1 mm',
        baselineVal: '2.8 mm',
        deviation: '+46%',
        isContributing: true,
      },
      {
        sensor: 'Tilt Angle',
        parameter: 'Angular Deviation',
        hardwareDevice: 'MPU6500 6-Axis IMU',
        status: 'Increasing',
        currentVal: '1.64°',
        baselineVal: '0.70°',
        deviation: '+134%',
        isContributing: true,
      },
      {
        sensor: 'Vibration',
        parameter: 'Dynamic Seismicity',
        hardwareDevice: 'SW-1801P Shock Sensor',
        status: 'Elevated',
        currentVal: '3.12 mm/s',
        baselineVal: '1.10 mm/s',
        deviation: '+183%',
        isContributing: true,
      },
    ],
    contributingCount: 3,
    totalSensorsCount: 5,
    spatialCorrelation: {
      nearbyNodes: ['N04', 'N05', 'N09'],
      nodeStatuses: [
        { nodeId: 'N04', zone: 'Zone B', severity: 'CRITICAL', trend: 'Primary cluster focal point' },
        { nodeId: 'N05', zone: 'Zone B', severity: 'HIGH_RISK', trend: 'Hanging wall shear' },
        { nodeId: 'N09', zone: 'Zone B', severity: 'HIGH_RISK', trend: 'Footwall propagation' },
      ],
      clusterSummary: 'Hanging wall deformation directly correlated with N04 pillar movement.',
    },
    temporalProgression: [
      { time: '10:02 AM', parameter: 'Tilt', description: 'Tilt deviation initiated' },
      { time: '10:14 AM', parameter: 'Displacement', description: 'Acceleration confirmed across 2 packets' },
    ],
    escalationHistory: [
      { time: '10:02 AM', severity: 'WARNING', label: 'Tilt advisory' },
      { time: '10:18 AM', severity: 'HIGH_RISK', label: 'Rate of change threshold exceeded' },
    ],
    auditHistory: [
      { time: '10:18:22 AM', action: 'High Risk Alert Triggered', actor: 'Automated Early Warning Engine' },
      { time: '10:20:10 AM', action: 'Alert Acknowledged', actor: 'Operator J. Sharma' },
      { time: '10:22:45 AM', action: 'Investigation Initiated', actor: 'Geotechnical Safety Team' },
    ],
    recommendedAction: 'Coordinate with shift deputy to verify rib extensometer tell-tales.',
    acknowledgedAt: '10:20 AM',
    acknowledgedBy: 'Operator J. Sharma',
    investigatingAt: '10:22 AM',
    investigatingBy: 'Geotechnical Safety Team',
  },

  // 3. HIGH RISK (N16 - ACKNOWLEDGED)
  {
    id: 'MG-0038',
    timestamp: '10:11:05 AM',
    relativeTime: '13 min ago',
    duration: '31 min active',
    nodeId: 'N16',
    zone: 'Zone D',
    panel: 'Panel D',
    severity: 'HIGH_RISK',
    status: 'ACKNOWLEDGED',
    category: 'GROUND_MOVEMENT',
    title: 'Deep Drift South Face Displacement Spike',
    description:
      'Displacement jumped to 3.9 mm following extraction activity; gas readings also elevated.',
    riskScore: 68,
    riskTrend: 'Increasing',
    confidencePct: 79,
    contributingSensors: [
      {
        sensor: 'Displacement',
        parameter: 'Surface Displacement',
        hardwareDevice: 'VL53L0X Laser Proxy',
        status: 'Rapid Increase',
        currentVal: '3.9 mm',
        baselineVal: '2.5 mm',
        deviation: '+56%',
        isContributing: true,
      },
      {
        sensor: 'Gas Level',
        parameter: 'Combustible Gas (CH₄)',
        hardwareDevice: 'MQ-2 Gas Sensor',
        status: 'Elevated',
        currentVal: '480 ppm',
        baselineVal: '120 ppm',
        deviation: '+300%',
        isContributing: true,
      },
    ],
    contributingCount: 2,
    totalSensorsCount: 5,
    spatialCorrelation: {
      nearbyNodes: ['N15', 'N16', 'N21'],
      nodeStatuses: [
        { nodeId: 'N15', zone: 'Zone D', severity: 'NORMAL', trend: 'Stable' },
        { nodeId: 'N16', zone: 'Zone D', severity: 'HIGH_RISK', trend: 'Active face movement' },
        { nodeId: 'N21', zone: 'Zone D', severity: 'HIGH_RISK', trend: 'Extraction drift displacement' },
      ],
      clusterSummary: 'Deep drift extraction corridor exhibits localized stress concentration.',
    },
    temporalProgression: [
      { time: '09:58 AM', parameter: 'Gas', description: 'Methane concentration increased past 350 ppm' },
      { time: '10:11 AM', parameter: 'Displacement', description: 'Laser distance proxy shift detected' },
    ],
    escalationHistory: [
      { time: '10:11 AM', severity: 'HIGH_RISK', label: 'Face movement threshold breach' },
    ],
    auditHistory: [
      { time: '10:11:05 AM', action: 'High Risk Alert Triggered', actor: 'Automated Early Warning Engine' },
      { time: '10:15:30 AM', action: 'Alert Acknowledged', actor: 'Operator R. Mukherjee' },
    ],
    recommendedAction: 'Verify ventilation flow and inspect face support mesh integrity.',
    acknowledgedAt: '10:15 AM',
    acknowledgedBy: 'Operator R. Mukherjee',
  },

  // 4. HIGH RISK (N09 - NEW, UNRESOLVED)
  {
    id: 'MG-0035',
    timestamp: '09:54:18 AM',
    relativeTime: '30 min ago',
    duration: '48 min active',
    nodeId: 'N09',
    zone: 'Zone B',
    panel: 'Panel B',
    severity: 'HIGH_RISK',
    status: 'NEW',
    category: 'GROUND_MOVEMENT',
    title: 'Stope 4B Footwall Shear Acceleration',
    description:
      'Continuous progressive shear deformation detected; displacement reached 3.8 mm with 2.95 mm/s vibration.',
    riskScore: 70,
    riskTrend: 'Increasing',
    confidencePct: 80,
    contributingSensors: [
      {
        sensor: 'Displacement',
        parameter: 'Surface Displacement',
        hardwareDevice: 'VL53L0X Laser Proxy',
        status: 'Rapid Increase',
        currentVal: '3.8 mm',
        baselineVal: '2.6 mm',
        deviation: '+46%',
        isContributing: true,
      },
      {
        sensor: 'Tilt Angle',
        parameter: 'Angular Deviation',
        hardwareDevice: 'MPU6500 6-Axis IMU',
        status: 'Increasing',
        currentVal: '1.52°',
        baselineVal: '0.68°',
        deviation: '+123%',
        isContributing: true,
      },
    ],
    contributingCount: 2,
    totalSensorsCount: 5,
    spatialCorrelation: {
      nearbyNodes: ['N04', 'N05', 'N09'],
      nodeStatuses: [
        { nodeId: 'N04', zone: 'Zone B', severity: 'CRITICAL', trend: 'Central pillar shear' },
        { nodeId: 'N05', zone: 'Zone B', severity: 'HIGH_RISK', trend: 'Hanging wall' },
        { nodeId: 'N09', zone: 'Zone B', severity: 'HIGH_RISK', trend: 'Footwall shear' },
      ],
      clusterSummary: 'Forms south-eastern boundary of Stope 4B deformation zone.',
    },
    temporalProgression: [
      { time: '09:40 AM', parameter: 'Tilt', description: 'Progressive footwall tilt' },
      { time: '09:54 AM', parameter: 'Displacement', description: 'Displacement vector updated' },
    ],
    escalationHistory: [
      { time: '09:54 AM', severity: 'HIGH_RISK', label: 'Multi-parameter shear correlation' },
    ],
    auditHistory: [
      { time: '09:54:18 AM', action: 'High Risk Alert Triggered', actor: 'Automated Early Warning Engine' },
    ],
    recommendedAction: 'Assess footwall rib anchors and notify geotechnical engineer.',
  },

  // 5. HIGH RISK (N21 - ACKNOWLEDGED)
  {
    id: 'MG-0032',
    timestamp: '09:42:50 AM',
    relativeTime: '42 min ago',
    duration: '59 min active',
    nodeId: 'N21',
    zone: 'Zone D',
    panel: 'Panel D',
    severity: 'HIGH_RISK',
    status: 'ACKNOWLEDGED',
    category: 'GROUND_MOVEMENT',
    title: 'Extraction Drift 2 Subsidence Indicator',
    description:
      'Displacement reached 3.5 mm and crack expansion active at 0.88 mm in deep extraction tunnel.',
    riskScore: 65,
    riskTrend: 'Increasing',
    confidencePct: 76,
    contributingSensors: [
      {
        sensor: 'Displacement',
        parameter: 'Surface Displacement',
        hardwareDevice: 'VL53L0X Laser Proxy',
        status: 'Rapid Increase',
        currentVal: '3.5 mm',
        baselineVal: '2.4 mm',
        deviation: '+45%',
        isContributing: true,
      },
      {
        sensor: 'Crack Width',
        parameter: 'Aperture Expansion',
        hardwareDevice: 'Strain Gauge / Laser',
        status: 'Expanding',
        currentVal: '0.88 mm',
        baselineVal: '0.45 mm',
        deviation: '+95%',
        isContributing: true,
      },
    ],
    contributingCount: 2,
    totalSensorsCount: 5,
    spatialCorrelation: {
      nearbyNodes: ['N16', 'N21', 'N22'],
      nodeStatuses: [
        { nodeId: 'N16', zone: 'Zone D', severity: 'HIGH_RISK', trend: 'Deep drift face' },
        { nodeId: 'N21', zone: 'Zone D', severity: 'HIGH_RISK', trend: 'Extraction drift' },
        { nodeId: 'N22', zone: 'Zone D', severity: 'NORMAL', trend: 'Regulator baseline' },
      ],
      clusterSummary: 'Correlated with active coal hauling in adjacent panel crosscuts.',
    },
    temporalProgression: [
      { time: '09:30 AM', parameter: 'Crack Width', description: 'Crack expansion detected' },
      { time: '09:42 AM', parameter: 'Displacement', description: 'Displacement rate threshold reached' },
    ],
    escalationHistory: [
      { time: '09:42 AM', severity: 'HIGH_RISK', label: 'Deformation threshold breach' },
    ],
    auditHistory: [
      { time: '09:42:50 AM', action: 'High Risk Alert Triggered', actor: 'Automated Early Warning Engine' },
      { time: '09:50:12 AM', action: 'Alert Acknowledged', actor: 'Operator J. Sharma' },
    ],
    recommendedAction: 'Visual inspection of drift timber sets and steel arches required.',
    acknowledgedAt: '09:50 AM',
    acknowledgedBy: 'Operator J. Sharma',
  },

  // 6. WARNING (N11 - ACKNOWLEDGED)
  {
    id: 'MG-0039',
    timestamp: '10:05:14 AM',
    relativeTime: '19 min ago',
    duration: '37 min active',
    nodeId: 'N11',
    zone: 'Zone C',
    panel: 'Panel C',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    category: 'GROUND_MOVEMENT',
    title: 'East Incline Gallery Crown Crack Widening',
    description:
      'Crack aperture expansion rate exceeded advisory threshold (+0.74 mm total aperture).',
    riskScore: 46,
    riskTrend: 'Increasing',
    confidencePct: 75,
    contributingSensors: [
      {
        sensor: 'Crack Width',
        parameter: 'Aperture Expansion',
        hardwareDevice: 'Strain Gauge / Laser',
        status: 'Expanding',
        currentVal: '0.74 mm',
        baselineVal: '0.45 mm',
        deviation: '+64%',
        isContributing: true,
      },
    ],
    contributingCount: 1,
    totalSensorsCount: 5,
    spatialCorrelation: {
      nearbyNodes: ['N10', 'N11', 'N17'],
      nodeStatuses: [
        { nodeId: 'N10', zone: 'Zone C', severity: 'NORMAL', trend: 'Stable' },
        { nodeId: 'N11', zone: 'Zone C', severity: 'WARNING', trend: 'Crack aperture growth' },
        { nodeId: 'N17', zone: 'Zone C', severity: 'NORMAL', trend: 'Stable' },
      ],
      clusterSummary: 'Isolated crack opening along crown geological fault joint.',
    },
    temporalProgression: [
      { time: '09:50 AM', parameter: 'Crack Width', description: 'Aperture expansion rate increased' },
    ],
    escalationHistory: [
      { time: '10:05 AM', severity: 'WARNING', label: 'Advisory crack threshold reached' },
    ],
    auditHistory: [
      { time: '10:05:14 AM', action: 'Warning Generated', actor: 'Automated Early Warning Engine' },
      { time: '10:12:00 AM', action: 'Alert Acknowledged', actor: 'Operator R. Mukherjee' },
    ],
    recommendedAction: 'Log crack width reading during scheduled afternoon inspection.',
    acknowledgedAt: '10:12 AM',
    acknowledgedBy: 'Operator R. Mukherjee',
  },

  // 7. WARNING (N20 - ACKNOWLEDGED)
  {
    id: 'MG-0037',
    timestamp: '09:58:30 AM',
    relativeTime: '26 min ago',
    duration: '44 min active',
    nodeId: 'N20',
    zone: 'Zone B',
    panel: 'Panel B',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    category: 'GROUND_MOVEMENT',
    title: 'Ore Pass 3 Chute Wall Tilt Variance',
    description:
      'Moderate angular tilt shift detected on chute wall structure (0.78° vs 0.35° baseline).',
    riskScore: 40,
    riskTrend: 'Increasing',
    confidencePct: 71,
    contributingSensors: [
      {
        sensor: 'Tilt Angle',
        parameter: 'Angular Deviation',
        hardwareDevice: 'MPU6500 6-Axis IMU',
        status: 'Increasing',
        currentVal: '0.78°',
        baselineVal: '0.35°',
        deviation: '+122%',
        isContributing: true,
      },
    ],
    contributingCount: 1,
    totalSensorsCount: 5,
    spatialCorrelation: {
      nearbyNodes: ['N08', 'N20'],
      nodeStatuses: [
        { nodeId: 'N08', zone: 'Zone B', severity: 'NORMAL', trend: 'Stable' },
        { nodeId: 'N20', zone: 'Zone B', severity: 'WARNING', trend: 'Chute wall tilt' },
      ],
      clusterSummary: 'Correlated with periodic ore dumping cycles into bin.',
    },
    temporalProgression: [
      { time: '09:45 AM', parameter: 'Tilt', description: 'Tilt deviation initiated' },
    ],
    escalationHistory: [
      { time: '09:58 AM', severity: 'WARNING', label: 'Advisory warning issued' },
    ],
    auditHistory: [
      { time: '09:58:30 AM', action: 'Warning Generated', actor: 'Automated Early Warning Engine' },
      { time: '10:04:10 AM', action: 'Alert Acknowledged', actor: 'Operator J. Sharma' },
    ],
    recommendedAction: 'Monitor chute wall deflection during next tipping batch.',
    acknowledgedAt: '10:04 AM',
    acknowledgedBy: 'Operator J. Sharma',
  },

  // 8. WARNING (N03 - NEW, UNRESOLVED)
  {
    id: 'MG-0034',
    timestamp: '09:49:15 AM',
    relativeTime: '35 min ago',
    duration: '53 min active',
    nodeId: 'N03',
    zone: 'Zone B',
    panel: 'Panel B',
    severity: 'WARNING',
    status: 'NEW',
    category: 'GROUND_MOVEMENT',
    title: 'Crosscut 3 West Rib Dynamic Vibration Spike',
    description:
      'Vibration velocity elevated to 1.84 mm/s alongside 0.94° tilt in Zone B haulage crosscut.',
    riskScore: 42,
    riskTrend: 'Increasing',
    confidencePct: 73,
    contributingSensors: [
      {
        sensor: 'Vibration',
        parameter: 'Dynamic Seismicity',
        hardwareDevice: 'SW-1801P Shock Sensor',
        status: 'Elevated',
        currentVal: '1.84 mm/s',
        baselineVal: '0.90 mm/s',
        deviation: '+104%',
        isContributing: true,
      },
    ],
    contributingCount: 1,
    totalSensorsCount: 5,
    spatialCorrelation: {
      nearbyNodes: ['N02', 'N03', 'N04'],
      nodeStatuses: [
        { nodeId: 'N02', zone: 'Zone A', severity: 'NORMAL', trend: 'Stable' },
        { nodeId: 'N03', zone: 'Zone B', severity: 'WARNING', trend: 'West rib vibration' },
        { nodeId: 'N04', zone: 'Zone B', severity: 'CRITICAL', trend: 'Stope 4B cluster' },
      ],
      clusterSummary: 'Located at western perimeter of the Zone B active deformation corridor.',
    },
    temporalProgression: [
      { time: '09:40 AM', parameter: 'Vibration', description: 'Shock pulses detected' },
    ],
    escalationHistory: [
      { time: '09:49 AM', severity: 'WARNING', label: 'Vibration velocity advisory' },
    ],
    auditHistory: [
      { time: '09:49:15 AM', action: 'Warning Generated', actor: 'Automated Early Warning Engine' },
    ],
    recommendedAction: 'Observe rib spalling during next diesel locomotive haulage pass.',
  },

  // 9. WARNING (N17 - INVESTIGATING, UNRESOLVED)
  {
    id: 'MG-0030',
    timestamp: '09:36:40 AM',
    relativeTime: '48 min ago',
    duration: '1h 6m active',
    nodeId: 'N17',
    zone: 'Zone C',
    panel: 'Panel C',
    severity: 'WARNING',
    status: 'INVESTIGATING',
    category: 'COMMUNICATION',
    title: 'Crown Pillar Monitor RF Signal Degradation',
    description:
      'LoRa packet reception delayed; RSSI dropped to -94 dBm with intermittent packet drops.',
    riskScore: 32,
    riskTrend: 'Stable',
    confidencePct: 89,
    contributingSensors: [
      {
        sensor: 'LoRa SX1278',
        parameter: 'RF Signal RSSI',
        hardwareDevice: 'SX1278 Wireless Transceiver',
        status: 'Elevated',
        currentVal: '-94 dBm',
        baselineVal: '-70 dBm',
        deviation: '-24 dBm',
        isContributing: true,
      },
    ],
    contributingCount: 1,
    totalSensorsCount: 2,
    spatialCorrelation: {
      nearbyNodes: ['N10', 'N17', 'N18'],
      nodeStatuses: [
        { nodeId: 'N10', zone: 'Zone C', severity: 'NORMAL', trend: 'Strong link' },
        { nodeId: 'N17', zone: 'Zone C', severity: 'WARNING', trend: 'Antenna obstructed' },
        { nodeId: 'N18', zone: 'Zone C', severity: 'NORMAL', trend: 'Strong link' },
      ],
      clusterSummary: 'Localized RF line-of-sight obstruction near steel ventilation curtain.',
    },
    temporalProgression: [
      { time: '09:20 AM', parameter: 'RSSI', description: 'Signal strength decreased from -72 to -94 dBm' },
    ],
    escalationHistory: [
      { time: '09:36 AM', severity: 'WARNING', label: 'Packet loss threshold advisory' },
    ],
    auditHistory: [
      { time: '09:36:40 AM', action: 'Communication Warning Triggered', actor: 'Mother System Gateway' },
      { time: '09:45:00 AM', action: 'Investigation Initiated', actor: 'Telecom / Field Technician' },
    ],
    recommendedAction: 'Inspect antenna alignment and check for metallic barrier interference.',
    investigatingAt: '09:45 AM',
    investigatingBy: 'Telecom / Field Technician',
  },

  // 10. WARNING (N08 - ACKNOWLEDGED)
  {
    id: 'MG-0028',
    timestamp: '09:25:10 AM',
    relativeTime: '59 min ago',
    duration: '1h 17m active',
    nodeId: 'N08',
    zone: 'Zone B',
    panel: 'Panel B',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    category: 'SENSOR_ANOMALY',
    title: 'Electrical Vault Transient Vibration Anomaly',
    description:
      'Isolated vibration spike detected on transformer foundation; non-structural mechanical source.',
    riskScore: 30,
    riskTrend: 'Decreasing',
    confidencePct: 78,
    contributingSensors: [
      {
        sensor: 'Vibration',
        parameter: 'Dynamic Seismicity',
        hardwareDevice: 'SW-1801P Shock Sensor',
        status: 'Elevated',
        currentVal: '1.75 mm/s',
        baselineVal: '0.50 mm/s',
        deviation: '+250%',
        isContributing: true,
      },
    ],
    contributingCount: 1,
    totalSensorsCount: 5,
    spatialCorrelation: {
      nearbyNodes: ['N07', 'N08'],
      nodeStatuses: [
        { nodeId: 'N07', zone: 'Zone B', severity: 'NORMAL', trend: 'Stable' },
        { nodeId: 'N08', zone: 'Zone B', severity: 'WARNING', trend: 'Transformer vibration' },
      ],
      clusterSummary: 'Isolated electrical substation equipment harmonic vibration.',
    },
    temporalProgression: [
      { time: '09:20 AM', parameter: 'Vibration', description: 'Transient spike during compressor startup' },
    ],
    escalationHistory: [
      { time: '09:25 AM', severity: 'WARNING', label: 'Vibration advisory' },
    ],
    auditHistory: [
      { time: '09:25:10 AM', action: 'Warning Generated', actor: 'Automated Early Warning Engine' },
      { time: '09:32:00 AM', action: 'Alert Acknowledged', actor: 'Operator J. Sharma' },
    ],
    recommendedAction: 'Verify transformer mount dampers during routine substation check.',
    acknowledgedAt: '09:32 AM',
    acknowledgedBy: 'Operator J. Sharma',
  },

  // 11. WARNING (N14 - NEW, UNRESOLVED)
  {
    id: 'MG-0025',
    timestamp: '09:12:00 AM',
    relativeTime: '1h 12m ago',
    duration: '1h 30m active',
    nodeId: 'N14',
    zone: 'Zone D',
    panel: 'Panel D',
    severity: 'WARNING',
    status: 'NEW',
    category: 'ENVIRONMENTAL',
    title: 'Drainage Crosscut 5 Strata Pore Moisture Surge',
    description:
      'Soil moisture probe recorded rapid increase to 42% following sump dewatering cycle.',
    riskScore: 34,
    riskTrend: 'Stable',
    confidencePct: 74,
    contributingSensors: [
      {
        sensor: 'Soil Moisture',
        parameter: 'Strata Pore Saturation',
        hardwareDevice: 'Resistive Soil Probe',
        status: 'Increasing',
        currentVal: '42%',
        baselineVal: '28%',
        deviation: '+50%',
        isContributing: true,
      },
    ],
    contributingCount: 1,
    totalSensorsCount: 5,
    spatialCorrelation: {
      nearbyNodes: ['N14', 'N15', 'N23'],
      nodeStatuses: [
        { nodeId: 'N14', zone: 'Zone D', severity: 'WARNING', trend: 'Moisture surge' },
        { nodeId: 'N15', zone: 'Zone D', severity: 'NORMAL', trend: 'Stable' },
        { nodeId: 'N23', zone: 'Zone E', severity: 'NORMAL', trend: 'Sump baseline' },
      ],
      clusterSummary: 'Strata seepage localized around crosscut drainage channel.',
    },
    temporalProgression: [
      { time: '08:50 AM', parameter: 'Soil Moisture', description: 'Seepage rate increased' },
    ],
    escalationHistory: [
      { time: '09:12 AM', severity: 'WARNING', label: 'Moisture variance advisory' },
    ],
    auditHistory: [
      { time: '09:12:00 AM', action: 'Environmental Warning Generated', actor: 'Automated Early Warning Engine' },
    ],
    recommendedAction: 'Check drainage ditch for rock debris buildup or culvert blockages.',
  },
];
