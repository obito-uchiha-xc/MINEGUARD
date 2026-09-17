import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { MapNode } from '../../data/mock/nodes';
import type { SafetyStatus } from '../../types/safety';
import type { MapLayerState } from './MapToolbar';
import './InteractiveMineCanvas.css';

export interface InteractiveMineCanvasProps {
  nodes: MapNode[];
  selectedNode: MapNode | null;
  onSelectNode: (node: MapNode | null) => void;
  statusFilter: SafetyStatus | 'ALL';
  riskView: 'ALL' | 'NORMAL' | 'ELEVATED' | 'HIGH_RISK' | 'CRITICAL';
  searchQuery: string;
  layers: MapLayerState;
  zoom: number;
  panOffset: { x: number; y: number };
  onPanChange: (newOffset: { x: number; y: number }) => void;
  onZoomChange: (newZoom: number) => void;
}

export const InteractiveMineCanvas: React.FC<InteractiveMineCanvasProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  statusFilter,
  riskView,
  searchQuery,
  layers,
  zoom,
  panOffset,
  onPanChange,
  onZoomChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan on left click on background
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      onPanChange({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart, onPanChange]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.5, Math.max(0.7, zoom * zoomFactor));
    onZoomChange(newZoom);
  };

  // Check if a node matches search and filter criteria
  const isNodeMatching = (node: MapNode): boolean => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        node.id.toLowerCase().includes(q) ||
        node.name.toLowerCase().includes(q) ||
        node.zone.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    if (statusFilter !== 'ALL' && node.status !== statusFilter) {
      return false;
    }

    if (riskView !== 'ALL') {
      if (riskView === 'NORMAL' && node.status !== 'NORMAL') return false;
      if (riskView === 'ELEVATED' && node.status !== 'WARNING') return false;
      if (riskView === 'HIGH_RISK' && node.status !== 'HIGH_RISK') return false;
      if (riskView === 'CRITICAL' && node.status !== 'CRITICAL') return false;
    }

    return true;
  };

  return (
    <div
      ref={containerRef}
      className={`mg-gis-canvas ${isDragging ? 'is-dragging' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      role="region"
      aria-label="Interactive Mine GIS Map"
    >
      {/* MAP TRANSFORM WRAPPER */}
      <div
        className="mg-gis-canvas__transform-layer"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
        }}
      >
        {/* SVG CARTOGRAPHIC LAYERS */}
        <svg
          className="mg-gis-canvas__svg-layer"
          viewBox="0 0 1000 640"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* GIS Topographic Grid */}
            <pattern id="gis-grid-minor" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(203, 213, 225, 0.5)" strokeWidth="0.5" />
            </pattern>
            <pattern id="gis-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#gis-grid-minor)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(2, 132, 199, 0.2)" strokeWidth="0.8" />
            </pattern>

            {/* Spatial Risk Heat Gradients */}
            <radialGradient id="heat-stope4b" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.38)" />
              <stop offset="45%" stopColor="rgba(249, 115, 22, 0.22)" />
              <stop offset="85%" stopColor="rgba(250, 204, 21, 0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            <radialGradient id="heat-deepdrift" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(249, 115, 22, 0.32)" />
              <stop offset="60%" stopColor="rgba(250, 204, 21, 0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            <radialGradient id="heat-incline" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(250, 204, 21, 0.25)" />
              <stop offset="70%" stopColor="rgba(34, 197, 94, 0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* BACKGROUND GRID */}
          <rect width="1000" height="640" fill="#f8fafc" />
          <rect width="1000" height="640" fill="url(#gis-grid-major)" />

          {/* LAYER 1: MINE BOUNDARY */}
          {layers.mineBoundary && (
            <g className="mg-layer-boundary">
              <polygon
                points="60,80 340,60 760,90 940,240 920,540 680,590 320,580 80,480"
                fill="none"
                stroke="rgba(59, 130, 246, 0.45)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <text x="75" y="100" fill="#718096" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.08em">
                MINE CONCESSION BOUNDARY &bull; SECTOR 4 LEASE
              </text>
            </g>
          )}

          {/* LAYER 2: MINING PANELS */}
          {layers.miningPanels && (
            <g className="mg-layer-panels">
              {/* Panel A: Haulage North */}
              <polygon
                points="90,100 360,80 360,260 90,260"
                fill="rgba(2, 132, 199, 0.04)"
                stroke="rgba(203, 213, 225, 0.8)"
                strokeWidth="1.2"
              />
              <text x="105" y="125" fill="#475569" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">
                PANEL A &mdash; MAIN HAULAGE
              </text>

              {/* Panel B: Stope 4B */}
              <polygon
                points="360,80 720,110 720,340 360,340"
                fill="rgba(239, 68, 68, 0.04)"
                stroke="rgba(249, 115, 22, 0.45)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text x="380" y="115" fill="#ea580c" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                PANEL B &mdash; PRODUCTION STOPE 4B [ELEVATED DEFORMATION]
              </text>

              {/* Panel C: East Incline */}
              <polygon
                points="720,110 910,240 890,440 720,380"
                fill="rgba(2, 132, 199, 0.04)"
                stroke="rgba(203, 213, 225, 0.8)"
                strokeWidth="1.2"
              />
              <text x="740" y="150" fill="#475569" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">
                PANEL C &mdash; EAST INCLINE
              </text>

              {/* Panel D: Deep Drift */}
              <polygon
                points="420,340 720,340 700,560 420,560"
                fill="rgba(249, 115, 22, 0.04)"
                stroke="rgba(203, 213, 225, 0.8)"
                strokeWidth="1.2"
              />
              <text x="440" y="365" fill="#475569" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">
                PANEL D &mdash; DEEP DRIFT SOUTH
              </text>

              {/* Panel E: Lower Sump & Intake */}
              <polygon
                points="110,260 420,260 420,560 110,460"
                fill="rgba(2, 132, 199, 0.04)"
                stroke="rgba(203, 213, 225, 0.8)"
                strokeWidth="1.2"
              />
              <text x="130" y="285" fill="#475569" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">
                PANEL E &mdash; DRAINAGE SUMP & AIRWAY
              </text>
            </g>
          )}

          {/* SUBTERRANEAN DRIFTS & ADITS NETWORK */}
          <g className="mg-layer-drifts">
            {/* Primary Haulage Trunk */}
            <path
              d="M 120 180 L 320 160 L 580 220 L 800 240 L 880 340"
              fill="none"
              stroke="rgba(203, 213, 225, 0.6)"
              strokeWidth="28"
              strokeLinecap="round"
            />
            <path
              d="M 120 180 L 320 160 L 580 220 L 800 240 L 880 340"
              fill="none"
              stroke="rgba(2, 132, 199, 0.45)"
              strokeWidth="2"
              strokeDasharray="8 6"
            />

            {/* South Stope Access Incline */}
            <path
              d="M 320 160 L 360 420 L 620 480 L 780 440"
              fill="none"
              stroke="rgba(203, 213, 225, 0.5)"
              strokeWidth="20"
              strokeLinecap="round"
            />

            {/* Crosscut Rib 3 & Ventilation Raise */}
            <path
              d="M 580 220 L 560 470"
              fill="none"
              stroke="rgba(239, 68, 68, 0.35)"
              strokeWidth="22"
              strokeLinecap="round"
            />
            <path
              d="M 440 200 L 460 440"
              fill="none"
              stroke="rgba(170, 182, 196, 0.2)"
              strokeWidth="16"
              strokeLinecap="round"
            />
          </g>

          {/* LAYER 4: SPATIAL RISK HEAT ZONES OVERLAY */}
          {layers.riskZones && (
            <g className="mg-layer-risk-heat">
              {/* Critical Risk Center (Stope 4B around N04 & N05) */}
              <circle cx="610" cy="245" r="130" fill="url(#heat-stope4b)" />
              <ellipse cx="610" cy="245" rx="125" ry="90" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.2" strokeDasharray="5 5" />
              <text x="540" y="195" fill="var(--color-critical)" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
                CRITICAL ANOMALY: ZONE B2 (+0.95 mm/hr)
              </text>

              {/* High Risk Center (Deep Drift around N16 & N21) */}
              <circle cx="580" cy="480" r="100" fill="url(#heat-deepdrift)" />
              <ellipse cx="580" cy="480" rx="95" ry="70" fill="none" stroke="rgba(249, 115, 22, 0.35)" strokeWidth="1.2" strokeDasharray="5 5" />

              {/* Warning Risk Center (East Incline around N11) */}
              <circle cx="780" cy="310" r="75" fill="url(#heat-incline)" />
            </g>
          )}

          {/* LAYER 6: SENSOR COVERAGE RADII */}
          {layers.coverageRadii && (
            <g className="mg-layer-coverage">
              {nodes.map((node) => {
                if (!node.isOnline) return null;
                const r = (node.coverageRadiusM || 40) * 1.1;
                return (
                  <circle
                    key={`cov-${node.id}`}
                    cx={node.xPct * 10}
                    cy={node.yPct * 6.4}
                    r={r}
                    fill="rgba(59, 130, 246, 0.04)"
                    stroke="rgba(59, 130, 246, 0.2)"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* LAYER 5: SENSOR NODE DOM MARKERS */}
        {layers.sensorNodes && (
          <div className="mg-gis-canvas__nodes-layer">
            {nodes.map((node) => {
              const matches = isNodeMatching(node);
              const isSelected = selectedNode?.id === node.id;
              const isCritical = node.status === 'CRITICAL';
              const isHighRisk = node.status === 'HIGH_RISK';

              return (
                <motion.button
                  key={node.id}
                  type="button"
                  className={`mg-gis-node-pin mg-gis-node-pin--${node.status.toLowerCase()} ${
                    !matches ? 'is-muted' : ''
                  } ${isSelected ? 'is-selected' : ''} ${isCritical ? 'is-critical-pulse' : ''}`}
                  style={{
                    left: `${node.xPct}%`,
                    top: `${node.yPct}%`,
                  }}
                  whileHover={{ scale: 1.18 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node);
                  }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  aria-label={`Node ${node.id}: ${node.name} (${node.status})`}
                >
                  {/* Subtle Risk Indicator Ring */}
                  {(isCritical || isHighRisk) && (
                    <span className="mg-gis-node-pin__risk-ring" aria-hidden="true" />
                  )}

                  {/* Marker Core */}
                  <span className="mg-gis-node-pin__core">
                    <span className="mg-gis-node-pin__center-dot" />
                  </span>

                  {/* Compact Label */}
                  <span className="mg-gis-node-pin__label mono-telemetry">{node.id}</span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* HOVER TOOLTIP */}
        {hoveredNode && !isDragging && (
          <div
            className="mg-gis-tooltip"
            style={{
              left: `${hoveredNode.xPct}%`,
              top: `${hoveredNode.yPct}%`,
            }}
            role="tooltip"
          >
            <div className="mg-gis-tooltip__lead">
              <span className="mg-gis-tooltip__id mono-telemetry">{hoveredNode.id}</span>
              <span className={`mg-gis-tooltip__status mg-gis-tooltip__status--${hoveredNode.status.toLowerCase()}`}>
                {hoveredNode.status.replace('_', ' ')}
              </span>
            </div>
            <div className="mg-gis-tooltip__row">
              <span>Tilt: <strong className="mono-telemetry">{hoveredNode.tiltDeg}°</strong></span>
              <span>Disp: <strong className="mono-telemetry">{hoveredNode.displacementMm} mm</strong></span>
            </div>
            <div className="mg-gis-tooltip__zone">{hoveredNode.zone} &bull; {hoveredNode.panel}</div>
          </div>
        )}
      </div>

      {/* COMPACT MAP NAVIGATION HUD HINT */}
      <div className="mg-gis-canvas__hud-hint">
        <span>Click &amp; drag to pan &bull; Scroll to zoom &bull; Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};
