import React from 'react';
import { AlertOctagon, Flame, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { MineAlert } from '../../data/mock/alertsCenter';
import './AlertSummaryCards.css';

export interface AlertSummaryCardsProps {
  alerts: MineAlert[];
  activeFilter: string;
  onSelectFilter: (filterKey: string) => void;
}

export const AlertSummaryCards: React.FC<AlertSummaryCardsProps> = ({
  alerts,
  activeFilter,
  onSelectFilter,
}) => {
  // Dynamically compute exact counts from alerts dataset
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highRiskCount = alerts.filter((a) => a.severity === 'HIGH_RISK').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;
  const unresolvedCount = alerts.filter((a) => a.status === 'NEW' || a.status === 'INVESTIGATING').length;

  const cards = [
    {
      id: 'SEV_CRITICAL',
      title: 'Critical',
      count: criticalCount,
      subtext: 'Immediate action required',
      icon: <AlertOctagon size={18} />,
      colorClass: 'critical',
    },
    {
      id: 'SEV_HIGH_RISK',
      title: 'High Risk',
      count: highRiskCount,
      subtext: 'Multiple abnormal vectors',
      icon: <Flame size={18} />,
      colorClass: 'high-risk',
    },
    {
      id: 'SEV_WARNING',
      title: 'Warning',
      count: warningCount,
      subtext: 'Advisory threshold variance',
      icon: <AlertTriangle size={18} />,
      colorClass: 'warning',
    },
    {
      id: 'STATUS_ACKNOWLEDGED',
      title: 'Acknowledged',
      count: acknowledgedCount,
      subtext: 'Operator verified',
      icon: <CheckCircle2 size={18} />,
      colorClass: 'acknowledged',
    },
    {
      id: 'STATUS_UNRESOLVED',
      title: 'Unresolved',
      count: unresolvedCount,
      subtext: 'Active / in investigation',
      icon: <Clock size={18} />,
      colorClass: 'unresolved',
    },
  ];

  return (
    <div className="mg-alert-summary-cards" role="region" aria-label="Alerts Fleet Summary">
      {cards.map((c) => {
        const isSelected = activeFilter === c.id;
        return (
          <button
            key={c.id}
            type="button"
            className={`mg-alert-summary-card mg-alert-summary-card--${c.colorClass} ${
              isSelected ? 'is-selected' : ''
            }`}
            onClick={() => onSelectFilter(isSelected ? 'ALL' : c.id)}
            aria-pressed={isSelected}
            aria-label={`${c.title}: ${c.count} alerts. Click to filter.`}
          >
            <div className="mg-alert-summary-card__header">
              <span className="mg-alert-summary-card__title">{c.title}</span>
              <span className="mg-alert-summary-card__icon">{c.icon}</span>
            </div>
            <div className="mg-alert-summary-card__body">
              <span className="mg-alert-summary-card__value mono-telemetry">
                {c.count}
              </span>
              <span className="mg-alert-summary-card__subtext">{c.subtext}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
