import { MAP_NODES } from './nodes';

export type TimeRangeKey = '1H' | '6H' | '24H' | '7D' | '30D';

export type ParameterKey =
  | 'displacement'
  | 'tilt'
  | 'vibration'
  | 'crackWidth'
  | 'soilMoisture'
  | 'gas'
  | 'temperature'
  | 'distance'
  | 'pressure';

export interface ParameterConfig {
  key: ParameterKey;
  label: string;
  shortLabel: string;
  unit: string;
  decimals: number;
  hardwareSensor: string;
  defaultBaseline: number;
  normalVariance: number;
  warningThreshold: number;
  criticalThreshold: number;
  colorVar: string;
}

export const PARAMETER_CONFIGS: Record<ParameterKey, ParameterConfig> = {
  displacement: {
    key: 'displacement',
    label: 'Surface Displacement',
    shortLabel: 'Displacement',
    unit: 'mm',
    decimals: 1,
    hardwareSensor: 'VL53L0X Laser Proxy',
    defaultBaseline: 2.9,
    normalVariance: 0.4,
    warningThreshold: 3.5,
    criticalThreshold: 4.5,
    colorVar: 'var(--color-critical)',
  },
  tilt: {
    key: 'tilt',
    label: 'Tilt Angle Deviation',
    shortLabel: 'Tilt',
    unit: '°',
    decimals: 2,
    hardwareSensor: 'MPU6500 6-Axis IMU',
    defaultBaseline: 0.65,
    normalVariance: 0.15,
    warningThreshold: 1.0,
    criticalThreshold: 1.5,
    colorVar: 'var(--color-primary)',
  },
  vibration: {
    key: 'vibration',
    label: 'Dynamic Vibration Velocity',
    shortLabel: 'Vibration',
    unit: 'mm/s',
    decimals: 2,
    hardwareSensor: 'SW-1801P Shock Sensor',
    defaultBaseline: 0.95,
    normalVariance: 0.35,
    warningThreshold: 2.2,
    criticalThreshold: 3.2,
    colorVar: 'var(--color-warning)',
  },
  crackWidth: {
    key: 'crackWidth',
    label: 'Crack Aperture Width',
    shortLabel: 'Crack Width',
    unit: 'mm',
    decimals: 2,
    hardwareSensor: 'VL53L0X / Strain Gauge',
    defaultBaseline: 0.45,
    normalVariance: 0.1,
    warningThreshold: 0.8,
    criticalThreshold: 1.1,
    colorVar: 'var(--color-high-risk)',
  },
  soilMoisture: {
    key: 'soilMoisture',
    label: 'Strata Pore Moisture',
    shortLabel: 'Soil Moisture',
    unit: '%',
    decimals: 0,
    hardwareSensor: 'Resistive Moisture Probe',
    defaultBaseline: 34,
    normalVariance: 5,
    warningThreshold: 52,
    criticalThreshold: 62,
    colorVar: '#38bdf8',
  },
  gas: {
    key: 'gas',
    label: 'Combustible Gas (CH₄ / CO)',
    shortLabel: 'Gas Level',
    unit: 'ppm',
    decimals: 0,
    hardwareSensor: 'MQ-2 Gas Sensor',
    defaultBaseline: 130,
    normalVariance: 25,
    warningThreshold: 350,
    criticalThreshold: 550,
    colorVar: '#f97316',
  },
  temperature: {
    key: 'temperature',
    label: 'Gallery Ambient Temperature',
    shortLabel: 'Temperature',
    unit: '°C',
    decimals: 1,
    hardwareSensor: 'ESP32 / Digital Temp Probe',
    defaultBaseline: 23.5,
    normalVariance: 1.5,
    warningThreshold: 29.0,
    criticalThreshold: 32.0,
    colorVar: '#fbbf24',
  },
  distance: {
    key: 'distance',
    label: 'Laser Distance Proxy',
    shortLabel: 'Distance',
    unit: 'cm',
    decimals: 1,
    hardwareSensor: 'VL53L0X Time-of-Flight',
    defaultBaseline: 14.5,
    normalVariance: 0.5,
    warningThreshold: 13.0,
    criticalThreshold: 12.0,
    colorVar: '#a855f7',
  },
  pressure: {
    key: 'pressure',
    label: 'Barometric Gallery Pressure',
    shortLabel: 'Atm Pressure',
    unit: 'hPa',
    decimals: 0,
    hardwareSensor: 'Barometric Sensor',
    defaultBaseline: 1014,
    normalVariance: 2,
    warningThreshold: 1008,
    criticalThreshold: 1002,
    colorVar: '#2dd4bf',
  },
};

