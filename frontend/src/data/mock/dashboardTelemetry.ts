export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  change: string;
  changeType: 'increase-risk' | 'moderate-risk' | 'neutral' | 'good';
  secondaryText?: string;
  iconName: 'tilt' | 'displacement' | 'vibration' | 'crack' | 'temp' | 'nodes';
}

export interface MineRiskSummary {
  status: 'NORMAL' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';
  score: number; // 0 - 100
  trend: 'Increasing' | 'Stable' | 'Decreasing';
  trendRate: string;
  confidence: number;
  primaryIndicators: string[];
  sparkline24h: number[];
}

export const DASHBOARD_METRICS: DashboardMetric[] = [
  {
    id: 'tilt',
    label: 'Avg Tilt',
    value: '1.24',
    unit: '°',
    change: '↑ 0.18° (24h)',
    changeType: 'increase-risk',
    iconName: 'tilt',
  },
  {
    id: 'displacement',
    label: 'Avg Displacement',
    value: '3.8',
    unit: 'mm',
    change: '↑ 0.7 mm (24h)',
    changeType: 'increase-risk',
    iconName: 'displacement',
  },
  {
    id: 'vibration',
    label: 'Avg Vibration',
    value: '2.35',
    unit: 'mm/s',
    change: '↗ 0.32 mm/s (24h)',
    changeType: 'moderate-risk',
    iconName: 'vibration',
  },
  {
    id: 'crack',
    label: 'Avg Crack Width',
    value: '0.8',
    unit: 'mm',
    change: '↑ 0.12 mm (24h)',
    changeType: 'increase-risk',
    iconName: 'crack',
  },
  {
    id: 'temperature',
    label: 'Temperature',
    value: '31.2',
    unit: '°C',
    change: '↑ 1.3 °C (24h)',
    changeType: 'neutral',
    iconName: 'temp',
  },
  {
    id: 'nodes',
    label: 'Active Nodes',
    value: '24 / 25',
    change: '96% Online',
    changeType: 'good',
    secondaryText: '1 Offline',
    iconName: 'nodes',
  },
];

export const MINE_RISK_SUMMARY: MineRiskSummary = {
  status: 'HIGH_RISK',
  score: 78,
  trend: 'Increasing',
  trendRate: '+14% in 24h',
  confidence: 0.94,
  primaryIndicators: [
    'Increasing displacement velocity detected in Sector B (Stope 4B)',
    'Abnormal high-frequency vibration levels recorded across 3 contiguous nodes',
    'Angular tilt rate acceleration exceeding baseline by 0.24°/hr',
    'Progressive crack aperture widening in Crown Gallery',
    'Soil moisture elevation (62%) indicating increased pore water stress',
  ],
  sparkline24h: [42, 44, 45, 48, 52, 55, 59, 62, 64, 68, 71, 74, 76, 78],
};
