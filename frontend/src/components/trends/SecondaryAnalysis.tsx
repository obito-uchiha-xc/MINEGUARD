import React from 'react';
import {
  Zap,
  Gauge,
  Activity,
  Info,
} from 'lucide-react';
import type { ParameterMetrics } from '../../data/mock/trendsAnalysis';
import './SecondaryAnalysis.css';

export interface SecondaryAnalysisProps {
  metrics: ParameterMetrics;
  nodeId: string;
}

/**
 * Secondary Analysis Panel — Phase 16
 *
 * Rate of change and acceleration metrics are now derived from real backend
 * telemetry history via the trendsAdapter (adaptHistoryToTelemetryTimeSeries).
 *
 * Removed:
 * - Fukuzono 1/v inverse velocity failure predictor: this is a geotechnical
 *   algorithm NOT implemented in the backend (Phases 0–10). It required
 *   rate-of-velocity input and calibration parameters that do not exist in the API.
 * - Hardcoded N04-specific rate values (+0.21 mm/hr etc.) — replaced by
 *   real computed rateOfChange from the loaded telemetry history.
 */
export const SecondaryAnalysis: React.FC<SecondaryAnalysisProps> = ({
  metrics,
  nodeId,
}) => {
  const deviationPct = metrics.percentChange;
  const deviationBarPct = Math.min(100, Math.max(0, (deviationPct / 100) * 100));

  const formatRate = (rate: number, unit: string): string => {
    if (rate === 0) return `0.00 ${unit}/hr`;
    const sign = rate > 0 ? '+' : '';
    return `${sign}${rate.toFixed(3)} ${unit}/hr`;
  };

  return (
    <div className="mg-secondary-analysis-grid">
      {/* 1. RATE OF CHANGE (VELOCITY) */}
      <div className="mg-sec-card">
        <div className="mg-sec-card__header">
          <div className="mg-sec-card__title-row">
            <Zap size={16} className="text-warning" />
            <h4 className="mg-sec-card__title">Rate of Change (Velocity)</h4>
          </div>
          <span className="mg-sec-card__badge mono-telemetry">Δ / hour</span>
        </div>

        <p className="mg-sec-card__desc">
          Temporal velocity of the selected parameter computed from the loaded
          historical reading window.
        </p>

        <div className="mg-rate-list">
          <div className="mg-rate-item">
            <div className="mg-rate-item__info">
              <span className="name">{metrics.unit} / hour</span>
              <span className="unit mono-telemetry">Node {nodeId}</span>
            </div>
            <span
              className={`mg-rate-item__val mono-telemetry ${
                Math.abs(metrics.rateOfChange) > 0.5 ? 'text-critical' : ''
              }`}
            >
              {formatRate(metrics.rateOfChange, metrics.unit)}
            </span>
          </div>

          <div className="mg-rate-item">
            <div className="mg-rate-item__info">
              <span className="name">Trend Direction</span>
              <span className="unit mono-telemetry">Window average</span>
            </div>
            <span className="mg-rate-item__val mono-telemetry">
              {metrics.trendDirection}
            </span>
          </div>

          <div className="mg-rate-item">
            <div className="mg-rate-item__info">
              <span className="name">Net Δ from Baseline</span>
              <span className="unit mono-telemetry">Absolute deviation</span>
            </div>
            <span
              className={`mg-rate-item__val mono-telemetry ${
                metrics.delta > 0 ? 'text-warning' : ''
              }`}
            >
              {metrics.delta >= 0 ? `+${metrics.delta}` : metrics.delta} {metrics.unit}
            </span>
          </div>
        </div>

        <div className="mg-drawer__info-notice" style={{ marginTop: '8px' }}>
          <Info size={12} />
          <span style={{ fontSize: '11px' }}>
            Rate computed from (last_value − first_value) / time_span_hours across the
            loaded telemetry window. This is a presentation-level calculation only.
          </span>
        </div>
      </div>

      {/* 2. CHANGE ACCELERATION (2ND DERIVATIVE) */}
      <div className="mg-sec-card">
        <div className="mg-sec-card__header">
          <div className="mg-sec-card__title-row">
            <Activity size={16} className="text-critical" />
            <h4 className="mg-sec-card__title">Change Acceleration (2nd Derivative)</h4>
          </div>
          <span className="mg-sec-card__badge mono-telemetry">d²x / dt²</span>
        </div>

        <p className="mg-sec-card__desc">
          Rate at which deformation velocity is accelerating. Derived from the loaded
          telemetry window — not a backend-computed metric.
        </p>

        {/* 3-Step Progression Indicator */}
        <div className="mg-acc-progression">
          <div
            className={`mg-acc-step ${
              metrics.accelerationStatus === 'Stable' ? 'is-active is-stable' : ''
            }`}
          >
            <div className="step-circle">1</div>
            <span className="step-label">Stable</span>
          </div>
          <div className="step-connector" />
          <div
            className={`mg-acc-step ${
              metrics.accelerationStatus === 'Increasing' ? 'is-active is-increasing' : ''
            }`}
          >
            <div className="step-circle">2</div>
            <span className="step-label">Increasing</span>
          </div>
          <div className="step-connector" />
          <div
            className={`mg-acc-step ${
              metrics.accelerationStatus === 'Accelerating' ? 'is-active is-accelerating' : ''
            }`}
          >
            <div className="step-circle">3</div>
            <span className="step-label">Accelerating</span>
          </div>
        </div>

        <div className="mg-acc-readings">
          <div className="mg-acc-pill">
            <span className="label">Acceleration:</span>
            <span
              className={`val mono-telemetry font-semibold ${
                Math.abs(metrics.acceleration) > 0.1 ? 'text-critical' : ''
              }`}
            >
              {metrics.acceleration >= 0 ? '+' : ''}{metrics.acceleration.toFixed(3)}{' '}
              {metrics.unit}/hr²
            </span>
          </div>
          <div className="mg-acc-pill">
            <span className="label">Status:</span>
            <span className="val mono-telemetry font-semibold">
              {metrics.accelerationStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 3. BASELINE DEVIATION */}
      <div className="mg-sec-card">
        <div className="mg-sec-card__header">
          <div className="mg-sec-card__title-row">
            <Gauge size={16} className="text-primary" />
            <h4 className="mg-sec-card__title">Baseline Deviation</h4>
          </div>
          <span
            className={`mg-sec-status-tag ${
              metrics.status === 'ANOMALOUS'
                ? 'tag-critical'
                : metrics.status === 'ELEVATED'
                ? 'tag-warning'
                : 'tag-normal'
            }`}
          >
            {metrics.status}
          </span>
        </div>

        <p className="mg-sec-card__desc">
          Current reading measured against the window-average baseline derived from
          the loaded historical dataset.
        </p>

        <div className="mg-dev-stats">
          <div className="mg-dev-stat-col">
            <span className="label">Current</span>
            <span className="val mono-telemetry">
              {metrics.current} {metrics.unit}
            </span>
          </div>
          <div className="mg-dev-stat-col">
            <span className="label">Baseline (avg)</span>
            <span className="val mono-telemetry">
              {metrics.baseline} {metrics.unit}
            </span>
          </div>
          <div className="mg-dev-stat-col">
            <span className="label">Deviation</span>
            <span className="val mono-telemetry text-critical font-bold">
              {deviationPct >= 0 ? '+' : ''}{deviationPct}%
            </span>
          </div>
        </div>

        {/* Visual Deviation Bar */}
        <div className="mg-dev-bar-wrapper">
          <div className="mg-dev-bar">
            <div
              className={`mg-dev-bar__fill ${
                deviationPct > 40 ? 'fill-critical' : deviationPct > 15 ? 'fill-warning' : 'fill-normal'
              }`}
              style={{ width: `${deviationBarPct}%` }}
            />
          </div>
          <div className="mg-dev-bar-labels">
            <span>0% (Baseline avg)</span>
            <span>+30%</span>
            <span>+60%+</span>
          </div>
        </div>
      </div>

      {/* 4. FAILURE PREDICTION — NOT AVAILABLE */}
      <div className="mg-sec-card">
        <div className="mg-sec-card__header">
          <div className="mg-sec-card__title-row">
            <Activity size={16} />
            <h4 className="mg-sec-card__title">Predictive Failure Analysis</h4>
          </div>
          <span className="mg-sec-card__badge mono-telemetry tag-normal">NOT AVAILABLE</span>
        </div>

        <div className="mg-drawer__info-notice" style={{ marginTop: '8px' }}>
          <Info size={14} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
              Fukuzono / Inverse Velocity Model Not Implemented
            </p>
            <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
              The Fukuzono empirical failure forecasting model (inverse velocity 1/v → 0,
              time-to-failure extrapolation) requires a dedicated backend service with
              calibrated geotechnical parameters. This algorithm is NOT implemented in
              backend Phases 0–10. Displaying estimated failure times without a verified
              model would be unsafe and misleading.
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              Documented as <strong>TBD</strong> in <code>docs/FRONTEND_UNKNOWNs.md</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
