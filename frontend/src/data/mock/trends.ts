export type TimeFilter = '1H' | '6H' | '24H' | '7D' | '30D';

export interface TrendDataPoint {
  time: string;
  value: number;
}

export interface NodeTrendsMap {
  tilt: TrendDataPoint[];
  displacement: TrendDataPoint[];
  vibration: TrendDataPoint[];
  crackWidth: TrendDataPoint[];
}

export interface RiskDayPoint {
  date: string;
  score: number;
  status: 'NORMAL' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';
}

export const NODE_N04_TRENDS: Record<TimeFilter, NodeTrendsMap> = {
  '1H': {
    tilt: [
      { time: '09:30', value: 1.74 },
      { time: '09:40', value: 1.75 },
      { time: '09:50', value: 1.77 },
      { time: '10:00', value: 1.79 },
      { time: '10:10', value: 1.80 },
      { time: '10:20', value: 1.82 },
    ],
    displacement: [
      { time: '09:30', value: 4.52 },
      { time: '09:40', value: 4.56 },
      { time: '09:50', value: 4.61 },
      { time: '10:00', value: 4.65 },
      { time: '10:10', value: 4.68 },
      { time: '10:20', value: 4.70 },
    ],
    vibration: [
      { time: '09:30', value: 2.9 },
      { time: '09:40', value: 3.4 },
      { time: '09:50', value: 3.1 },
      { time: '10:00', value: 4.2 },
      { time: '10:10', value: 3.6 },
      { time: '10:20', value: 3.85 },
    ],
    crackWidth: [
      { time: '09:30', value: 1.14 },
      { time: '09:40', value: 1.15 },
      { time: '09:50', value: 1.17 },
      { time: '10:00', value: 1.18 },
      { time: '10:10', value: 1.19 },
      { time: '10:20', value: 1.20 },
    ],
  },
  '6H': {
    tilt: [
      { time: '04:00', value: 1.48 },
      { time: '05:00', value: 1.52 },
      { time: '06:00', value: 1.58 },
      { time: '07:00', value: 1.63 },
      { time: '08:00', value: 1.69 },
      { time: '09:00', value: 1.75 },
      { time: '10:00', value: 1.82 },
    ],
    displacement: [
      { time: '04:00', value: 4.15 },
      { time: '05:00', value: 4.22 },
      { time: '06:00', value: 4.34 },
      { time: '07:00', value: 4.41 },
      { time: '08:00', value: 4.52 },
      { time: '09:00', value: 4.62 },
      { time: '10:00', value: 4.70 },
    ],
    vibration: [
      { time: '04:00', value: 1.8 },
      { time: '05:00', value: 2.1 },
      { time: '06:00', value: 2.4 },
      { time: '07:00', value: 3.1 },
      { time: '08:00', value: 2.8 },
      { time: '09:00', value: 3.5 },
      { time: '10:00', value: 3.85 },
    ],
    crackWidth: [
      { time: '04:00', value: 1.02 },
      { time: '05:00', value: 1.05 },
      { time: '06:00', value: 1.08 },
      { time: '07:00', value: 1.11 },
      { time: '08:00', value: 1.14 },
      { time: '09:00', value: 1.17 },
      { time: '10:00', value: 1.20 },
    ],
  },
  '24H': {
    tilt: [
      { time: '10:00', value: 0.8 },
      { time: '12:00', value: 0.9 },
      { time: '14:00', value: 0.85 },
      { time: '16:00', value: 1.0 },
      { time: '18:00', value: 1.1 },
      { time: '20:00', value: 1.05 },
      { time: '22:00', value: 1.2 },
      { time: '00:00', value: 1.3 },
      { time: '02:00', value: 1.4 },
      { time: '04:00', value: 1.55 },
      { time: '06:00', value: 1.7 },
      { time: '10:00', value: 1.82 },
    ],
    displacement: [
      { time: '10:00', value: 2.1 },
      { time: '12:00', value: 2.3 },
      { time: '14:00', value: 2.25 },
      { time: '16:00', value: 2.6 },
      { time: '18:00', value: 2.9 },
      { time: '20:00', value: 3.1 },
      { time: '22:00', value: 3.3 },
      { time: '00:00', value: 3.6 },
      { time: '02:00', value: 3.9 },
      { time: '04:00', value: 4.15 },
      { time: '06:00', value: 4.45 },
      { time: '10:00', value: 4.7 },
    ],
    vibration: [
      { time: '10:00', value: 1.1 },
      { time: '12:00', value: 1.4 },
      { time: '14:00', value: 1.2 },
      { time: '16:00', value: 1.6 },
      { time: '18:00', value: 1.9 },
      { time: '20:00', value: 1.5 },
      { time: '22:00', value: 2.2 },
      { time: '00:00', value: 2.6 },
      { time: '02:00', value: 2.4 },
      { time: '04:00', value: 3.1 },
      { time: '06:00', value: 3.6 },
      { time: '10:00', value: 3.85 },
    ],
    crackWidth: [
      { time: '10:00', value: 0.5 },
      { time: '12:00', value: 0.55 },
      { time: '14:00', value: 0.58 },
      { time: '16:00', value: 0.65 },
      { time: '18:00', value: 0.72 },
      { time: '20:00', value: 0.76 },
      { time: '22:00', value: 0.84 },
      { time: '00:00', value: 0.92 },
      { time: '02:00', value: 0.98 },
      { time: '04:00', value: 1.05 },
      { time: '06:00', value: 1.12 },
      { time: '10:00', value: 1.2 },
    ],
  },
  '7D': {
    tilt: [
      { time: 'Day 1', value: 0.4 },
      { time: 'Day 2', value: 0.55 },
      { time: 'Day 3', value: 0.72 },
      { time: 'Day 4', value: 0.95 },
      { time: 'Day 5', value: 1.25 },
      { time: 'Day 6', value: 1.55 },
      { time: 'Day 7', value: 1.82 },
    ],
    displacement: [
      { time: 'Day 1', value: 1.2 },
      { time: 'Day 2', value: 1.6 },
      { time: 'Day 3', value: 2.1 },
      { time: 'Day 4', value: 2.7 },
      { time: 'Day 5', value: 3.3 },
      { time: 'Day 6', value: 4.0 },
      { time: 'Day 7', value: 4.7 },
    ],
    vibration: [
      { time: 'Day 1', value: 0.8 },
      { time: 'Day 2', value: 1.1 },
      { time: 'Day 3', value: 1.4 },
      { time: 'Day 4', value: 1.9 },
      { time: 'Day 5', value: 2.5 },
      { time: 'Day 6', value: 3.2 },
      { time: 'Day 7', value: 3.85 },
    ],
    crackWidth: [
      { time: 'Day 1', value: 0.25 },
      { time: 'Day 2', value: 0.38 },
      { time: 'Day 3', value: 0.52 },
      { time: 'Day 4', value: 0.68 },
      { time: 'Day 5', value: 0.85 },
      { time: 'Day 6', value: 1.02 },
      { time: 'Day 7', value: 1.2 },
    ],
  },
  '30D': {
    tilt: [
      { time: 'W1', value: 0.2 },
      { time: 'W2', value: 0.45 },
      { time: 'W3', value: 0.95 },
      { time: 'W4', value: 1.82 },
    ],
    displacement: [
      { time: 'W1', value: 0.6 },
      { time: 'W2', value: 1.4 },
      { time: 'W3', value: 2.8 },
      { time: 'W4', value: 4.7 },
    ],
    vibration: [
      { time: 'W1', value: 0.5 },
      { time: 'W2', value: 1.1 },
      { time: 'W3', value: 2.2 },
      { time: 'W4', value: 3.85 },
    ],
    crackWidth: [
      { time: 'W1', value: 0.1 },
      { time: 'W2', value: 0.35 },
      { time: 'W3', value: 0.7 },
      { time: 'W4', value: 1.2 },
    ],
  },
};

export const RISK_SCORE_7D: RiskDayPoint[] = [
  { date: '18 May', score: 34, status: 'WARNING' },
  { date: '19 May', score: 42, status: 'WARNING' },
  { date: '20 May', score: 51, status: 'HIGH_RISK' },
  { date: '21 May', score: 60, status: 'HIGH_RISK' },
  { date: '22 May', score: 68, status: 'HIGH_RISK' },
  { date: '23 May', score: 75, status: 'CRITICAL' },
  { date: '24 May', score: 78, status: 'CRITICAL' },
];
