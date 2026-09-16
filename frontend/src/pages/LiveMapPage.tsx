import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { Button } from '../components/ui/Button';
import { AlertBanner } from '../components/feedback/AlertBanner';
import { MapToolbar } from '../components/map/MapToolbar';
import type { MapLayerState } from '../components/map/MapToolbar';
import { InteractiveMineCanvas } from '../components/map/InteractiveMineCanvas';
import { NodeDetailsPanel } from '../components/map/NodeDetailsPanel';
import { MapSummaryBar } from '../components/map/MapSummaryBar';
import { MapLegend } from '../components/map/MapLegend';
import type { MapNode } from '../data/mock/nodes';
import type { SafetyStatus } from '../types/safety';
import { nodesService } from '../services/nodesService';
import { adaptNodeSummaryToMapNode } from '../services/adapters/nodeAdapter';
import { getErrorMessage } from '../api/errors';
import { API_CONFIG } from '../api/config';
import { RefreshCw } from 'lucide-react';
import './LiveMapPage.css';

export const LiveMapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const nodeFromUrl = searchParams.get('node');

  // Shared node dataset populated strictly from real backend
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Derive selected node: active selection takes precedence, otherwise URL param, default 'N04'
  const selectedNodeId = activeNodeId !== null ? activeNodeId : (nodeFromUrl || 'N04');
  const setSelectedNodeId = (id: string | null) => setActiveNodeId(id);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<SafetyStatus | 'ALL'>('ALL');
  const [riskView, setRiskView] = useState<'ALL' | 'NORMAL' | 'ELEVATED' | 'HIGH_RISK' | 'CRITICAL'>('ALL');

  // Layers
  const [layers, setLayers] = useState<MapLayerState>({
    mineBoundary: true,
    miningPanels: true,
    sensorNodes: true,
    riskZones: true,
    monitoringZones: true,
    coverageRadii: false,
  });

  // Pan & Zoom
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live timestamp
  const [lastUpdated, setLastUpdated] = useState<string>('10:24:36 AM');

  // Load real node data from backend API
  const loadNodes = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const backendNodes = await nodesService.listNodes();
      if (backendNodes && backendNodes.length > 0) {
        const adapted = backendNodes.map((n) => adaptNodeSummaryToMapNode(n));
        setNodes(adapted);
        setIsLiveBackend(true);
      } else {
        setNodes([]);
        setIsLiveBackend(true);
      }
      setLastUpdated(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Backend unavailable.'));
      setNodes([]);
      setIsLiveBackend(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load without synchronous setState in effect body
  useEffect(() => {
    let active = true;
    nodesService
      .listNodes()
      .then((backendNodes) => {
        if (!active) return;
        if (backendNodes && backendNodes.length > 0) {
          setNodes(backendNodes.map((n) => adaptNodeSummaryToMapNode(n)));
          setIsLiveBackend(true);
        } else {
          setNodes([]);
          setIsLiveBackend(true);
        }
        setLastUpdated(
          new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
        );
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err, 'Backend unavailable.'));
        setNodes([]);
        setIsLiveBackend(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Derive active selected node object directly during render
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) || null : null;

  // Clock heartbeat update interval
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      const matched = nodes.find(
        (n) => n.id.toLowerCase() === q.trim().toLowerCase()
      );
      if (matched) {
        setSelectedNodeId(matched.id);
      }
    }
  };

  const handleToggleLayer = (layerKey: keyof MapLayerState) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(2.5, z + 0.25));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.7, z - 0.25));
  };

  return (
    <PageContainer
      maxWidth="wide"
      className={`mg-live-map-page ${isFullscreen ? 'is-fullscreen-mode' : ''}`}
    >
      {/* PAGE HEADER */}
      <PageHeader
        title="Live Mine Map"
        subtitle="Real-time spatial monitoring of the mine surface sensor network and subterranean geotechnical deformation."
        badge={
          <div className="mg-live-map-page__header-badge">
            <StatusIndicator
              status={isLiveBackend ? 'LIVE' : 'WARNING'}
              size="sm"
              customLabel={isLiveBackend ? 'Backend Connected' : 'Simulated Mesh'}
            />
            <span className="mg-live-map-page__sync mono-telemetry">
              Last updated: {lastUpdated}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '2px 6px',
              }}
            >
              ⚠ Illustrative Schematic — Positions are approximate
            </span>
          </div>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={loadNodes}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Polling Mesh...' : 'Poll Mesh'}
          </Button>
        }
      />

      {/* OFFLINE / FALLBACK NOTIFICATION BANNER */}
      {error && (
        <div style={{ marginBottom: '16px' }}>
          <AlertBanner
            severity={API_CONFIG.enableMockFallback ? 'warning' : 'critical'}
            title="Backend Disconnected"
            message={
              API_CONFIG.enableMockFallback
                ? `${error} — Showing simulated spatial telemetry (Development Fallback Mode).`
                : `${error} — Unable to load live spatial nodes from backend API.`
            }
            action={
              <Button variant="secondary" size="sm" onClick={loadNodes}>
                Retry Connection
              </Button>
            }
          />
        </div>
      )}

      {/* DYNAMIC MAP SUMMARY BAR */}
      <MapSummaryBar nodes={nodes} />

      {/* ACTIVE TARP 3 EXCLUSION ZONE BARRICADE BANNER — only shown when backend nodes are live */}
      {isLiveBackend && nodes.some((n) => n.status === 'CRITICAL') && (
        <div className="mg-live-map__exclusion-banner">
          <div className="mg-exclusion-banner__left">
            <span className="mg-exclusion-banner__pulse-dot" />
            <div className="mg-exclusion-banner__text">
              <strong>ELEVATED RISK ZONE:</strong> One or more nodes are reporting CRITICAL status.
              Verify perimeter safety and consult the node details panel.
            </div>
          </div>
          <div className="mg-exclusion-banner__actions">
            <button
              type="button"
              className="mg-exclusion-btn"
              onClick={() => {
                const criticalNode = nodes.find((n) => n.status === 'CRITICAL');
                if (criticalNode) setSelectedNodeId(criticalNode.id);
              }}
            >
              Inspect Critical Node
            </button>
          </div>
        </div>
      )}

      {/* GIS MAP CONTAINER WITH TOOLBAR & DETAILS PANEL */}
      <div className="mg-live-map-page__workspace">
        {/* TOOLBAR */}
        <MapToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          riskView={riskView}
          onRiskViewChange={setRiskView}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />

        {/* MAP & FLOATING PANEL STAGE */}
        <div className="mg-live-map-page__stage">
          <div className="mg-live-map-page__canvas-wrapper">
            <InteractiveMineCanvas
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={(node) => setSelectedNodeId(node ? node.id : null)}
              statusFilter={statusFilter}
              riskView={riskView}
              searchQuery={searchQuery}
              layers={layers}
              zoom={zoom}
              panOffset={panOffset}
              onPanChange={setPanOffset}
              onZoomChange={setZoom}
            />
          </div>

          {/* RIGHT / FLOATING NODE DETAILS PANEL */}
          {selectedNode && (
            <div className="mg-live-map-page__panel-wrapper">
              <NodeDetailsPanel
                node={selectedNode}
                onClose={() => setSelectedNodeId(null)}
              />
            </div>
          )}
        </div>

        {/* BOTTOM MAP LEGEND */}
        <div className="mg-live-map-page__footer-bar">
          <MapLegend />
        </div>
      </div>
    </PageContainer>
  );
};
