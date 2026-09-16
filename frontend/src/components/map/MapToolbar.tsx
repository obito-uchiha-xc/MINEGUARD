import React, { useState } from 'react';
import {
  Search,
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Check,
  Flame,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { Button } from '../ui/Button';
import type { SafetyStatus } from '../../types/safety';
import './MapToolbar.css';

export interface MapLayerState {
  mineBoundary: boolean;
  miningPanels: boolean;
  sensorNodes: boolean;
  riskZones: boolean;
  monitoringZones: boolean;
  coverageRadii: boolean;
}

export interface MapToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: SafetyStatus | 'ALL';
  onStatusFilterChange: (status: SafetyStatus | 'ALL') => void;
  riskView: 'ALL' | 'NORMAL' | 'ELEVATED' | 'HIGH_RISK' | 'CRITICAL';
  onRiskViewChange: (rv: 'ALL' | 'NORMAL' | 'ELEVATED' | 'HIGH_RISK' | 'CRITICAL') => void;
  layers: MapLayerState;
  onToggleLayer: (layerKey: keyof MapLayerState) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  riskView,
  onRiskViewChange,
  layers,
  onToggleLayer,
  onZoomIn,
  onZoomOut,
  onResetView,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isRiskMenuOpen, setIsRiskMenuOpen] = useState(false);

  return (
    <div className="mg-map-toolbar">
      {/* SEARCH NODE */}
      <div className="mg-map-toolbar__search">
        <Search size={15} className="mg-map-toolbar__search-icon" />
        <input
          type="text"
          placeholder="Search node (e.g. N04, N16)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mg-map-toolbar__search-input"
          aria-label="Search sensor node"
        />
        {searchQuery && (
          <button
            type="button"
            className="mg-map-toolbar__search-clear"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      <div className="mg-map-toolbar__actions">
        {/* STATUS FILTER DROPDOWN */}
        <div className="mg-map-toolbar__popover-wrap">
          <Button
            variant={statusFilter !== 'ALL' ? 'primary' : 'secondary'}
            size="sm"
            leftIcon={<Filter size={13} />}
            onClick={() => {
              setIsFilterMenuOpen(!isFilterMenuOpen);
              setIsLayerMenuOpen(false);
              setIsRiskMenuOpen(false);
            }}
          >
            Status: {statusFilter === 'ALL' ? 'All' : statusFilter.replace('_', ' ')}
          </Button>

          {isFilterMenuOpen && (
            <>
              <div
                className="mg-map-toolbar__backdrop"
                onClick={() => setIsFilterMenuOpen(false)}
              />
              <div className="mg-map-toolbar__menu" role="menu">
                <span className="mg-map-toolbar__menu-title">Filter by Node Health</span>
                {(['ALL', 'NORMAL', 'WARNING', 'HIGH_RISK', 'CRITICAL', 'OFFLINE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`mg-map-toolbar__menu-item ${statusFilter === st ? 'is-active' : ''}`}
                    onClick={() => {
                      onStatusFilterChange(st);
                      setIsFilterMenuOpen(false);
                    }}
                  >
                    <span>{st === 'ALL' ? 'All Nodes' : st.replace('_', ' ')}</span>
                    {statusFilter === st && <Check size={14} className="mg-map-toolbar__check" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* RISK VIEW FILTER */}
        <div className="mg-map-toolbar__popover-wrap">
          <Button
            variant={riskView !== 'ALL' ? 'warning' : 'secondary'}
            size="sm"
            leftIcon={<Flame size={13} />}
            onClick={() => {
              setIsRiskMenuOpen(!isRiskMenuOpen);
              setIsLayerMenuOpen(false);
              setIsFilterMenuOpen(false);
            }}
          >
            Risk View: {riskView === 'ALL' ? 'All' : riskView.replace('_', ' ')}
          </Button>

          {isRiskMenuOpen && (
            <>
              <div
                className="mg-map-toolbar__backdrop"
                onClick={() => setIsRiskMenuOpen(false)}
              />
              <div className="mg-map-toolbar__menu" role="menu">
                <span className="mg-map-toolbar__menu-title">Highlight Risk Tier</span>
                {(['ALL', 'NORMAL', 'ELEVATED', 'HIGH_RISK', 'CRITICAL'] as const).map((rv) => (
                  <button
                    key={rv}
                    type="button"
                    className={`mg-map-toolbar__menu-item ${riskView === rv ? 'is-active' : ''}`}
                    onClick={() => {
                      onRiskViewChange(rv);
                      setIsRiskMenuOpen(false);
                    }}
                  >
                    <span>{rv === 'ALL' ? 'All Risk Levels' : rv.replace('_', ' ')}</span>
                    {riskView === rv && <Check size={14} className="mg-map-toolbar__check" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* MAP LAYERS POPOVER */}
        <div className="mg-map-toolbar__popover-wrap">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Layers size={13} />}
            onClick={() => {
              setIsLayerMenuOpen(!isLayerMenuOpen);
              setIsFilterMenuOpen(false);
              setIsRiskMenuOpen(false);
            }}
          >
            Layers
          </Button>

          {isLayerMenuOpen && (
            <>
              <div
                className="mg-map-toolbar__backdrop"
                onClick={() => setIsLayerMenuOpen(false)}
              />
              <div className="mg-map-toolbar__menu mg-map-toolbar__menu--layers" role="menu">
                <span className="mg-map-toolbar__menu-title">GIS Display Layers</span>
                <label className="mg-map-toolbar__layer-toggle">
                  <input
                    type="checkbox"
                    checked={layers.mineBoundary}
                    onChange={() => onToggleLayer('mineBoundary')}
                  />
                  <span>Mine Boundary</span>
                </label>
                <label className="mg-map-toolbar__layer-toggle">
                  <input
                    type="checkbox"
                    checked={layers.miningPanels}
                    onChange={() => onToggleLayer('miningPanels')}
                  />
                  <span>Mining Panels (A-E)</span>
                </label>
                <label className="mg-map-toolbar__layer-toggle">
                  <input
                    type="checkbox"
                    checked={layers.monitoringZones}
                    onChange={() => onToggleLayer('monitoringZones')}
                  />
                  <span>Monitoring Zones</span>
                </label>
                <label className="mg-map-toolbar__layer-toggle">
                  <input
                    type="checkbox"
                    checked={layers.riskZones}
                    onChange={() => onToggleLayer('riskZones')}
                  />
                  <span>Spatial Risk Overlays</span>
                </label>
                <label className="mg-map-toolbar__layer-toggle">
                  <input
                    type="checkbox"
                    checked={layers.sensorNodes}
                    onChange={() => onToggleLayer('sensorNodes')}
                  />
                  <span>Sensor Nodes (N01-N25)</span>
                </label>
                <label className="mg-map-toolbar__layer-toggle">
                  <input
                    type="checkbox"
                    checked={layers.coverageRadii}
                    onChange={() => onToggleLayer('coverageRadii')}
                  />
                  <span>Sensor Coverage Radii</span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* MAP NAVIGATION CONTROLS */}
        <div className="mg-map-toolbar__group">
          <IconButton
            icon={<ZoomIn size={15} />}
            aria-label="Zoom in"
            onClick={onZoomIn}
            size="sm"
            variant="secondary"
          />
          <IconButton
            icon={<ZoomOut size={15} />}
            aria-label="Zoom out"
            onClick={onZoomOut}
            size="sm"
            variant="secondary"
          />
          <IconButton
            icon={<RotateCcw size={14} />}
            aria-label="Reset map view"
            onClick={onResetView}
            size="sm"
            variant="secondary"
          />
          <IconButton
            icon={isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Expanded map view'}
            onClick={onToggleFullscreen}
            size="sm"
            variant={isFullscreen ? 'primary' : 'secondary'}
          />
        </div>
      </div>
    </div>
  );
};
