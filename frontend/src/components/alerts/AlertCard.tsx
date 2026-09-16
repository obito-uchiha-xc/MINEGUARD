import React from 'react';
import {
  AlertOctagon,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Check,
} from 'lucide-react';
import type { MineAlert, AlertSeverityLevel, AlertOperationalStatus } from '../../data/mock/alertsCenter';
import { Button } from '../ui/Button';
import './AlertCard.css';

export interface AlertCardProps {
  alert: MineAlert;
  isSelected: boolean;
  onSelectAlert: (alert: MineAlert) => void;
  onQuickAcknowledge: (alertId: string, e: React.MouseEvent) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  isSelected,
  onSelectAlert,
  onQuickAcknowledge,
}) => {
  const renderSeverityBadge = (sev: AlertSeverityLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="mg-alert-card__sev-badge mg-alert-card__sev-badge--critical">
            <AlertOctagon size={13} aria-hidden="true" />
            <span>CRITICAL</span>
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="mg-alert-card__sev-badge mg-alert-card__sev-badge--high-risk">
            <Flame size={13} aria-hidden="true" />
            <span>HIGH RISK</span>
          </span>
        );
      case 'WARNING':
      default:
        return (
          <span className="mg-alert-card__sev-badge mg-alert-card__sev-badge--warning">
            <AlertTriangle size={13} aria-hidden="true" />
            <span>WARNING</span>
          </span>
        );
    }
  };

  const renderStatusPill = (status: AlertOperationalStatus) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="mg-alert-card__status-pill mg-alert-card__status-pill--new">
            <span className="dot dot--pulse" />
            <span>New</span>
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="mg-alert-card__status-pill mg-alert-card__status-pill--acknowledged">
            <Check size={12} />
            <span>Acknowledged</span>
          </span>
        );
      case 'INVESTIGATING':
        return (
          <span className="mg-alert-card__status-pill mg-alert-card__status-pill--investigating">
            <Clock size={12} />
            <span>Investigating</span>
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="mg-alert-card__status-pill mg-alert-card__status-pill--resolved">
            <CheckCircle2 size={12} />
            <span>Resolved</span>
          </span>
        );
    }
  };

  const isResolved = alert.status === 'RESOLVED';

  return (
    <div
      className={`mg-alert-card mg-alert-card--${alert.severity.toLowerCase().replace('_', '-')} ${
        isSelected ? 'is-selected' : ''
      } ${isResolved ? 'is-resolved' : ''}`}
      onClick={() => onSelectAlert(alert)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectAlert(alert);
        }
      }}
      aria-label={`Alert ${alert.id} on node ${alert.nodeId}, severity ${alert.severity}, status ${alert.status}`}
    >
      {/* CARD TOP ROW */}
      <div className="mg-alert-card__top">
        <div className="mg-alert-card__tags">
          {renderSeverityBadge(alert.severity)}
          <span className="mg-alert-card__node-zone mono-telemetry">
            {alert.nodeId} · {alert.zone}
          </span>
          <span className="mg-alert-card__category">
            {alert.category.replace('_', ' ')}
          </span>
        </div>

        <div className="mg-alert-card__meta">
          <span className="mg-alert-card__time mono-telemetry" title={alert.timestamp}>
            {alert.relativeTime}
          </span>
          {renderStatusPill(alert.status)}
        </div>
      </div>

      {/* CARD TITLE & DESCRIPTION */}
      <div className="mg-alert-card__body">
        <h4 className="mg-alert-card__title">{alert.title}</h4>
        <p className="mg-alert-card__desc">{alert.description}</p>

        {/* Contributing sensor bullet chips */}
        {alert.contributingSensors && alert.contributingSensors.length > 0 && (
          <div className="mg-alert-card__sensors">
            {alert.contributingSensors
              .filter((s) => s.isContributing)
              .map((s, idx) => (
                <span key={idx} className="sensor-chip">
                  {s.sensor} ({s.deviation})
                </span>
              ))}
            <span className="sensor-count-tag mono-telemetry">
              {alert.contributingCount} / {alert.totalSensorsCount} sensors contributing
            </span>
          </div>
        )}
      </div>

      {/* CARD FOOTER: RISK SCORE & ACTIONS */}
      <div className="mg-alert-card__footer">
        <div className="mg-alert-card__risk-group">
          <span className="label">Risk Score:</span>
          <span className="score mono-telemetry font-bold">{alert.riskScore}</span>
          <span className="score-denom">/ 100</span>
          <span className="trend mono-telemetry">({alert.riskTrend})</span>
        </div>

        <div className="mg-alert-card__actions">
          {alert.status === 'NEW' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Check size={13} />}
              onClick={(e) => onQuickAcknowledge(alert.id, e)}
              className="btn-ack"
            >
              Acknowledge
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ChevronRight size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onSelectAlert(alert);
            }}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};
