import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  AlertOctagon,
  WifiOff,
  BatteryCharging,
  BatteryMedium,
  BatteryLow,
  ChevronRight,
} from 'lucide-react';
import type { MapNode } from '../../data/mock/nodes';
import type { SafetyStatus } from '../../types/safety';
import { Badge } from '../ui/Badge';
import './NodeTable.css';

export interface NodeTableProps {
  nodes: MapNode[];
  selectedNodeId: string | null;
  onSelectNode: (node: MapNode) => void;
}

export const NodeTable: React.FC<NodeTableProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
}) => {
  const renderStatusBadge = (status: SafetyStatus, isOnline: boolean) => {
    if (!isOnline || status === 'OFFLINE') {
      return (
        <span className="mg-node-table__status mg-node-table__status--offline">
          <WifiOff size={13} aria-hidden="true" />
          <span>Offline</span>
        </span>
      );
    }

    switch (status) {
      case 'CRITICAL':
        return (
          <span className="mg-node-table__status mg-node-table__status--critical">
            <AlertOctagon size={13} aria-hidden="true" />
            <span>Critical</span>
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="mg-node-table__status mg-node-table__status--high-risk">
            <Flame size={13} aria-hidden="true" />
            <span>High Risk</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="mg-node-table__status mg-node-table__status--warning">
            <AlertTriangle size={13} aria-hidden="true" />
            <span>Warning</span>
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="mg-node-table__status mg-node-table__status--normal">
            <ShieldCheck size={13} aria-hidden="true" />
            <span>Normal</span>
          </span>
        );
    }
  };

  const renderBattery = (pct: number, isOnline: boolean) => {
    if (!isOnline || pct <= 0) {
      return (
        <span
          className="mg-node-table__battery mono-telemetry text-tertiary"
          title="Battery level not monitored by backend Phases 0-10 (TBD)"
        >
          —
        </span>
      );
    }
    const icon =
      pct > 70 ? (
        <BatteryCharging size={14} className="text-normal" />
      ) : pct > 30 ? (
        <BatteryMedium size={14} className="text-warning" />
      ) : (
        <BatteryLow size={14} className="text-critical" />
      );

    return (
      <div className="mg-node-table__battery mono-telemetry">
        {icon}
        <span>{pct}%</span>
      </div>
    );
  };

  const renderRiskBadge = (score: number, status: SafetyStatus, isOnline: boolean) => {
    if (!isOnline) {
      return <span className="mono-telemetry text-tertiary">—</span>;
    }

    let riskVariant: 'normal' | 'warning' | 'high_risk' | 'critical' = 'normal';
    let riskLabel = 'Normal';
    if (score >= 80 || status === 'CRITICAL') {
      riskVariant = 'critical';
      riskLabel = 'Critical';
    } else if (score >= 60 || status === 'HIGH_RISK') {
      riskVariant = 'high_risk';
      riskLabel = 'High';
    } else if (score >= 30 || status === 'WARNING') {
      riskVariant = 'warning';
      riskLabel = 'Elevated';
    }

    return (
      <div className="mg-node-table__risk-cell">
        <span className="mg-node-table__risk-score mono-telemetry">{score}</span>
        <Badge variant={riskVariant}>
          {riskLabel}
        </Badge>
      </div>
    );
  };

  return (
    <div className="mg-node-table-wrapper" tabIndex={0} aria-label="Sensor Nodes Table">
      <table className="mg-node-table">
        <thead>
          <tr>
            <th scope="col" className="col-status">Status</th>
            <th scope="col" className="col-node">Node</th>
            <th scope="col" className="col-zone">Zone</th>
            <th scope="col" className="col-tilt">Tilt</th>
            <th scope="col" className="col-disp">Displacement</th>
            <th scope="col" className="col-vib">Vibration</th>
            <th scope="col" className="col-crack">Crack</th>
            <th scope="col" className="col-moisture">Moisture</th>
            <th scope="col" className="col-temp">Temp</th>
            <th scope="col" className="col-risk">Risk Score</th>
            <th scope="col" className="col-battery">Battery</th>
            <th scope="col" className="col-updated">Last Update</th>
            <th scope="col" className="col-action"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const zoneCode = node.zone.replace('Zone ', '');
            const panelCode = node.panel.replace('Panel ', '');

            return (
              <tr
                key={node.id}
                className={`mg-node-table__row ${isSelected ? 'is-selected' : ''} ${
                  !node.isOnline ? 'is-offline' : ''
                }`}
                onClick={() => onSelectNode(node)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectNode(node);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`Inspect node ${node.id} (${node.name}), status ${node.status}, risk ${node.aiRiskScore}`}
              >
                {/* Status */}
                <td className="col-status">
                  {renderStatusBadge(node.status, node.isOnline)}
                </td>

                {/* Node ID & Name */}
                <td className="col-node">
                  <div className="mg-node-table__node-info">
                    <span className="mg-node-table__node-id mono-telemetry">{node.id}</span>
                    <span className="mg-node-table__node-name" title={node.name}>
                      {node.name}
                    </span>
                  </div>
                </td>

                {/* Zone */}
                <td className="col-zone">
                  <span className="mg-node-table__zone-tag mono-telemetry">
                    {zoneCode}{panelCode}
                  </span>
                </td>

                {/* Tilt */}
                <td className="col-tilt mono-telemetry">
                  {node.isOnline && node.hasReadings !== false ? `${node.tiltDeg.toFixed(2)}°` : '—'}
                </td>

                {/* Displacement */}
                <td className="col-disp mono-telemetry">
                  {node.isOnline && node.hasReadings !== false ? (
                    <span className={node.displacementMm >= 3.0 ? 'text-critical font-semibold' : ''}>
                      {node.displacementMm.toFixed(1)} mm
                    </span>
                  ) : (
                    '—'
                  )}
                </td>

                {/* Vibration */}
                <td className="col-vib mono-telemetry">
                  {node.isOnline && node.hasReadings !== false ? `${node.vibrationMmS.toFixed(2)} mm/s` : '—'}
                </td>

                {/* Crack Width */}
                <td className="col-crack mono-telemetry">
                  {node.isOnline && node.hasReadings !== false ? `${node.crackWidthMm.toFixed(2)} mm` : '—'}
                </td>

                {/* Moisture */}
                <td className="col-moisture mono-telemetry">
                  {node.isOnline && node.hasReadings !== false ? `${node.moisturePct}%` : '—'}
                </td>

                {/* Temperature */}
                <td className="col-temp mono-telemetry">
                  {node.isOnline && node.hasReadings !== false ? `${node.temperatureC.toFixed(1)}°C` : '—'}
                </td>

                {/* Risk Score */}
                <td className="col-risk">
                  {renderRiskBadge(node.aiRiskScore, node.status, node.isOnline)}
                </td>

                {/* Battery */}
                <td className="col-battery">
                  {renderBattery(node.batteryPct, node.isOnline)}
                </td>

                {/* Last Update */}
                <td className="col-updated mono-telemetry text-tertiary">
                  {node.lastUpdated}
                </td>

                {/* Action button */}
                <td className="col-action">
                  <button
                    type="button"
                    className="mg-node-table__inspect-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNode(node);
                    }}
                    title={`Inspect telemetry for ${node.id}`}
                    aria-label={`Inspect ${node.id}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
