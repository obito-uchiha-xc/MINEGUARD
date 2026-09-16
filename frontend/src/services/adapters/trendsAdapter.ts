/**
 * Trends Adapter
 *
 * Maps backend telemetry history and AI anomaly records into
 * time-series data points and derived metrics for trends visualization.
 */

import type { SensorReadingResponse, AIAnomalyRecordResponse } from '../../types/api';
import type {
  ParameterKey,
  TimeRangeKey,
  TelemetryPoint,
  ParameterMetrics,
} from '../../data/mock/trendsAnalysis';
import { formatUtcTime } from '../../utils/date';

/**
 * Maps frontend parameter keys to backend sensor types.
 */
export function mapParameterKeyToSensorType(key: ParameterKey): string {
  switch (key) {
    case 'displacement':
      return 'displacement';
    case 'tilt':
      return 'tilt_pitch_deg';
    case 'vibration':
      return 'vibration_peak_mms';
    case 'crackWidth':
      return 'crack_width_mm';
    case 'soilMoisture':
      return 'soil_moisture_pct';
    case 'gas':
      return 'methane_ppm';
    case 'temperature':
      return 'temperature_c';
    case 'pressure':
      return 'pressure_hpa';
    default:
      return key;
  }
}

/**
 * Calculates start and end ISO timestamps for a given time range key.
 */
export function getTimeRangeDateBounds(range: TimeRangeKey): { from_dt: string; to_dt: string } {
  const now = new Date();
  const to_dt = now.toISOString();
  let pastMs = 24 * 3600 * 1000; // default 24H

  switch (range) {
    case '1H':
      pastMs = 1 * 3600 * 1000;
      break;
    case '6H':
      pastMs = 6 * 3600 * 1000;
      break;
    case '24H':
      pastMs = 24 * 3600 * 1000;
      break;
    case '7D':
      pastMs = 7 * 24 * 3600 * 1000;
      break;
    case '30D':
      pastMs = 30 * 24 * 3600 * 1000;
      break;
  }

  const from_dt = new Date(now.getTime() - pastMs).toISOString();
  return { from_dt, to_dt };
}

/**
 * Transforms an array of backend SensorReadingResponse records into
 * UI-compatible TelemetryPoint[] and calculates summary ParameterMetrics.
 */
export function adaptHistoryToTelemetryTimeSeries(
  readings: SensorReadingResponse[],
  unit: string,
  defaultBaseline: number,
  anomalies: AIAnomalyRecordResponse[] = []
): { points: TelemetryPoint[]; metrics: ParameterMetrics } {
  if (!readings || readings.length === 0) {
    return {
      points: [],
      metrics: {
        current: defaultBaseline,
        baseline: defaultBaseline,
        delta: 0,
        percentChange: 0,
        rateOfChange: 0,
        acceleration: 0,
        accelerationStatus: 'Stable',
        status: 'NORMAL',
        unit,
        trendDirection: 'Stable',
      },
    };
  }

  // Sort readings chronologically
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Set of timestamps or records that have anomalies
  const anomalyTimes = new Set<string>();
  for (const anom of anomalies) {
    if (anom.is_anomaly && anom.detected_at) {
      anomalyTimes.add(anom.detected_at.slice(0, 16)); // match up to minute
    }
  }

  // Calculate baseline from average or default
  const sumVal = sorted.reduce((acc, r) => acc + r.value, 0);
  const baseline = Number((sumVal / sorted.length).toFixed(2)) || defaultBaseline;

  const points: TelemetryPoint[] = sorted.map((r) => {
    const isAnom = anomalyTimes.has(r.timestamp.slice(0, 16));
    const dev = Number((r.value - baseline).toFixed(2));
    return {
      time: formatUtcTime(r.timestamp) || r.timestamp.slice(11, 16),
      timestamp: r.timestamp,
      value: Number(r.value.toFixed(2)),
      baseline,
      deviation: dev,
      isAnomaly: isAnom,
    };
  });

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const current = lastPoint.value;
  const delta = Number((current - baseline).toFixed(2));
  const percentChange = baseline !== 0 ? Number(((delta / baseline) * 100).toFixed(1)) : 0;

  // Approximate rate of change per hour
  const timeSpanHours = Math.max(
    0.1,
    (new Date(lastPoint.timestamp).getTime() - new Date(firstPoint.timestamp).getTime()) /
      (3600 * 1000)
  );
  const rateOfChange = Number(((lastPoint.value - firstPoint.value) / timeSpanHours).toFixed(3));
  const acceleration = Number((rateOfChange / timeSpanHours).toFixed(3));

  const accelerationStatus: 'Stable' | 'Increasing' | 'Accelerating' =
    Math.abs(rateOfChange) > 1.0 ? 'Accelerating' : Math.abs(rateOfChange) > 0.2 ? 'Increasing' : 'Stable';

  const status: 'NORMAL' | 'ELEVATED' | 'ANOMALOUS' =
    points.some((p) => p.isAnomaly) || Math.abs(delta) > 2.0
      ? 'ANOMALOUS'
      : Math.abs(delta) > 0.8
      ? 'ELEVATED'
      : 'NORMAL';

  const trendDirection: 'Increasing' | 'Stable' | 'Decreasing' =
    delta > 0.05 ? 'Increasing' : delta < -0.05 ? 'Decreasing' : 'Stable';

  return {
    points,
    metrics: {
      current,
      baseline,
      delta,
      percentChange,
      rateOfChange,
      acceleration,
      accelerationStatus,
      status,
      unit,
      trendDirection,
    },
  };
}
