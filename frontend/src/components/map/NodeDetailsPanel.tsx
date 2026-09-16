import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Radio,
  Battery,
  Wifi,
  Thermometer,
  Droplets,
  Activity,
  MoveHorizontal,
  Compass,
  Split,
  Wind,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import type { MapNode } from '../../data/mock/nodes';
import './NodeDetailsPanel.css';

export interface NodeDetailsPanelProps {
  node: MapNode;
  onClose: () => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ node, onClose }) => {
  const navigate = useNavigate();
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  return (
    <aside className="mg-node-panel" aria-label={`Telemetry Details for Node ${node.id}`}>
      {/* HEADER */}
      <div className="mg-node-panel__header">
        <div className="mg-node-panel__title-group">
          <div className="mg-node-panel__id-row">
            <h3 className="mg-node-panel__id mono-telemetry">{node.id}</h3>
            <Badge status={node.status} dot pulse={node.status === 'CRITICAL' || node.status === 'HIGH_RISK'}>
              {node.status.replace('_', ' ')}
            </Badge>
          </div>
          <h4 className="mg-node-panel__name">{node.name}</h4>
          <span className="mg-node-panel__sub">{node.zone} &bull; {node.panel}</span>
        </div>

        <button
          type="button"
          className="mg-node-panel__close"
          onClick={onClose}
          aria-label="Close node details panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* AI RISK SCORE & TREND */}
      <div className="mg-node-panel__risk-card">
        <div className="mg-node-panel__risk-lead">
          <span className="mg-node-panel__risk-lbl">AI INSTABILITY RISK SCORE</span>
          <div className="mg-node-panel__trend-tag">
            <TrendingUp size={12} />
            <span>{node.riskTrend}</span>
          </div>
        </div>

        <div className="mg-node-panel__score-row">
          <span className="mg-node-panel__score mono-telemetry">{node.aiRiskScore}</span>
          <span className="mg-node-panel__score-denom">/ 100</span>
        </div>

        <Progress
          value={node.aiRiskScore}
          variant={
            node.aiRiskScore >= 75
              ? 'critical'
              : node.aiRiskScore >= 50
              ? 'high_risk'
              : node.aiRiskScore >= 25
              ? 'warning'
              : 'normal'
          }
          size="sm"
        />
      </div>

      {/* SENSOR TELEMETRY METRICS */}
      <div className="mg-node-panel__section">
        <span className="mg-node-panel__sec-title">PHYSICAL SENSOR TELEMETRY</span>
        {!node.hasReadings && node.isOnline && (
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            No telemetry readings received yet for this node.
          </p>
        )}
        <div className="mg-node-panel__metrics-grid">
          {/* Tilt */}
          <div className="mg-node-panel__metric">
            <span className="mg-node-panel__m-lbl">
              <Compass size={13} /> TILT
            </span>
            <span className="mg-node-panel__m-val mono-telemetry">
              {!node.isOnline ? '—' : node.hasReadings ? `${node.tiltDeg.toFixed(2)}°` : '—'}
            </span>
          </div>

          {/* Displacement */}
          <div className="mg-node-panel__metric">
            <span className="mg-node-panel__m-lbl">
              <MoveHorizontal size={13} /> DISPLACEMENT
            </span>
            <span className="mg-node-panel__m-val mono-telemetry">
              {!node.isOnline ? '—' : node.hasReadings ? `${node.displacementMm.toFixed(1)} mm` : '—'}
            </span>
          </div>

          {/* Vibration */}
          <div className="mg-node-panel__metric">
            <span className="mg-node-panel__m-lbl">
              <Activity size={13} /> VIBRATION
            </span>
            <span className="mg-node-panel__m-val mono-telemetry">
              {!node.isOnline ? '—' : node.hasReadings ? `${node.vibrationMmS.toFixed(2)} mm/s` : '—'}
            </span>
          </div>

          {/* Crack Width */}
          <div className="mg-node-panel__metric">
            <span className="mg-node-panel__m-lbl">
              <Split size={13} /> CRACK APERTURE
            </span>
            <span className="mg-node-panel__m-val mono-telemetry">
              {!node.isOnline ? '—' : node.hasReadings ? `${node.crackWidthMm.toFixed(2)} mm` : '—'}
            </span>
          </div>

          {/* Soil Moisture */}
          <div className="mg-node-panel__metric">
            <span className="mg-node-panel__m-lbl">
              <Droplets size={13} /> SOIL MOISTURE
            </span>
            <span className="mg-node-panel__m-val mono-telemetry">
              {!node.isOnline ? '—' : node.hasReadings ? `${node.moisturePct.toFixed(1)}%` : '—'}
            </span>
          </div>

          {/* Temperature */}
          <div className="mg-node-panel__metric">
            <span className="mg-node-panel__m-lbl">
              <Thermometer size={13} /> TEMPERATURE
            </span>
            <span className="mg-node-panel__m-val mono-telemetry">
              {!node.isOnline ? '—' : node.hasReadings ? `${node.temperatureC.toFixed(1)}°C` : '—'}
            </span>
          </div>
        </div>

        {/* Gas Condition */}
        <div className="mg-node-panel__gas-row">
          <span className="mg-node-panel__m-lbl">
            <Wind size={13} /> GAS STATUS
          </span>
          <span className="mg-node-panel__gas-val mono-telemetry">
            {!node.isOnline ? '—' : node.hasReadings ? node.gasStatus : '—'}
          </span>
        </div>
      </div>

      {/* HARDWARE HEALTH & LINK */}
      <div className="mg-node-panel__section">
        <span className="mg-node-panel__sec-title">HARDWARE & LORA LINK</span>
        <div className="mg-node-panel__hw-grid">
          <div className="mg-node-panel__hw-item">
            <Battery size={13} className="mg-node-panel__hw-icon" />
            <span>Battery: <strong className="mono-telemetry">—</strong></span>
          </div>
          <div className="mg-node-panel__hw-item">
            <Wifi size={13} className="mg-node-panel__hw-icon" />
            <span>RSSI: <strong className="mono-telemetry">—</strong></span>
          </div>
          <div className="mg-node-panel__hw-item">
            <Radio size={13} className="mg-node-panel__hw-icon" />
            <span>Link: <strong>{node.isOnline ? 'Online' : 'Offline'}</strong></span>
          </div>
          <div className="mg-node-panel__hw-item">
            <span>Sync: <span className="mono-telemetry">{node.lastUpdated}</span></span>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
          Battery % and LoRa RSSI are not tracked by the backend API (Phases 0–10).
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mg-node-panel__actions">
        <Button
          variant={isAcknowledged ? 'secondary' : 'warning'}
          size="sm"
          leftIcon={<ShieldCheck size={14} />}
          onClick={() => setIsAcknowledged(true)}
          disabled={isAcknowledged}
        >
          {isAcknowledged ? 'Anomaly Acknowledged' : 'Acknowledge Anomaly'}
        </Button>

        <Button
          variant="primary"
          size="sm"
          rightIcon={<ArrowUpRight size={14} />}
          onClick={() => navigate('/nodes')}
        >
          View Node Details
        </Button>
      </div>
    </aside>
  );
};
