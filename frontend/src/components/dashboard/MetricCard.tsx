import React from 'react';
import {
  Compass,
  MoveHorizontal,
  Activity,
  Split,
  Thermometer,
  Network,
} from 'lucide-react';
import type { DashboardMetric } from '../../data/mock/dashboardTelemetry';
import './MetricCard.css';

export interface MetricCardProps {
  metric: DashboardMetric;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const getIcon = () => {
    switch (metric.iconName) {
      case 'tilt':
        return <Compass size={15} className="mg-metric-card__icon" />;
      case 'displacement':
        return <MoveHorizontal size={15} className="mg-metric-card__icon" />;
      case 'vibration':
        return <Activity size={15} className="mg-metric-card__icon" />;
      case 'crack':
        return <Split size={15} className="mg-metric-card__icon" />;
      case 'temp':
        return <Thermometer size={15} className="mg-metric-card__icon" />;
      case 'nodes':
        return <Network size={15} className="mg-metric-card__icon" />;
    }
  };

  return (
    <div className={`mg-metric-card mg-metric-card--${metric.changeType}`}>
      {/* Top Accent Stripe */}
      <div className="mg-metric-card__accent" />

      <div className="mg-metric-card__inner">
        <div className="mg-metric-card__header">
          <span className="mg-metric-card__label">{metric.label}</span>
          <span className="mg-metric-card__icon-wrap">{getIcon()}</span>
        </div>

        <div className="mg-metric-card__main">
          <span className="mg-metric-card__val mono-telemetry">{metric.value}</span>
          {metric.unit && <span className="mg-metric-card__unit">{metric.unit}</span>}
        </div>

        <div className="mg-metric-card__footer">
          <span className={`mg-metric-card__change mg-metric-card__change--${metric.changeType}`}>
            {metric.change}
          </span>
          {metric.secondaryText && (
            <span className="mg-metric-card__secondary">{metric.secondaryText}</span>
          )}
        </div>
      </div>
    </div>
  );
};
