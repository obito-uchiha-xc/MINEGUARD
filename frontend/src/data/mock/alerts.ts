import type { AlertSeverity } from '../../types/safety';

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  target: string;
  nodeId?: string;
  description: string;
  timestamp: string;
  isAcknowledged: boolean;
}

export const RECENT_ALERTS: DashboardAlert[] = [
  {
    id: 'ALT-01',
    severity: 'critical',
    target: 'Node N04',
    nodeId: 'N04',
    description: 'Abnormal displacement rate detected (+0.95 mm/hr). Exceeds emergency threshold.',
    timestamp: '10:23 AM',
    isAcknowledged: false,
  },
  {
    id: 'ALT-02',
    severity: 'high_risk',
    target: 'Zone B2',
    nodeId: 'N05',
    description: 'Vibration + tilt anomaly detected. Cross-parameter multi-sensor correlation active.',
    timestamp: '10:18 AM',
    isAcknowledged: false,
  },
  {
    id: 'ALT-03',
    severity: 'high_risk',
    target: 'Node N16',
    nodeId: 'N16',
    description: 'Rapid displacement increase (+0.42 mm in 30 min) in Deep Drift South Face.',
    timestamp: '10:11 AM',
    isAcknowledged: false,
  },
  {
    id: 'ALT-04',
    severity: 'warning',
    target: 'Node N11',
    nodeId: 'N11',
    description: 'Crack width increasing continuously over 4h window (+0.32 mm).',
    timestamp: '10:05 AM',
    isAcknowledged: false,
  },
  {
    id: 'ALT-05',
    severity: 'warning',
    target: 'Node N20',
    nodeId: 'N20',
    description: 'Tilt rate deviation observed in Ore Pass 3 Chute Wall.',
    timestamp: '09:58 AM',
    isAcknowledged: false,
  },
];
