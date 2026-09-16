import React, { useState } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import type { RiskDayPoint } from '../../data/mock/trends';
import './RiskScoreTrend.css';

export interface RiskScoreTrendProps {
  history?: RiskDayPoint[];
}

export const RiskScoreTrend: React.FC<RiskScoreTrendProps> = ({ history }) => {
  const [hoveredDay, setHoveredDay] = useState<RiskDayPoint | null>(null);
  const dataPoints = history && history.length > 0 ? history : [];

  const getBarColor = (score: number) => {
    if (score >= 75) return 'var(--color-critical)';
    if (score >= 50) return 'var(--color-high-risk)';
    if (score >= 25) return 'var(--color-warning)';
    return 'var(--color-normal)';
  };

  return (
    <div className="mg-risk-trend-panel">
      {/* HEADER */}
      <div className="mg-risk-trend-panel__header">
        <div className="mg-risk-trend-panel__title-group">
          <TrendingUp size={17} className="mg-risk-trend-panel__icon" />
          <h3 className="mg-risk-trend-panel__title">Risk Score Trend</h3>
        </div>
        <span className="mg-risk-trend-panel__window mono-telemetry">7-DAY TRAJECTORY</span>
      </div>

      {/* 7-DAY EVOLUTION BARS */}
      <div className="mg-risk-trend-panel__body">
        <div className="mg-risk-trend-panel__bars-container">
          {/* Threshold Guide Lines */}
          <div className="mg-risk-trend-panel__guides">
            <div className="mg-risk-trend-panel__guide-line" style={{ bottom: '75%' }}>
              <span className="mg-risk-trend-panel__guide-lbl">75 Critical</span>
            </div>
            <div className="mg-risk-trend-panel__guide-line" style={{ bottom: '50%' }}>
              <span className="mg-risk-trend-panel__guide-lbl">50 High</span>
            </div>
            <div className="mg-risk-trend-panel__guide-line" style={{ bottom: '25%' }}>
              <span className="mg-risk-trend-panel__guide-lbl">25 Warning</span>
            </div>
          </div>

          {/* Day Bars */}
          {dataPoints.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#718096', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              Historical multi-shift risk trajectory requires daily snapshot persistence (TBD). Real-time risk is evaluated per-zone in the overview above.
            </div>
          ) : (
            <div className="mg-risk-trend-panel__bars">
              {dataPoints.map((day) => {
                const barColor = getBarColor(day.score);
                const isHovered = hoveredDay?.date === day.date;

                return (
                  <div
                    key={day.date}
                    className="mg-risk-bar-col"
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div className="mg-risk-bar-track">
                      <div
                        className={`mg-risk-bar-fill ${isHovered ? 'is-hovered' : ''}`}
                        style={{
                          height: `${day.score}%`,
                          backgroundColor: barColor,
                        }}
                      >
                        <span className="mg-risk-bar-val mono-telemetry">{day.score}</span>
                      </div>
                    </div>
                    <span className="mg-risk-bar-date">{day.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SUMMARY / STATUS CALLOUT */}
        <div className="mg-risk-trend-panel__footer">
          <Info size={13} className="mg-risk-trend-panel__info-icon" />
          <span className="mg-risk-trend-panel__footer-text">
            {dataPoints.length === 0 ? (
              '7-Day Trajectory Tracking: Awaiting historical daily snapshot rollups.'
            ) : hoveredDay ? (
              <>
                <strong className="mono-telemetry">{hoveredDay.date}</strong>: Instability index{' '}
                <strong className="mono-telemetry">{hoveredDay.score}/100</strong> ({hoveredDay.status.replace('_', ' ')})
              </>
            ) : (
              <>
                Progressive risk elevation observed: <strong>+44 points</strong> over past 7 operational shifts.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
