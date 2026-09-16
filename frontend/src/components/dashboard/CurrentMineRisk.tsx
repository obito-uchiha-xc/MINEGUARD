import React, { useId } from 'react';
import { ShieldAlert, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { MineRiskSummary } from '../../data/mock/dashboardTelemetry';
import './CurrentMineRisk.css';

export interface CurrentMineRiskProps {
  summary: MineRiskSummary;
}

export const CurrentMineRisk: React.FC<CurrentMineRiskProps> = ({ summary }) => {
  const gradId = useId();

  // Handle 24h sparkline data safely
  const sparklineData = summary.sparkline24h && summary.sparkline24h.length >= 2 ? summary.sparkline24h : [];
  const width = 170;
  const height = 44;

  let lineD = '';
  let areaD = '';
  let lastPoint: { x: number; y: number } | null = null;

  if (sparklineData.length >= 2) {
    const minVal = Math.min(...sparklineData);
    const maxVal = Math.max(...sparklineData);
    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * (width - 12) + 6;
      const y = height - ((val - minVal) / (maxVal - minVal || 1)) * (height - 14) - 7;
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    });
    lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    areaD = `${lineD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    lastPoint = points[points.length - 1];
  }

  const getStatusBadge = () => {
    switch (summary.status) {
      case 'CRITICAL':
        return (
          <Badge variant="critical" dot pulse>
            CRITICAL RISK &bull; TARP 3
          </Badge>
        );
      case 'HIGH_RISK':
        return (
          <Badge variant="high_risk" dot pulse>
            HIGH RISK &bull; TARP 2
          </Badge>
        );
      case 'WARNING':
        return (
          <Badge variant="warning" dot>
            ELEVATED RISK &bull; TARP 1
          </Badge>
        );
      case 'NORMAL':
      default:
        return (
          <Badge variant="normal" dot>
            NORMAL &bull; NOMINAL
          </Badge>
        );
    }
  };

  const isNormal = summary.status === 'NORMAL';
  const isWarning = summary.status === 'WARNING';
  const isHigh = summary.status === 'HIGH_RISK';
  const isCritical = summary.status === 'CRITICAL';

  return (
    <div className="mg-risk-panel">
      {/* HEADER */}
      <div className="mg-risk-panel__header">
        <div className="mg-risk-panel__title-group">
          <ShieldAlert size={16} className="mg-risk-panel__icon" />
          <h3 className="mg-risk-panel__title">CURRENT MINE RISK</h3>
        </div>
        {getStatusBadge()}
      </div>

      {/* RISK SCORE & SPARKLINE HERO ROW */}
      <div className="mg-risk-panel__score-row">
        <div className="mg-risk-panel__score-block">
          <div className="mg-risk-panel__num-wrap">
            <span className="mg-risk-panel__score mono-telemetry">{summary.score}</span>
            <span className="mg-risk-panel__score-max">/ 100</span>
          </div>
          <div className="mg-risk-panel__trend-tag">
            <TrendingUp size={12} />
            <span>{summary.trend} ({summary.trendRate})</span>
          </div>
        </div>

        {/* 24h Gradient Area Sparkline */}
        <div className="mg-risk-panel__spark-box">
          <span className="mg-risk-panel__spark-label">24H RISK ACCELERATION</span>
          {sparklineData.length >= 2 ? (
            <svg className="mg-risk-panel__sparkline" viewBox={`0 0 ${width} ${height}`}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="6" y1={height - 1} x2={width - 6} y2={height - 1} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <path d={areaD} fill={`url(#${gradId})`} />
              <path
                d={lineD}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {lastPoint && (
                <>
                  <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill="rgba(249, 115, 22, 0.4)" />
                  <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
                </>
              )}
            </svg>
          ) : (
            <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', color: '#718096', fontFamily: 'var(--font-mono)' }}>
                Point-in-Time Assessment
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4-TIER SEGMENTED GEOTECHNICAL RISK LEVEL BAR */}
      <div className="mg-risk-panel__gauge-section">
        <div className="mg-risk-panel__segmented-bar">
          <div className={`mg-risk-panel__segment mg-risk-panel__segment--normal ${isNormal ? 'is-active' : ''}`}>
            <span>Normal</span>
            {isNormal && <span className="mg-risk-panel__active-pin" />}
          </div>
          <div className={`mg-risk-panel__segment mg-risk-panel__segment--warning ${isWarning ? 'is-active' : ''}`}>
            <span>Elevated</span>
            {isWarning && <span className="mg-risk-panel__active-pin" />}
          </div>
          <div className={`mg-risk-panel__segment mg-risk-panel__segment--high ${isHigh ? 'is-active' : ''}`}>
            <span>High Risk</span>
            {isHigh && <span className="mg-risk-panel__active-pin" />}
          </div>
          <div className={`mg-risk-panel__segment mg-risk-panel__segment--critical ${isCritical ? 'is-active' : ''}`}>
            <span>Critical</span>
            {isCritical && <span className="mg-risk-panel__active-pin" />}
          </div>
        </div>
        <div className="mg-risk-panel__threshold-legend">
          <span className={isNormal ? 'font-bold text-normal' : ''}>0 &ndash; 24</span>
          <span className={isWarning ? 'font-bold text-warning' : ''}>25 &ndash; 49</span>
          <span className={isHigh ? 'font-bold text-high-risk' : ''}>50 &ndash; 74</span>
          <span className={isCritical ? 'font-bold text-critical' : ''}>75 &ndash; 100</span>
        </div>
      </div>

      {/* PRIMARY RISK EXPLAINABILITY DRIVERS */}
      <div className="mg-risk-panel__indicators">
        <span className="mg-risk-panel__indicators-title">PRIMARY RISK DRIVERS (TOP 3)</span>
        <div className="mg-risk-panel__indicator-list">
          {summary.primaryIndicators && summary.primaryIndicators.length > 0 ? (
            summary.primaryIndicators.slice(0, 3).map((ind, i) => (
              <div key={i} className="mg-risk-panel__indicator-item">
                <ChevronRight size={13} className="mg-risk-panel__chevron" />
                <span className="mg-risk-panel__indicator-text">{ind}</span>
              </div>
            ))
          ) : (
            <div className="mg-risk-panel__indicator-item">
              <ChevronRight size={13} className="mg-risk-panel__chevron" />
              <span className="mg-risk-panel__indicator-text">Nominal Baseline &bull; Zero active risk factors</span>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER SCIENTIFIC CONFIDENCE */}
      <div className="mg-risk-panel__footer">
        <AlertTriangle size={12} className="mg-risk-panel__note-icon" />
        <span>
          {summary.confidence > 0
            ? `Multi-parameter spatial consensus confidence: ${(summary.confidence * 100).toFixed(0)}%`
            : 'Explainable Rule Engine Assessment (Phase 6 • Decision D-025)'}
        </span>
      </div>
    </div>
  );
};