export interface TelemetryPoint {
  time: string;
  timestamp: string;
  value: number;
  baseline: number;
  deviation: number;
  isAnomaly: boolean;
}

export interface ParameterMetrics {
  current: number;
  baseline: number;
  delta: number;
  percentChange: number;
  rateOfChange: number; // units / hour
  acceleration: number; // units / hour^2
  accelerationStatus: 'Stable' | 'Increasing' | 'Accelerating';
  status: 'NORMAL' | 'ELEVATED' | 'ANOMALOUS';
  unit: string;
  trendDirection: 'Increasing' | 'Stable' | 'Decreasing';
}

export interface AnomalyRegion {
  startTime: string;
  endTime: string;
  description: string;
  severity: 'Warning' | 'High' | 'Critical';
}

export interface NormalizedDataSeries {
  parameter: ParameterKey;
  label: string;
  unit: string;
  color: string;
  points: { time: string; normalizedPct: number; rawValue: number }[];
}

export interface AnomalyTimelineItem {
  id: string;
  time: string;
  nodeId: string;
  parameter: string;
  event: string;
  severity: 'Info' | 'Warning' | 'High' | 'Critical';
  status: string;
}

export interface HistoricalShiftEvent {
  date: string;
  shift: string;
  event: string;
  maxDisplacement: string;
  status: 'Normal' | 'Elevated' | 'Anomalous';
}

export interface ZoneTrendSummary {
  zone: string;
  riskTrend: 'Stable' | 'Increasing' | 'Elevated';
  avgDisplacement: number;
  avgTilt: number;
  anomalyCount: number;
  status: 'Normal' | 'Elevated' | 'High Risk';
}

// 5x5 Pairwise correlation matrix coefficients
export interface CorrelationCell {
  param1: ParameterKey;
  param2: ParameterKey;
  value: number; // 0.00 to 1.00
}

export const MULTI_SENSOR_CORRELATIONS: CorrelationCell[] = [
  { param1: 'displacement', param2: 'tilt', value: 0.82 },
  { param1: 'displacement', param2: 'crackWidth', value: 0.76 },
  { param1: 'displacement', param2: 'vibration', value: 0.68 },
  { param1: 'displacement', param2: 'soilMoisture', value: 0.44 },
  { param1: 'tilt', param2: 'crackWidth', value: 0.71 },
  { param1: 'tilt', param2: 'vibration', value: 0.64 },
  { param1: 'tilt', param2: 'soilMoisture', value: 0.38 },
  { param1: 'vibration', param2: 'crackWidth', value: 0.59 },
  { param1: 'vibration', param2: 'soilMoisture', value: 0.31 },
  { param1: 'crackWidth', param2: 'soilMoisture', value: 0.48 },
];

export const ANOMALY_TIMELINE: AnomalyTimelineItem[] = [
  {
    id: 'AT-01',
    time: '10:24 AM',
    nodeId: 'N04',
    parameter: 'Displacement',
    event: 'Accelerating shear displacement (+0.21 mm/hr)',
    severity: 'Critical',
    status: 'Active Anomaly',
  },
  {
    id: 'AT-02',
    time: '10:18 AM',
    nodeId: 'N04',
    parameter: 'Vibration',
    event: 'Dynamic micro-seismic vibration burst (3.85 mm/s)',
    severity: 'High',
    status: 'Correlated',
  },
  {
    id: 'AT-03',
    time: '10:11 AM',
    nodeId: 'N04',
    parameter: 'Tilt',
    event: 'Angular rotation threshold breach (+1.82° pitch)',
    severity: 'Warning',
    status: 'Correlated',
  },
  {
    id: 'AT-04',
    time: '10:05 AM',
    nodeId: 'N04',
    parameter: 'Crack Width',
    event: 'Aperture expansion rate increase (+0.03 mm/hr)',
    severity: 'Warning',
    status: 'Observed',
  },
  {
    id: 'AT-05',
    time: '09:52 AM',
    nodeId: 'N04',
    parameter: 'Soil Moisture',
    event: 'Pore moisture elevation in surrounding strata (62%)',
    severity: 'Info',
    status: 'Background',
  },
];

export const HISTORICAL_SHIFT_EVENTS: HistoricalShiftEvent[] = [
  {
    date: 'Yesterday, Shift 3',
    shift: 'Night Shift',
    event: 'Elevated deformation trend detected in Sub-level Stope 4B',
    maxDisplacement: '4.7 mm',
    status: 'Anomalous',
  },
  {
    date: 'Yesterday, Shift 2',
    shift: 'Afternoon Shift',
    event: 'Vibration anomaly spike recorded during crosscut haulage',
    maxDisplacement: '3.4 mm',
    status: 'Elevated',
  },
  {
    date: '2 days ago',
    shift: 'Day Shift',
    event: 'Stable baseline throughout Zone B galleries',
    maxDisplacement: '2.9 mm',
    status: 'Normal',
  },
  {
    date: '3 days ago',
    shift: 'All Shifts',
    event: 'Minor tilt increase noted post-blasting round 12',
    maxDisplacement: '2.8 mm',
    status: 'Normal',
  },
];

