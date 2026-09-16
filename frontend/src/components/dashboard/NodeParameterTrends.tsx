import React, { useState, useEffect } from 'react';
import { Compass, MoveHorizontal, Activity, Split } from 'lucide-react';
import type { TimeFilter, TrendDataPoint } from '../../data/mock/trends';
import { telemetryService } from '../../services/telemetryService';
import { formatUtcTime } from '../../utils/date';
import './NodeParameterTrends.css';

export interface NodeParameterTrendsProps {
  selectedNodeId?: string;
}

interface MiniTrendChartProps {
  title: string;
  unit: string;
  color: string;
  data: TrendDataPoint[];
  icon: React.ReactNode;
}

const MiniTrendChart: React.FC<MiniTrendChartProps> = ({
  title,
  unit,
  color,
  data,
  icon,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="mg-mini-chart" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '6px' }}>
        <div style={{ textAlign: 'center', color: '#718096', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          <div style={{ color }}>{icon}</div>
          <div style={{ marginTop: '4px' }}>{title}</div>
          <div style={{ fontSize: '9px', opacity: 0.7 }}>Awaiting live telemetry</div>
        </div>
      </div>
    );
  }

  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const padding = (maxVal - minVal) * 0.15 || 0.1;
  const yMin = Math.max(0, minVal - padding);
  const yMax = maxVal + padding;

  const width = 280;
  const height = 120;
  const chartPadLeft = 32;
  const chartPadRight = 12;
  const chartPadTop = 10;
  const chartPadBottom = 24;

  const innerW = width - chartPadLeft - chartPadRight;
  const innerH = height - chartPadTop - chartPadBottom;

  const points = data.map((d, i) => {
    const x = chartPadLeft + (i / (data.length - 1)) * innerW;
    const y = chartPadTop + innerH - ((d.value - yMin) / (yMax - yMin || 1)) * innerH;
    return { x, y, ...d };
  });

  const pathD = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const areaD = `${pathD} L ${points[points.length - 1].x},${chartPadTop + innerH} L ${points[0].x},${chartPadTop + innerH} Z`;

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  return (
    <div className="mg-mini-chart">
      <div className="mg-mini-chart__header">
        <div className="mg-mini-chart__title-row">
          <span className="mg-mini-chart__icon" style={{ color }}>{icon}</span>
          <span className="mg-mini-chart__title">{title}</span>
        </div>
        <div className="mg-mini-chart__current mono-telemetry">
          <span style={{ color }}>{activePoint.value.toFixed(2)}</span>
          <span className="mg-mini-chart__unit">{unit}</span>
        </div>
      </div>

      <div className="mg-mini-chart__svg-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mg-mini-chart__svg"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={chartPadLeft}
            y1={chartPadTop}
            x2={width - chartPadRight}
            y2={chartPadTop}
            stroke="rgba(38, 53, 69, 0.4)"
            strokeDasharray="2 2"
          />
          <line
            x1={chartPadLeft}
            y1={chartPadTop + innerH / 2}
            x2={width - chartPadRight}
            y2={chartPadTop + innerH / 2}
            stroke="rgba(38, 53, 69, 0.4)"
            strokeDasharray="2 2"
          />
          <line
            x1={chartPadLeft}
            y1={chartPadTop + innerH}
            x2={width - chartPadRight}
            y2={chartPadTop + innerH}
            stroke="rgba(38, 53, 69, 0.6)"
          />

          {/* Y Axis ticks */}
          <text x={chartPadLeft - 4} y={chartPadTop + 4} fill="#718096" fontSize="9" textAnchor="end" fontFamily="var(--font-mono)">
            {yMax.toFixed(1)}
          </text>
          <text x={chartPadLeft - 4} y={chartPadTop + innerH} fill="#718096" fontSize="9" textAnchor="end" fontFamily="var(--font-mono)">
            {yMin.toFixed(1)}
          </text>

          {/* Area under curve */}
          <path d={areaD} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />

          {/* Stroke line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points & Interactive Hover Columns */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoverIndex === idx ? 4.5 : 2}
                fill={hoverIndex === idx ? '#ffffff' : color}
                stroke={color}
                strokeWidth={hoverIndex === idx ? 2 : 1}
              />
              <rect
                x={p.x - innerW / (data.length * 2)}
                y={0}
                width={innerW / data.length}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(idx)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          ))}

          {/* X Axis labels (First and Last) */}
          <text x={points[0].x} y={height - 6} fill="#718096" fontSize="9" fontFamily="var(--font-mono)">
            {points[0].time}
          </text>
          <text x={points[points.length - 1].x} y={height - 6} fill="#718096" fontSize="9" textAnchor="end" fontFamily="var(--font-mono)">
            {points[points.length - 1].time}
          </text>
        </svg>

        {hoverIndex !== null && (
          <div
            className="mg-mini-chart__tooltip"
            style={{ left: `${(points[hoverIndex].x / width) * 100}%` }}
          >
            <span className="mg-mini-chart__tip-time mono-telemetry">{points[hoverIndex].time}</span>
            <span className="mg-mini-chart__tip-val mono-telemetry">
              {points[hoverIndex].value.toFixed(2)} {unit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const NodeParameterTrends: React.FC<NodeParameterTrendsProps> = ({
  selectedNodeId = 'N04',
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24H');

  // Live series state
  const [liveData, setLiveData] = useState<{
    tilt?: TrendDataPoint[];
    displacement?: TrendDataPoint[];
    vibration?: TrendDataPoint[];
    crackWidth?: TrendDataPoint[];
  } | null>(null);

  useEffect(() => {
    let active = true;
    telemetryService
      .getHistory(selectedNodeId, { limit: 100 })
      .then((history) => {
        if (!active) return;
        if (history && history.readings && history.readings.length > 0) {
          const tiltPts: TrendDataPoint[] = [];
          const dispPts: TrendDataPoint[] = [];
          const vibPts: TrendDataPoint[] = [];
          const crackPts: TrendDataPoint[] = [];

          for (const r of history.readings) {
            const time = formatUtcTime(r.timestamp) || r.timestamp.slice(11, 16);
            const pt = { time, value: Number(r.value.toFixed(2)) };
            const type = r.sensor_type.toLowerCase();

            if (type.includes('tilt')) tiltPts.push(pt);
            else if (type.includes('displacement')) dispPts.push(pt);
            else if (type.includes('vibration')) vibPts.push(pt);
            else if (type.includes('crack')) crackPts.push(pt);
          }

          setLiveData({
            tilt: tiltPts.length >= 2 ? tiltPts : undefined,
            displacement: dispPts.length >= 2 ? dispPts : undefined,
            vibration: vibPts.length >= 2 ? vibPts : undefined,
            crackWidth: crackPts.length >= 2 ? crackPts : undefined,
          });
        } else {
          setLiveData(null);
        }
      })
      .catch(() => {
        if (!active) return;
        setLiveData(null);
      });

    return () => {
      active = false;
    };
  }, [selectedNodeId, timeFilter]);

  const activeTrends = {
    tilt: liveData?.tilt || [],
    displacement: liveData?.displacement || [],
    vibration: liveData?.vibration || [],
    crackWidth: liveData?.crackWidth || [],
  };

  return (
    <div className="mg-param-trends">
      {/* HEADER */}
      <div className="mg-param-trends__header">
        <div className="mg-param-trends__title-group">
          <Activity size={18} className="mg-param-trends__icon" />
          <h3 className="mg-param-trends__title">
            Node {selectedNodeId} &mdash; Parameter Trends
          </h3>
          <span className="mg-param-trends__sub mono-telemetry">
            {liveData
              ? 'LIVE TELEMETRY STREAM'
              : 'AWAITING TELEMETRY STREAM'}
          </span>
        </div>

        {/* TIME FILTER TABS */}
        <div className="mg-param-trends__filters" role="tablist" aria-label="Time Filter">
          {(['1H', '6H', '24H', '7D', '30D'] as TimeFilter[]).map((tf) => (
            <button
              key={tf}
              type="button"
              role="tab"
              aria-selected={timeFilter === tf}
              className={`mg-param-trends__tab ${timeFilter === tf ? 'is-active' : ''}`}
              onClick={() => setTimeFilter(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 4 TREND CHARTS GRID */}
      <div className="mg-param-trends__grid">
        <MiniTrendChart
          title="Tilt Deviation"
          unit="°"
          color="var(--color-warning)"
          data={activeTrends.tilt}
          icon={<Compass size={15} />}
        />
        <MiniTrendChart
          title="Laser Displacement"
          unit="mm"
          color="var(--color-critical)"
          data={activeTrends.displacement}
          icon={<MoveHorizontal size={15} />}
        />
        <MiniTrendChart
          title="Vibration Velocity"
          unit="mm/s"
          color="var(--color-info)"
          data={activeTrends.vibration}
          icon={<Activity size={15} />}
        />
        <MiniTrendChart
          title="Crack Aperture"
          unit="mm"
          color="var(--color-high-risk)"
          data={activeTrends.crackWidth}
          icon={<Split size={15} />}
        />
      </div>
    </div>
  );
};
