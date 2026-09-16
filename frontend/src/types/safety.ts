/**
 * MINEGUARD Safety & Operational Status Types
 * Used across status badges, indicators, alert banners, and telemetry.
 */

export type SafetyStatus =
  | 'NORMAL'
  | 'WARNING'
  | 'HIGH_RISK'
  | 'CRITICAL'
  | 'OFFLINE'
  | 'LIVE'
  | 'DELAYED';

export type AlertSeverity = 'info' | 'warning' | 'high_risk' | 'critical';

export interface SafetyStatusMeta {
  status: SafetyStatus;
  label: string;
  shortLabel: string;
  description: string;
  colorVar: string;
  bgVar: string;
  borderVar: string;
}

export const SAFETY_STATUS_CONFIG: Record<SafetyStatus, SafetyStatusMeta> = {
  NORMAL: {
    status: 'NORMAL',
    label: 'Normal Operating Baseline',
    shortLabel: 'Normal',
    description: 'Deformation and gas parameters are within normal variance thresholds.',
    colorVar: 'var(--color-normal)',
    bgVar: 'var(--color-normal-muted)',
    borderVar: 'var(--color-normal-border)',
  },
  WARNING: {
    status: 'WARNING',
    label: 'Advisory Warning',
    shortLabel: 'Warning',
    description: 'Minor acceleration or single-parameter threshold deviation observed.',
    colorVar: 'var(--color-warning)',
    bgVar: 'var(--color-warning-muted)',
    borderVar: 'var(--color-warning-border)',
  },
  HIGH_RISK: {
    status: 'HIGH_RISK',
    label: 'Elevated Ground Instability Risk',
    shortLabel: 'High Risk',
    description: 'Multi-parameter correlation detected indicating progressive instability.',
    colorVar: 'var(--color-high-risk)',
    bgVar: 'var(--color-high-risk-muted)',
    borderVar: 'var(--color-high-risk-border)',
  },
  CRITICAL: {
    status: 'CRITICAL',
    label: 'Critical Instability Alarm',
    shortLabel: 'Critical',
    description: 'Critical threshold breach or accelerating shear movement detected.',
    colorVar: 'var(--color-critical)',
    bgVar: 'var(--color-critical-muted)',
    borderVar: 'var(--color-critical-border)',
  },
  OFFLINE: {
    status: 'OFFLINE',
    label: 'Telemetry Offline',
    shortLabel: 'Offline',
    description: 'Node link inactive or packet heartbeat threshold exceeded.',
    colorVar: 'var(--color-offline)',
    bgVar: 'var(--color-offline-muted)',
    borderVar: 'var(--color-offline-border)',
  },
  LIVE: {
    status: 'LIVE',
    label: 'Live LoRa Telemetry Link',
    shortLabel: 'Live',
    description: 'Active real-time communication packet stream received.',
    colorVar: 'var(--color-info)',
    bgVar: 'var(--color-info-muted)',
    borderVar: 'var(--color-info-border)',
  },
  DELAYED: {
    status: 'DELAYED',
    label: 'Uplink Delayed',
    shortLabel: 'Delayed',
    description: 'Packet arrival interval exceeded nominal schedule.',
    colorVar: 'var(--color-warning)',
    bgVar: 'var(--color-warning-muted)',
    borderVar: 'var(--color-warning-border)',
  },
};