export const ZONE_TREND_SUMMARIES: ZoneTrendSummary[] = [
  {
    zone: 'Zone A',
    riskTrend: 'Stable',
    avgDisplacement: 0.9,
    avgTilt: 0.21,
    anomalyCount: 0,
    status: 'Normal',
  },
  {
    zone: 'Zone B',
    riskTrend: 'Increasing',
    avgDisplacement: 3.2,
    avgTilt: 1.15,
    anomalyCount: 5,
    status: 'High Risk',
  },
  {
    zone: 'Zone C',
    riskTrend: 'Stable',
    avgDisplacement: 1.1,
    avgTilt: 0.32,
    anomalyCount: 1,
    status: 'Normal',
  },
  {
    zone: 'Zone D',
    riskTrend: 'Elevated',
    avgDisplacement: 2.6,
    avgTilt: 0.88,
    anomalyCount: 3,
    status: 'Elevated',
  },
  {
    zone: 'Zone E',
    riskTrend: 'Stable',
    avgDisplacement: 0.8,
    avgTilt: 0.18,
    anomalyCount: 0,
    status: 'Normal',
  },
];

/**
 * Generates tailored time-series data for a given node, parameter, and time range.
 */
export function getTelemetryTimeSeries(
  nodeId: string,
  paramKey: ParameterKey,
  timeRange: TimeRangeKey
): {
  points: TelemetryPoint[];
  metrics: ParameterMetrics;
  anomalyRegions: AnomalyRegion[];
} {
  const node = MAP_NODES.find((n) => n.id === nodeId) || MAP_NODES[3]; // default N04
  const config = PARAMETER_CONFIGS[paramKey];

  // Derive target current value from node
  let currentVal = config.defaultBaseline;
  switch (paramKey) {
    case 'displacement':
      currentVal = node.displacementMm;
      break;
    case 'tilt':
      currentVal = node.tiltDeg;
      break;
    case 'vibration':
      currentVal = node.vibrationMmS;
      break;
    case 'crackWidth':
      currentVal = node.crackWidthMm;
      break;
    case 'soilMoisture':
      currentVal = node.moisturePct;
      break;
    case 'gas':
      currentVal = node.id === 'N04' ? 680 : node.gasStatus.includes('Elevated') ? 480 : 130;
      break;
    case 'temperature':
      currentVal = node.temperatureC;
      break;
    case 'distance':
      currentVal = node.id === 'N04' ? 12.4 : Number((15 - node.displacementMm * 0.5).toFixed(1));
      break;
    case 'pressure':
      currentVal = 1012;
      break;
  }

  const baseline = config.defaultBaseline;
  const isAnomalyNode = node.id === 'N04' || node.status === 'CRITICAL' || node.status === 'HIGH_RISK';

  // Determine point counts & time labels based on range
  let count = 24;
  const timeLabels: string[] = [];
  switch (timeRange) {
    case '1H':
      count = 12; // every 5 min
      for (let i = count - 1; i >= 0; i--) {
        timeLabels.push(`${10 - Math.floor(i * 5 / 60)}:${String((60 - (i * 5) % 60) % 60).padStart(2, '0')}`);
      }
      break;
    case '6H':
      count = 18; // every 20 min
      for (let i = count - 1; i >= 0; i--) {
        const h = 10 - Math.floor(i * 20 / 60);
        const m = (60 - (i * 20) % 60) % 60;
        timeLabels.push(`${h < 0 ? h + 24 : h}:${String(m).padStart(2, '0')}`);
      }
      break;
    case '24H':
      count = 24; // hourly
      for (let i = count - 1; i >= 0; i--) {
        const h = (10 - i + 24) % 24;
        timeLabels.push(`${String(h).padStart(2, '0')}:00`);
      }
      break;
    case '7D':
      count = 14; // every 12h
      for (let i = count - 1; i >= 0; i--) {
        timeLabels.push(`D-${Math.floor(i / 2)} ${i % 2 === 0 ? 'AM' : 'PM'}`);
      }
      break;
    case '30D':
      count = 30; // daily
      for (let i = count - 1; i >= 0; i--) {
        timeLabels.push(`Day -${i}`);
      }
      break;
  }
  timeLabels[timeLabels.length - 1] = 'Current';

  const points: TelemetryPoint[] = timeLabels.map((time, idx) => {
    const progress = idx / (count - 1); // 0 at oldest, 1 at current
    let val: number;

    if (isAnomalyNode) {
      // Curve starts near baseline and accelerates upward towards currentVal
      const growth = Math.pow(progress, 2.2);
      const wave = Math.sin(idx * 0.8) * config.normalVariance * 0.3;
      val = baseline + (currentVal - baseline) * growth + wave;
    } else {
      // Stable oscillating curve around baseline
      const wave = Math.sin(idx * 0.9) * config.normalVariance * 0.4;
      val = baseline + (currentVal - baseline) * progress + wave;
    }

    val = Math.max(0, Number(val.toFixed(config.decimals)));
    if (idx === count - 1) {
      val = currentVal;
    }

    const deviation = Number((val - baseline).toFixed(config.decimals));
    const isAnomaly = val >= config.warningThreshold;

    return {
      time,
      timestamp: `2026-09-09 ${time}`,
      value: val,
      baseline,
      deviation,
      isAnomaly,
    };
  });

  // Calculate derivatives
  const delta = Number((currentVal - baseline).toFixed(config.decimals));
  const percentChange = Math.round(((currentVal - baseline) / (baseline || 1)) * 100);

  // Rate of change (units / hour)
  let rateOfChange = 0;
  let acceleration = 0;

  if (node.id === 'N04') {
    if (paramKey === 'displacement') {
      rateOfChange = 0.21;
      acceleration = 0.04;
    } else if (paramKey === 'tilt') {
      rateOfChange = 0.08;
      acceleration = 0.02;
    } else if (paramKey === 'crackWidth') {
      rateOfChange = 0.03;
      acceleration = 0.01;
    } else if (paramKey === 'vibration') {
      rateOfChange = 0.35;
      acceleration = 0.06;
    } else {
      rateOfChange = Number((delta / 12).toFixed(2));
      acceleration = 0.01;
    }
  } else {
    rateOfChange = isAnomalyNode ? Number((delta / 8).toFixed(2)) : 0.02;
    acceleration = isAnomalyNode ? 0.02 : 0.00;
  }

  const accelerationStatus: 'Stable' | 'Increasing' | 'Accelerating' =
    acceleration >= 0.03 ? 'Accelerating' : acceleration > 0 ? 'Increasing' : 'Stable';

  const status: 'NORMAL' | 'ELEVATED' | 'ANOMALOUS' =
    currentVal >= config.criticalThreshold || node.status === 'CRITICAL'
      ? 'ANOMALOUS'
      : currentVal >= config.warningThreshold || node.status === 'WARNING' || node.status === 'HIGH_RISK'
      ? 'ELEVATED'
      : 'NORMAL';

  const trendDirection: 'Increasing' | 'Stable' | 'Decreasing' =
    rateOfChange > 0.05 ? 'Increasing' : rateOfChange < -0.05 ? 'Decreasing' : 'Stable';

  const metrics: ParameterMetrics = {
    current: currentVal,
    baseline,
    delta,
    percentChange,
    rateOfChange,
    acceleration,
    accelerationStatus,
    status,
    unit: config.unit,
    trendDirection,
  };

  const anomalyRegions: AnomalyRegion[] = [];
  if (isAnomalyNode && points.length >= 6) {
    const startIndex = Math.max(0, Math.floor(points.length * 0.75));
    anomalyRegions.push({
      startTime: points[startIndex].time,
      endTime: points[points.length - 1].time,
      description: 'Progressive threshold deviation detected',
      severity: node.status === 'CRITICAL' ? 'Critical' : 'High',
    });
  }

  return { points, metrics, anomalyRegions };
}

/**
 * Returns normalized 0-100% overlay series for multi-sensor comparison.
 */
export function getNormalizedComparisonSeries(
  nodeId: string,
  timeRange: TimeRangeKey,
  selectedParams: ParameterKey[]
): NormalizedDataSeries[] {
  return selectedParams.map((key) => {
    const { points } = getTelemetryTimeSeries(nodeId, key, timeRange);
    const config = PARAMETER_CONFIGS[key];
    const baseline = config.defaultBaseline;

    const normalizedPoints = points.map((p) => {
      // Normalize deviation from baseline into a 0–100 scale
      // 0% = baseline, 100% = critical threshold
      const dev = p.value - baseline;
      const maxDev = config.criticalThreshold - baseline || 1;
      const pct = Math.min(100, Math.max(0, Math.round((dev / maxDev) * 100)));
      return {
        time: p.time,
        normalizedPct: pct,
        rawValue: p.value,
      };
    });

    return {
      parameter: key,
      label: config.shortLabel,
      unit: config.unit,
      color: config.colorVar,
      points: normalizedPoints,
    };
  });
}
