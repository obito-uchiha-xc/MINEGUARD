import React, { useState, useId } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type {
  TelemetryPoint,
  ParameterConfig,
  AnomalyRegion,
  NormalizedDataSeries,
} from '../../data/mock/trendsAnalysis';
import './MainTelemetryChart.css';

export interface MainTelemetryChartProps {
  data: TelemetryPoint[];
  config: ParameterConfig;
  nodeId: string;
  nodeName: string;
  timeRange: string;
  trendDirection: 'Increasing' | 'Stable' | 'Decreasing';
  anomalyRegions: AnomalyRegion[];
  isNormalizedMode: boolean;
  normalizedSeries?: NormalizedDataSeries[];
}

export const MainTelemetryChart: React.FC<MainTelemetryChartProps> = ({
  data,
  config,
  nodeId,
  nodeName,
  timeRange,
  trendDirection,
  anomalyRegions,
  isNormalizedMode,
  normalizedSeries = [],
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradId = useId();

  if (!data || data.length === 0) {
    return (
      <div
        className="mg-main-chart"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '260px',
          textAlign: 'center',
          padding: '32px',
        }}
      >
        <Info size={28} style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }} />
        <h4 style={{ margin: '0 0 6px', color: 'var(--color-text)' }}>
          Awaiting Historical Readings
        </h4>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '12px', maxWidth: '420px' }}>
          Zero historical readings recorded for Node {nodeId} ({config.label}) in time range {timeRange}.
          Observations will appear here automatically upon backend ingestion.
        </p>
      </div>
    );
  }

  // Chart dimensions & layout
  const width = 860;
  const height = 320;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  // Single Parameter calculations
  const values = data.map((d) => d.value);
  const baselineVal = data[0].baseline;
  const minVal = Math.min(...values, baselineVal * 0.85);
  const maxVal = Math.max(...values, baselineVal * 1.15, config.warningThreshold);
  const yPadding = (maxVal - minVal) * 0.1 || 0.1;
  const yMin = Math.max(0, minVal - yPadding);
  const yMax = maxVal + yPadding;

  const getY = (val: number) => {
    return padTop + innerH - ((val - yMin) / (yMax - yMin || 1)) * innerH;
  };

  const getX = (index: number, total: number) => {
    return padLeft + (index / (total - 1)) * innerW;
  };

  // Coordinates for main telemetry line
  const points = data.map((d, i) => ({
    x: getX(i, data.length),
    y: getY(d.value),
    ...d,
  }));

  const pathD = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const areaD = `${pathD} L ${points[points.length - 1].x},${padTop + innerH} L ${points[0].x},${padTop + innerH} Z`;

  // Baseline Y
  const baselineY = getY(baselineVal);

  // Warning threshold Y
  const warningY = getY(config.warningThreshold);

  // Active hover point
  const activeIndex = hoverIndex !== null ? hoverIndex : points.length - 1;
  const activePoint = points[activeIndex];

  // Grid tick marks
  const yTicks = [yMin, (yMin + yMax) / 2, yMax];
  const stepX = Math.max(1, Math.floor(data.length / 6));
  const xTicks = data.filter((_, i) => i % stepX === 0 || i === data.length - 1);

  // Normalized Mode Calculations
  const renderNormalizedChart = () => {
    const normH = innerH;
    const normGetY = (pct: number) => padTop + normH - (pct / 100) * normH;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mg-main-chart__svg"
        preserveAspectRatio="none"
      >
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map((level) => (
          <g key={level}>
            <line
              x1={padLeft}
              y1={normGetY(level)}
              x2={width - padRight}
              y2={normGetY(level)}
              stroke="var(--color-border-subtle)"
              strokeDasharray="3 3"
            />
            <text
              x={padLeft - 10}
              y={normGetY(level) + 4}
              textAnchor="end"
              className="mg-chart-axis-label mono-telemetry"
            >
              {level}%
            </text>
          </g>
        ))}

        {/* X axis ticks */}
        {xTicks.map((tick, i) => {
          const origIdx = data.findIndex((d) => d.time === tick.time);
          const x = getX(origIdx, data.length);
          return (
            <text
              key={i}
              x={x}
              y={height - 12}
              textAnchor="middle"
              className="mg-chart-axis-label mono-telemetry"
            >
              {tick.time}
            </text>
          );
        })}

        {/* Normalized Lines */}
        {normalizedSeries.map((s) => {
          const sPoints = s.points.map((p, i) => ({
            x: getX(i, s.points.length),
            y: normGetY(p.normalizedPct),
          }));
          const sPath = `M ${sPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;

          return (
            <g key={s.parameter}>
              <path
                d={sPath}
                fill="none"
                stroke={s.color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Last point dot */}
              <circle
                cx={sPoints[sPoints.length - 1].x}
                cy={sPoints[sPoints.length - 1].y}
                r="3.5"
                fill={s.color}
              />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="mg-main-chart-container" role="region" aria-label="Telemetry Trend Analysis">
      {/* HEADER */}
      <div className="mg-main-chart__header">
        <div className="mg-main-chart__titles">
          <div className="mg-main-chart__title-row">
            <h3 className="mg-main-chart__title">
              {isNormalizedMode
                ? 'Multi-Parameter Normalized Comparison'
                : `${config.label} Trend`}
            </h3>
            <span className="mg-main-chart__node-tag mono-telemetry">
              {nodeId} — {nodeName}
            </span>
          </div>
          <p className="mg-main-chart__desc">
            {isNormalizedMode
              ? 'Cross-parameter deviation scaled to 0–100% threshold index across time horizon'
              : `Continuous time-series logging via ${config.hardwareSensor} over ${timeRange}`}
          </p>
        </div>

        <div className="mg-main-chart__badges">
          {!isNormalizedMode && (
            <div className={`mg-trend-dir-badge mg-trend-dir-badge--${trendDirection.toLowerCase()}`}>
              {trendDirection === 'Increasing' ? (
                <TrendingUp size={14} />
              ) : trendDirection === 'Decreasing' ? (
                <TrendingDown size={14} />
              ) : (
                <Minus size={14} />
              )}
              <span>Trend: {trendDirection}</span>
            </div>
          )}

          {anomalyRegions.length > 0 && !isNormalizedMode && (
            <div className="mg-anomaly-detected-pill">
              <AlertTriangle size={13} />
              <span>Anomaly Detected ({anomalyRegions[0].startTime}–{anomalyRegions[0].endTime})</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG CHART */}
      <div className="mg-main-chart__stage">
        {isNormalizedMode ? (
          renderNormalizedChart()
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mg-main-chart__svg"
            preserveAspectRatio="none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.colorVar} stopOpacity="0.25" />
                <stop offset="100%" stopColor={config.colorVar} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle Horizontal Grid lines */}
            {yTicks.map((val, idx) => (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={getY(val)}
                  x2={width - padRight}
                  y2={getY(val)}
                  stroke="var(--color-border-subtle)"
                  strokeDasharray="2 2"
                />
                <text
                  x={padLeft - 10}
                  y={getY(val) + 4}
                  textAnchor="end"
                  className="mg-chart-axis-label mono-telemetry"
                >
                  {val.toFixed(config.decimals)}
                </text>
              </g>
            ))}

            {/* X-axis tick labels */}
            {xTicks.map((tick, i) => {
              const origIdx = data.findIndex((d) => d.time === tick.time);
              const x = getX(origIdx, data.length);
              return (
                <text
                  key={i}
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  className="mg-chart-axis-label mono-telemetry"
                >
                  {tick.time}
                </text>
              );
            })}

            {/* Subtle Anomaly Region Highlight */}
            {anomalyRegions.length > 0 && points.length >= 6 && (
              <rect
                x={points[Math.max(0, Math.floor(points.length * 0.75))].x}
                y={padTop}
                width={points[points.length - 1].x - points[Math.max(0, Math.floor(points.length * 0.75))].x}
                height={innerH}
                fill="rgba(239, 68, 68, 0.08)"
                stroke="rgba(239, 68, 68, 0.25)"
                strokeDasharray="3 3"
              />
            )}

            {/* Historical Baseline Reference Line */}
            <line
              x1={padLeft}
              y1={baselineY}
              x2={width - padRight}
              y2={baselineY}
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.8"
            />

            {/* Baseline Label on right */}
            <text
              x={width - padRight - 4}
              y={baselineY - 5}
              textAnchor="end"
              className="mg-baseline-reference-label mono-telemetry"
            >
              Baseline: {baselineVal.toFixed(config.decimals)} {config.unit}
            </text>

            {/* Warning threshold line (subtle) */}
            {warningY > padTop && warningY < padTop + innerH && (
              <line
                x1={padLeft}
                y1={warningY}
                x2={width - padRight}
                y2={warningY}
                stroke="var(--color-warning)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.6"
              />
            )}

            {/* Gradient Area Fill */}
            <polygon points={areaD} fill={`url(#${gradId})`} />

            {/* Telemetry Line */}
            <path
              d={pathD}
              fill="none"
              stroke={config.colorVar}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Vertical Cursor line on hover */}
            {hoverIndex !== null && (
              <line
                x1={activePoint.x}
                y1={padTop}
                x2={activePoint.x}
                y2={padTop + innerH}
                stroke="var(--color-text-secondary)"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.75"
              />
            )}

            {/* Active Data Point Dot */}
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4.5"
              fill={config.colorVar}
              stroke="var(--color-surface)"
              strokeWidth="2"
            />

            {/* Invisible hover trigger columns */}
            {points.map((p, idx) => {
              const colW = innerW / (points.length - 1);
              return (
                <rect
                  key={idx}
                  x={p.x - colW / 2}
                  y={padTop}
                  width={colW}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(idx)}
                />
              );
            })}
          </svg>
        )}

        {/* INTERACTIVE TOOLTIP */}
        {!isNormalizedMode && (
          <div
            className="mg-chart-tooltip"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
            }}
          >
            <div className="mg-chart-tooltip__header">
              <span className="time mono-telemetry">{activePoint.time}</span>
              <span
                className={`status ${
                  activePoint.isAnomaly ? 'status--anomaly' : 'status--normal'
                }`}
              >
                {activePoint.isAnomaly ? 'Elevated' : 'Normal'}
              </span>
            </div>
            <div className="mg-chart-tooltip__row">
              <span className="label">Telemetry:</span>
              <span className="val mono-telemetry">
                {activePoint.value.toFixed(config.decimals)} {config.unit}
              </span>
            </div>
            <div className="mg-chart-tooltip__row">
              <span className="label">Baseline:</span>
              <span className="val mono-telemetry">
                {activePoint.baseline.toFixed(config.decimals)} {config.unit}
              </span>
            </div>
            <div className="mg-chart-tooltip__row">
              <span className="label">Deviation:</span>
              <span
                className={`val mono-telemetry ${
                  activePoint.deviation > 0 ? 'text-critical font-semibold' : ''
                }`}
              >
                {activePoint.deviation > 0 ? `+${activePoint.deviation}` : activePoint.deviation} {config.unit}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER LEGEND */}
      <div className="mg-main-chart__footer">
        {isNormalizedMode ? (
          <div className="mg-normalized-legend">
            {normalizedSeries.map((s) => (
              <div key={s.parameter} className="mg-normalized-legend__item">
                <span
                  className="dot"
                  style={{ backgroundColor: s.color }}
                />
                <span className="name">{s.label} ({s.unit})</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mg-single-legend">
            <div className="mg-legend-item">
              <span
                className="line"
                style={{ backgroundColor: config.colorVar }}
              />
              <span>Actual Telemetry ({config.unit})</span>
            </div>
            <div className="mg-legend-item">
              <span className="line line--dashed" />
              <span>Historical Baseline ({baselineVal.toFixed(config.decimals)} {config.unit})</span>
            </div>
            <div className="mg-legend-item">
              <span className="box box--anomaly" />
              <span>Anomalous Region</span>
            </div>
          </div>
        )}

        <span className="mg-main-chart__note">
          <Info size={12} />
          <span>Continuous LoRa SX1278 packet sampling • Non-destructive geotechnical trend</span>
        </span>
      </div>
    </div>
  );
};
