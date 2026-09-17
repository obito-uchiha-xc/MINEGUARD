import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowUpRight, Radio } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { MapNode } from '../../data/mock/nodes';
import './LiveMineMap.css';

export interface LiveMineMapProps {
  nodes: MapNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

export const LiveMineMap: React.FC<LiveMineMapProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
}) => {
  const navigate = useNavigate();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="mg-mine-map">
      {/* MAP HEADER / TOOLBAR */}
      <div className="mg-mine-map__header">
        <div className="mg-mine-map__title-group">
          <div className="mg-mine-map__status-dot animate-subtle-pulse" />
          <h3 className="mg-mine-map__title">LIVE MINE MAP</h3>
          <span className="mg-mine-map__depth mono-telemetry">LEVEL -320M</span>
          <span className="mg-mine-map__node-count mono-telemetry">12 Probes</span>
        </div>

        {/* MAP LEGEND & FULL VIEW LINK */}
        <div className="mg-mine-map__controls">
          <div className="mg-mine-map__legend">
            <span className="mg-mine-map__legend-item">
              <span className="mg-mine-map__legend-dot mg-mine-map__legend-dot--normal" />
              Normal
            </span>
            <span className="mg-mine-map__legend-item">
              <span className="mg-mine-map__legend-dot mg-mine-map__legend-dot--warning" />
              Warning
            </span>
            <span className="mg-mine-map__legend-item">
              <span className="mg-mine-map__legend-dot mg-mine-map__legend-dot--critical" />
              Critical
            </span>
          </div>

          <button
            type="button"
            className="mg-mine-map__expand-btn"
            onClick={() => navigate('/live-map')}
            title="Open Interactive Full GIS Mine Map"
          >
            <span>Full Map</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* MAP CANVAS / TOPOGRAPHY VIEW */}
      <div className="mg-mine-map__viewport" onClick={() => onSelectNode(null)}>
        {/* SVG Topographic & Underground Mine Gallery Background */}
        <svg
          className="mg-mine-map__svg-grid"
          viewBox="0 0 800 480"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <pattern id="mine-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(203, 213, 225, 0.6)" strokeWidth="0.8" />
            </pattern>
            <radialGradient id="hazard-gradient" cx="62%" cy="44%" r="28%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.18)" />
              <stop offset="50%" stopColor="rgba(249, 115, 22, 0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Grid Background */}
          <rect width="100%" height="100%" fill="url(#mine-grid)" />

          {/* Hazard Influence Zone (Zone B2 / Stope 4B) */}
          <circle cx="500" cy="205" r="110" fill="url(#hazard-gradient)" />
          <ellipse cx="500" cy="205" rx="105" ry="75" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeDasharray="4 4" />

          {/* Subterranean Drift Galleries / Adits */}
          {/* Main Haulage Drift */}
          <path
            d="M 60 120 L 260 130 L 420 180 L 580 200 L 740 190"
            fill="none"
            stroke="rgba(170, 182, 196, 0.22)"
            strokeWidth="24"
            strokeLinecap="round"
          />
          <path
            d="M 60 120 L 260 130 L 420 180 L 580 200 L 740 190"
            fill="none"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />

          {/* South Production Stope Crosscuts */}
          <path
            d="M 260 130 L 280 320 L 560 380 L 700 360"
            fill="none"
            stroke="rgba(170, 182, 196, 0.18)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M 420 180 L 450 340"
            fill="none"
            stroke="rgba(170, 182, 196, 0.18)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 580 200 L 550 370"
            fill="none"
            stroke="rgba(239, 68, 68, 0.25)"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Incline Ventilation Shaft */}
          <path
            d="M 580 200 L 720 280 L 750 420"
            fill="none"
            stroke="rgba(170, 182, 196, 0.15)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Sector Boundary Labels */}
          <text x="70" y="90" fill="#718096" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.06em">
            ZONE A &bull; MAIN HAULAGE
          </text>
          <text x="480" y="285" textAnchor="middle" fill="#fb923c" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="0.06em">
            ZONE B2 &bull; STOPE 4B [HIGH RISK]
          </text>
          <text x="630" y="310" fill="#718096" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.06em">
            ZONE C &bull; EAST INCLINE
          </text>
          <text x="290" y="420" fill="#718096" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.06em">
            ZONE D &bull; LOWER RETURN
          </text>
        </svg>

        {/* SPATIAL SENSOR NODE MARKERS */}
        <div className="mg-mine-map__nodes-layer">
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isCritical = node.status === 'CRITICAL';
            const isHighRisk = node.status === 'HIGH_RISK';

            return (
              <button
                key={node.id}
                type="button"
                className={`mg-node-pin mg-node-pin--${node.status.toLowerCase()} ${
                  isSelected ? 'is-selected' : ''
                } ${isCritical ? 'is-critical-pulse' : ''}`}
                style={{ left: `${node.xPct}%`, top: `${node.yPct}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id);
                }}
                aria-label={`Node ${node.id}: ${node.name} (${node.status})`}
                title={`${node.id} • ${node.status}`}
              >
                {(isCritical || isHighRisk) && (
                  <span className="mg-node-pin__risk-ring" aria-hidden="true" />
                )}
                <span className="mg-node-pin__core">
                  <span className="mg-node-pin__dot" />
                </span>
                <span className="mg-node-pin__label mono-telemetry">{node.id}</span>
              </button>
            );
          })}
        </div>

        {/* NODE INFORMATION FLYOUT CARD */}
        {selectedNode && (
          <div
            className="mg-node-popup"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Node ${selectedNode.id} Telemetry`}
          >
            <div className="mg-node-popup__header">
              <div className="mg-node-popup__title-group">
                <div className="mg-node-popup__id-row">
                  <span className="mg-node-popup__id mono-telemetry">{selectedNode.id}</span>
                  <Badge status={selectedNode.status} dot>
                    {selectedNode.status.replace('_', ' ')}
                  </Badge>
                </div>
                <h4 className="mg-node-popup__name">{selectedNode.name}</h4>
                <span className="mg-node-popup__zone">{selectedNode.zone}</span>
              </div>
              <button
                type="button"
                className="mg-node-popup__close"
                onClick={() => onSelectNode(null)}
                aria-label="Close node telemetry dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mg-node-popup__grid">
              <div className="mg-node-popup__metric">
                <span className="mg-node-popup__lbl">TILT (MPU6500)</span>
                <span className="mg-node-popup__val mono-telemetry">{selectedNode.tiltDeg}°</span>
              </div>
              <div className="mg-node-popup__metric">
                <span className="mg-node-popup__lbl">DISPLACEMENT</span>
                <span className="mg-node-popup__val mono-telemetry">{selectedNode.displacementMm} mm</span>
              </div>
              <div className="mg-node-popup__metric">
                <span className="mg-node-popup__lbl">VIBRATION</span>
                <span className="mg-node-popup__val mono-telemetry">{selectedNode.vibrationLevel} ({selectedNode.vibrationMmS} mm/s)</span>
              </div>
              <div className="mg-node-popup__metric">
                <span className="mg-node-popup__lbl">CRACK WIDTH</span>
                <span className="mg-node-popup__val mono-telemetry">{selectedNode.crackWidthMm} mm</span>
              </div>
              <div className="mg-node-popup__metric">
                <span className="mg-node-popup__lbl">TEMPERATURE</span>
                <span className="mg-node-popup__val mono-telemetry">{selectedNode.temperatureC} °C</span>
              </div>
              <div className="mg-node-popup__metric">
                <span className="mg-node-popup__lbl">SOIL MOISTURE</span>
                <span className="mg-node-popup__val mono-telemetry">{selectedNode.moisturePct}%</span>
              </div>
              <div className="mg-node-popup__metric">
                <span className="mg-node-popup__lbl">BATTERY</span>
                <span className="mg-node-popup__val mono-telemetry">{selectedNode.batteryPct}%</span>
              </div>
              <div className="mg-node-popup__metric">
                <span className="mg-node-popup__lbl">AI RISK SCORE</span>
                <span className="mg-node-popup__val mono-telemetry" style={{ color: selectedNode.aiRiskScore > 70 ? 'var(--color-critical)' : 'inherit' }}>
                  {selectedNode.aiRiskScore} / 100
                </span>
              </div>
            </div>

            <div className="mg-node-popup__footer">
              <div className="mg-node-popup__link-meta">
                <Radio size={12} className="mg-node-popup__radio-icon" />
                <span className="mono-telemetry">RSSI: {selectedNode.rssiDbm} dBm &bull; {selectedNode.isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowUpRight size={13} />}
                onClick={() => navigate('/nodes')}
              >
                View Details
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
