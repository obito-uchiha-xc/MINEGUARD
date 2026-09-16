import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  AlertOctagon,
  WifiOff,
  BatteryCharging,
  BatteryMedium,
  BatteryLow,
  ChevronRight,
} from 'lucide-react';
import type { MapNode } from '../../data/mock/nodes';
import type { SafetyStatus } from '../../types/safety';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import './NodeMobileCard.css';

export interface NodeMobileCardProps {
  node: MapNode;
  isSelected: boolean;
  onSelectNode: (node: MapNode) => void;
}

export const NodeMobileCard: React.FC<NodeMobileCardProps> = ({
  node,
  isSelected,
  onSelectNode,
}) => {
  const zoneCode = node.zone.replace('Zone ', '');
  const panelCode = node.panel.replace('Panel ', '');

  const renderStatusBadge = (status: SafetyStatus, isOnline: boolean) => {
    if (!isOnline || status === 'OFFLINE') {
      return (
        <span className="mg-mobile-card__status mg-mobile-card__status--offline">
          <WifiOff size={12} aria-hidden="true" />
          <span>Offline</span>
        </span>
      );
    }
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="mg-mobile-card__status mg-mobile-card__status--critical">
            <AlertOctagon size={12} aria-hidden="true" />
            <span>Critical</span>
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="mg-mobile-card__status mg-mobile-card__status--high-risk">
            <Flame size={12} aria-hidden="true" />
            <span>High Risk</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="mg-mobile-card__status mg-mobile-card__status--warning">
            <AlertTriangle size={12} aria-hidden="true" />
            <span>Warning</span>
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="mg-mobile-card__status mg-mobile-card__status--normal">
            <ShieldCheck size={12} aria-hidden="true" />
            <span>Normal</span>
          </span>
        );
    }
  };

  const renderBattery = (pct: number, isOnline: boolean) => {
    if (!isOnline || pct <= 0) return <span className="text-tertiary mono-telemetry">—</span>;
    const icon =
      pct > 70 ? (
        <BatteryCharging size={13} className="text-normal" />
      ) : pct > 30 ? (
        <BatteryMedium size={13} className="text-warning" />
      ) : (
        <BatteryLow size={13} className="text-critical" />
      );

    return (
      <div className="mg-mobile-card__battery mono-telemetry">
        {icon}
        <span>{pct}%</span>
      </div>
    );
  };

  let riskVariant: 'normal' | 'warning' | 'high_risk' | 'critical' = 'normal';
  if (node.aiRiskScore >= 80 || node.status === 'CRITICAL') riskVariant = 'critical';
  else if (node.aiRiskScore >= 60 || node.status === 'HIGH_RISK') riskVariant = 'high_risk';
  else if (node.aiRiskScore >= 30 || node.status === 'WARNING') riskVariant = 'warning';

  return (
    <div
      className={`mg-mobile-card ${isSelected ? 'is-selected' : ''} ${
        !node.isOnline ? 'is-offline' : ''
      }`}
      onClick={() => onSelectNode(node)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectNode(node);
        }
      }}
      aria-label={`Node ${node.id}, Risk ${node.aiRiskScore}, status ${node.status}`}
    >
      <div className="mg-mobile-card__header">
        <div className="mg-mobile-card__title-row">
          <span className="mg-mobile-card__id mono-telemetry">{node.id}</span>
          <span className="mg-mobile-card__zone mono-telemetry">
            Zone {zoneCode}{panelCode}
          </span>
        </div>
        <div className="mg-mobile-card__badges">
          {renderStatusBadge(node.status, node.isOnline)}
        </div>
      </div>

      <div className="mg-mobile-card__name">{node.name}</div>

      <div className="mg-mobile-card__grid">
        <div className="mg-mobile-card__metric">
          <span className="mg-mobile-card__label">Risk Score</span>
          <div className="mg-mobile-card__risk-val">
            <span className="mg-mobile-card__val mono-telemetry">{node.isOnline ? node.aiRiskScore : '—'}</span>
            {node.isOnline && (
              <Badge variant={riskVariant}>
                {node.status === 'CRITICAL' ? 'Critical' : node.status === 'HIGH_RISK' ? 'High' : node.status === 'WARNING' ? 'Elevated' : 'Normal'}
              </Badge>
            )}
          </div>
        </div>

        <div className="mg-mobile-card__metric">
          <span className="mg-mobile-card__label">Tilt</span>
          <span className="mg-mobile-card__val mono-telemetry">
            {node.isOnline && node.hasReadings !== false ? `${node.tiltDeg.toFixed(2)}°` : '—'}
          </span>
        </div>

        <div className="mg-mobile-card__metric">
          <span className="mg-mobile-card__label">Displacement</span>
          <span
            className={`mg-mobile-card__val mono-telemetry ${
              node.displacementMm >= 3.0 ? 'text-critical font-semibold' : ''
            }`}
          >
            {node.isOnline && node.hasReadings !== false ? `${node.displacementMm.toFixed(1)} mm` : '—'}
          </span>
        </div>

        <div className="mg-mobile-card__metric">
          <span className="mg-mobile-card__label">Battery</span>
          {renderBattery(node.batteryPct, node.isOnline)}
        </div>
      </div>

      <div className="mg-mobile-card__footer">
        <span className="mg-mobile-card__updated mono-telemetry">
          {node.lastUpdated}
        </span>
        <Button
          variant="secondary"
          size="sm"
          rightIcon={<ChevronRight size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onSelectNode(node);
          }}
        >
          View Details
        </Button>
      </div>
    </div>
  );
};
