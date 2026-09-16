import React from 'react';
import {
  Activity,
  History,
  Zap,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import type { ParameterMetrics } from '../../data/mock/trendsAnalysis';
import './TrendsSummaryCards.css';

export interface TrendsSummaryCardsProps {
  metrics: ParameterMetrics;
  paramLabel?: string;
}

export const TrendsSummaryCards: React.FC<TrendsSummaryCardsProps> = ({
  metrics,
  paramLabel: _paramLabel,
}) => {
  const isPositive = metrics.delta > 0;
  const isNeutral = metrics.delta === 0;

  const renderStatusCard = () => {
    let statusClass = 'normal';
    let icon = <CheckCircle2 size={20} />;
    let desc = 'Operating within baseline bounds';

    if (metrics.status === 'ANOMALOUS') {
      statusClass = 'anomalous';
      icon = <AlertOctagon size={20} />;
      desc = 'Accelerating threshold deviation';
    } else if (metrics.status === 'ELEVATED') {
      statusClass = 'elevated';
      icon = <AlertTriangle size={20} />;
      desc = 'Elevated variance above baseline';
    }

    return (
      <div className={`mg-trend-summary-card mg-trend-summary-card--status mg-trend-summary-card--${statusClass}`}>
        <div className="mg-trend-summary-card__header">
          <span className="mg-trend-summary-card__title">Status</span>
          <span className="mg-trend-summary-card__icon">{icon}</span>
        </div>
        <div className="mg-trend-summary-card__body">
          <span className="mg-trend-summary-card__value mono-telemetry">
            {metrics.status}
          </span>
          <span className="mg-trend-summary-card__subtext">{desc}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="mg-trends-summary-grid" role="region" aria-label="Telemetry Parameter Analytics">
      {/* 1. CURRENT VALUE */}
      <div className="mg-trend-summary-card">
        <div className="mg-trend-summary-card__header">
          <span className="mg-trend-summary-card__title">Current Value</span>
          <span className="mg-trend-summary-card__icon text-primary">
            <Activity size={18} />
          </span>
        </div>
        <div className="mg-trend-summary-card__body">
          <div className="mg-trend-summary-card__val-row">
            <span className="mg-trend-summary-card__value mono-telemetry">
              {metrics.current}
            </span>
            <span className="mg-trend-summary-card__unit">{metrics.unit}</span>
          </div>
          <span className="mg-trend-summary-card__subtext">
            Latest probe transmission
          </span>
        </div>
      </div>

      {/* 2. BASELINE */}
      <div className="mg-trend-summary-card">
        <div className="mg-trend-summary-card__header">
          <span className="mg-trend-summary-card__title">Baseline</span>
          <span className="mg-trend-summary-card__icon text-tertiary">
            <History size={18} />
          </span>
        </div>
        <div className="mg-trend-summary-card__body">
          <div className="mg-trend-summary-card__val-row">
            <span className="mg-trend-summary-card__value mono-telemetry">
              {metrics.baseline}
            </span>
            <span className="mg-trend-summary-card__unit">{metrics.unit}</span>
          </div>
          <span className="mg-trend-summary-card__subtext">
            Geotechnical historical datum
          </span>
        </div>
      </div>

      {/* 3. CHANGE */}
      <div className="mg-trend-summary-card">
        <div className="mg-trend-summary-card__header">
          <span className="mg-trend-summary-card__title">Change</span>
          <span className={`mg-trend-summary-card__icon ${isPositive ? 'text-critical' : 'text-normal'}`}>
            {isPositive ? <ArrowUpRight size={18} /> : isNeutral ? <Minus size={18} /> : <ArrowDownRight size={18} />}
          </span>
        </div>
        <div className="mg-trend-summary-card__body">
          <div className="mg-trend-summary-card__val-row">
            <span
              className={`mg-trend-summary-card__value mono-telemetry ${
                isPositive ? 'text-critical' : ''
              }`}
            >
              {isPositive ? `+${metrics.delta}` : metrics.delta}
            </span>
            <span className="mg-trend-summary-card__unit">{metrics.unit}</span>
            <span
              className={`mg-trend-summary-card__badge mono-telemetry ${
                metrics.percentChange > 30 ? 'badge-danger' : metrics.percentChange > 10 ? 'badge-warning' : 'badge-neutral'
              }`}
            >
              {metrics.percentChange >= 0 ? `+${metrics.percentChange}%` : `${metrics.percentChange}%`}
            </span>
          </div>
          <span className="mg-trend-summary-card__subtext">
            Net deviation from baseline
          </span>
        </div>
      </div>

      {/* 4. RATE OF CHANGE */}
      <div className="mg-trend-summary-card">
        <div className="mg-trend-summary-card__header">
          <span className="mg-trend-summary-card__title">Rate of Change</span>
          <span className="mg-trend-summary-card__icon text-warning">
            <Zap size={18} />
          </span>
        </div>
        <div className="mg-trend-summary-card__body">
          <div className="mg-trend-summary-card__val-row">
            <span className="mg-trend-summary-card__value mono-telemetry">
              {metrics.rateOfChange >= 0 ? `+${metrics.rateOfChange}` : metrics.rateOfChange}
            </span>
            <span className="mg-trend-summary-card__unit">
              {metrics.unit}/hr
            </span>
          </div>
          <span className="mg-trend-summary-card__subtext">
            Velocity of deformation
          </span>
        </div>
      </div>

      {/* 5. STATUS */}
      {renderStatusCard()}
    </div>
  );
};
