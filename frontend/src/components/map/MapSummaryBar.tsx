import React from 'react';
import type { MapNode } from '../../data/mock/nodes';
import './MapSummaryBar.css';

export interface MapSummaryBarProps {
  nodes: MapNode[];
}

export const MapSummaryBar: React.FC<MapSummaryBarProps> = ({ nodes }) => {
  const totalNodes = nodes.length;
  const onlineCount = nodes.filter((n) => n.isOnline).length;
  const offlineCount = totalNodes - onlineCount;
  const criticalCount = nodes.filter((n) => n.status === 'CRITICAL').length;
  const highRiskCount = nodes.filter((n) => n.status === 'HIGH_RISK').length;
  const warningCount = nodes.filter((n) => n.status === 'WARNING').length;
  const normalCount = nodes.filter((n) => n.status === 'NORMAL').length;

  const uniqueZones = Array.from(new Set(nodes.map((n) => n.zone))).length;
  const uniquePanels = Array.from(new Set(nodes.map((n) => n.panel))).length;

  return (
    <div className="mg-map-summary" role="status" aria-label="Mine spatial sensor network summary">
      <div className="mg-map-summary__item">
        <span className="mg-map-summary__label">SECTOR COVERAGE</span>
        <span className="mg-map-summary__val mono-telemetry">{uniqueZones} Zones &bull; {uniquePanels} Panels</span>
      </div>

      <div className="mg-map-summary__divider" />

      <div className="mg-map-summary__item">
        <span className="mg-map-summary__label">TOTAL NODES</span>
        <span className="mg-map-summary__val mono-telemetry">{totalNodes}</span>
      </div>

      <div className="mg-map-summary__divider" />

      <div className="mg-map-summary__item">
        <span className="mg-map-summary__label">HEALTH</span>
        <span className="mg-map-summary__val mono-telemetry">
          <span className="mg-map-summary__stat mg-map-summary__stat--online">{onlineCount} Online</span>
          {offlineCount > 0 && (
            <span className="mg-map-summary__stat mg-map-summary__stat--offline">{offlineCount} Offline</span>
          )}
        </span>
      </div>

      <div className="mg-map-summary__divider" />

      <div className="mg-map-summary__item">
        <span className="mg-map-summary__label">SAFETY RISK STATUS</span>
        <span className="mg-map-summary__val mono-telemetry">
          {criticalCount > 0 && (
            <span className="mg-map-summary__stat mg-map-summary__stat--critical">{criticalCount} Critical</span>
          )}
          {highRiskCount > 0 && (
            <span className="mg-map-summary__stat mg-map-summary__stat--high">{highRiskCount} High Risk</span>
          )}
          {warningCount > 0 && (
            <span className="mg-map-summary__stat mg-map-summary__stat--warn">{warningCount} Warning</span>
          )}
          <span className="mg-map-summary__stat mg-map-summary__stat--norm">{normalCount} Normal</span>
        </span>
      </div>
    </div>
  );
};
