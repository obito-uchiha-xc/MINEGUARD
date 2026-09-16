import React from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Layers } from 'lucide-react';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { ParameterKey, TimeRangeKey } from '../../data/mock/trendsAnalysis';
import { PARAMETER_CONFIGS } from '../../data/mock/trendsAnalysis';
import type { MapNode } from '../../data/mock/nodes';
import './TrendsFilterBar.css';

export interface TrendsFilterBarProps {
  nodes: MapNode[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  selectedParam: ParameterKey;
  onSelectParam: (param: ParameterKey) => void;
  selectedTimeRange: TimeRangeKey;
  onSelectTimeRange: (range: TimeRangeKey) => void;
  isNormalizedMode: boolean;
  onToggleNormalizedMode: () => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  isRefreshing?: boolean;
}

export const TrendsFilterBar: React.FC<TrendsFilterBarProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  selectedZone,
  onSelectZone,
  selectedParam,
  onSelectParam,
  selectedTimeRange,
  onSelectTimeRange,
  isNormalizedMode,
  onToggleNormalizedMode,
  onRefresh,
  onExportCsv,
  isRefreshing = false,
}) => {
  // Extract distinct zones
  const zoneOptions = [
    { value: 'ALL', label: 'All Zones' },
    ...Array.from(new Set(nodes.map((n) => n.zone)))
      .sort()
      .map((z) => ({ value: z, label: z })),
  ];

  // Filter nodes if a specific zone is selected
  const visibleNodes =
    selectedZone === 'ALL'
      ? nodes
      : nodes.filter((n) => n.zone === selectedZone);

  const nodeOptions = visibleNodes.map((n) => ({
    value: n.id,
    label: `${n.id} — ${n.name}`,
  }));

  const paramOptions = (Object.keys(PARAMETER_CONFIGS) as ParameterKey[]).map(
    (key) => ({
      value: key,
      label: `${PARAMETER_CONFIGS[key].label} (${PARAMETER_CONFIGS[key].unit})`,
    })
  );

  const timeRanges: TimeRangeKey[] = ['1H', '6H', '24H', '7D', '30D'];

  return (
    <div className="mg-trends-filter-bar">
      <div className="mg-trends-filter-bar__row">
        {/* Node Selector */}
        <div className="mg-trends-filter-bar__group mg-trends-filter-bar__group--node">
          <label htmlFor="filter-node" className="mg-trends-filter-label">
            Sensor Node
          </label>
          <Select
            id="filter-node"
            options={nodeOptions}
            value={selectedNodeId}
            onChange={(e) => onSelectNode(e.target.value)}
            aria-label="Select Monitored Node"
          />
        </div>

        {/* Zone Selector */}
        <div className="mg-trends-filter-bar__group mg-trends-filter-bar__group--zone">
          <label htmlFor="filter-zone" className="mg-trends-filter-label">
            Sector Zone
          </label>
          <Select
            id="filter-zone"
            options={zoneOptions}
            value={selectedZone}
            onChange={(e) => onSelectZone(e.target.value)}
            aria-label="Filter by Sector Zone"
          />
        </div>

        {/* Parameter Selector */}
        <div className="mg-trends-filter-bar__group mg-trends-filter-bar__group--param">
          <label htmlFor="filter-param" className="mg-trends-filter-label">
            Deformation Parameter
          </label>
          <Select
            id="filter-param"
            options={paramOptions}
            value={selectedParam}
            onChange={(e) => onSelectParam(e.target.value as ParameterKey)}
            aria-label="Select Telemetry Parameter"
          />
        </div>

        {/* Time Range Tabs */}
        <div className="mg-trends-filter-bar__group mg-trends-filter-bar__group--time">
          <span className="mg-trends-filter-label">Time Horizon</span>
          <div className="mg-trends-time-tabs" role="tablist" aria-label="Analysis Time Range">
            {timeRanges.map((range) => {
              const isActive = selectedTimeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`mg-trends-time-tab ${isActive ? 'is-active' : ''}`}
                  onClick={() => onSelectTimeRange(range)}
                >
                  {isActive && (
                    <motion.span
                      layoutId="trendsTimeTabActive"
                      className="mg-trends-time-tab__active-bg"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="mg-trends-time-tab__label">{range}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mg-trends-filter-bar__actions">
          <button
            type="button"
            className={`mg-trends-mode-toggle ${isNormalizedMode ? 'is-active' : ''}`}
            onClick={onToggleNormalizedMode}
            title="Toggle normalized multi-parameter overlay (0–100% baseline deviation)"
            aria-pressed={isNormalizedMode}
          >
            <Layers size={14} />
            <span>{isNormalizedMode ? 'Normalized Overlay' : 'Single Parameter'}</span>
          </button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />}
            onClick={onRefresh}
            title="Refresh current telemetry buffer"
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={onExportCsv}
            title="Export time-series telemetry data as CSV"
          >
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
};
