import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/feedback/EmptyState';
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton';
import { AlertBanner } from '../components/feedback/AlertBanner';
import { Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { MapNode } from '../data/mock/nodes';
import { NodeSummaryCards } from '../components/nodes/NodeSummaryCards';
import { NodeFilters } from '../components/nodes/NodeFilters';
import type { SortField, SortDirection } from '../components/nodes/NodeFilters';
import { NodeTable } from '../components/nodes/NodeTable';
import { NodeMobileCard } from '../components/nodes/NodeMobileCard';
import { NodeDetailsDrawer } from '../components/nodes/NodeDetailsDrawer';
import { AddNodeModal } from '../components/nodes/AddNodeModal';
import { nodesService } from '../services/nodesService';
import { adaptNodeSummaryToMapNode } from '../services/adapters/nodeAdapter';
import { getErrorMessage } from '../api/errors';
import { API_CONFIG } from '../api/config';
import './NodesPage.css';

const PAGE_SIZE = 10;

export const NodesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const nodeParam = searchParams.get('node');

  // Node state: starts empty, populated from real backend API
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  // Fetch real nodes from backend (manual refresh / retry)
  const loadNodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendSummaries = await nodesService.listNodes();
      if (backendSummaries && backendSummaries.length > 0) {
        const adapted = backendSummaries.map((summary) =>
          adaptNodeSummaryToMapNode(summary)
        );
        setNodes(adapted);
        setIsLiveBackend(true);
      } else {
        setNodes([]);
        setIsLiveBackend(true);
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not connect to backend node service.');
      setError(msg);
      setNodes([]);
      setIsLiveBackend(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial mount load without synchronous setState in effect body
  useEffect(() => {
    let active = true;
    nodesService.listNodes().then((backendSummaries) => {
      if (!active) return;
      if (backendSummaries && backendSummaries.length > 0) {
        setNodes(backendSummaries.map((summary) => adaptNodeSummaryToMapNode(summary)));
        setIsLiveBackend(true);
      } else {
        setNodes([]);
        setIsLiveBackend(true);
      }
      setIsLoading(false);
    }).catch((err) => {
      if (!active) return;
      setError(getErrorMessage(err, 'Could not connect to backend node service.'));
      setNodes([]);
      setIsLiveBackend(false);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  // Selection & Details drawer (initialized from URL if present)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => {
    const p = searchParams.get('node');
    return p ? p : null;
  });

  // Sync state if ?node= query param changes during navigation
  const [prevNodeParam, setPrevNodeParam] = useState<string | null>(nodeParam);
  if (nodeParam !== prevNodeParam) {
    setPrevNodeParam(nodeParam);
    if (nodeParam) {
      setSelectedNodeId(nodeParam);
    }
  }

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Add Node Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Extract distinct zones dynamically from nodes
  const availableZones = useMemo(() => {
    const zoneSet = new Set(nodes.map((n) => n.zone));
    return Array.from(zoneSet).sort();
  }, [nodes]);

  // Handle filter presets from summary cards
  const handleSelectSummaryFilter = (filterKey: string) => {
    setStatusFilter(filterKey);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setZoneFilter('ALL');
    setRiskFilter('ALL');
    setCurrentPage(1);
  };

  // Filter & Sort computation
  const filteredAndSortedNodes = useMemo(() => {
    let result = [...nodes];

    // 1. Text Search (Node ID or Zone or Panel or Name)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (n) =>
          n.id.toLowerCase().includes(q) ||
          n.zone.toLowerCase().includes(q) ||
          n.panel.toLowerCase().includes(q) ||
          n.name.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ONLINE') {
        result = result.filter((n) => n.isOnline);
      } else if (statusFilter === 'OFFLINE') {
        result = result.filter((n) => !n.isOnline || n.status === 'OFFLINE');
      } else {
        result = result.filter((n) => n.status === statusFilter);
      }
    }

    // 3. Zone Filter
    if (zoneFilter !== 'ALL') {
      result = result.filter((n) => n.zone === zoneFilter);
    }

    // 4. Risk Filter
    if (riskFilter !== 'ALL') {
      if (riskFilter === 'NORMAL') {
        result = result.filter((n) => n.aiRiskScore < 30);
      } else if (riskFilter === 'ELEVATED') {
        result = result.filter((n) => n.aiRiskScore >= 30 && n.aiRiskScore < 60);
      } else if (riskFilter === 'HIGH_RISK') {
        result = result.filter((n) => n.aiRiskScore >= 60 && n.aiRiskScore < 80);
      } else if (riskFilter === 'CRITICAL') {
        result = result.filter((n) => n.aiRiskScore >= 80 || n.status === 'CRITICAL');
      }
    }

    // 5. Sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'id') {
        // Natural alphanumeric sort for N01, N02, etc.
        comparison = a.id.localeCompare(b.id, undefined, { numeric: true });
      } else if (sortField === 'aiRiskScore') {
        comparison = a.aiRiskScore - b.aiRiskScore;
      } else if (sortField === 'tiltDeg') {
        comparison = a.tiltDeg - b.tiltDeg;
      } else if (sortField === 'displacementMm') {
        comparison = a.displacementMm - b.displacementMm;
      } else if (sortField === 'vibrationMmS') {
        comparison = a.vibrationMmS - b.vibrationMmS;
      } else if (sortField === 'crackWidthMm') {
        comparison = a.crackWidthMm - b.crackWidthMm;
      } else if (sortField === 'batteryPct') {
        comparison = a.batteryPct - b.batteryPct;
      } else if (sortField === 'lastUpdated') {
        comparison = a.lastUpdated.localeCompare(b.lastUpdated);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [nodes, searchQuery, statusFilter, zoneFilter, riskFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalMatches = filteredAndSortedNodes.length;
  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedNodes = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredAndSortedNodes.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedNodes, validCurrentPage]);

  // Selected node object derived directly during render
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);


  // Local handler to acknowledge an anomaly on a node
  const handleAcknowledgeNode = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, acknowledged: true } : n))
    );
  };

  // Local handler to refresh telemetry for a node
  const handleRefreshNode = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        return {
          ...n,
          lastUpdated: timeStr,
        };
      })
    );
  };

  return (
    <PageContainer maxWidth="wide" className="mg-nodes-page">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Nodes"
        subtitle="Monitor deployed sensor nodes and their health"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadNodes}
              disabled={isLoading}
            >
              {isLoading ? 'Syncing...' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => setIsAddModalOpen(true)}
            >
              + Add Node
            </Button>
          </div>
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
                ? `${error} — Showing simulated demonstration nodes (Development Fallback Mode).`
                : `${error} — Unable to load live node fleet from backend API.`
            }
            action={
              <Button variant="secondary" size="sm" onClick={loadNodes}>
                Retry Connection
              </Button>
            }
          />
        </div>
      )}

      {/* 2. NODE SUMMARY CARDS */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <LoadingSkeleton variant="card" height={90} />
          <LoadingSkeleton variant="card" height={90} />
          <LoadingSkeleton variant="card" height={90} />
          <LoadingSkeleton variant="card" height={90} />
        </div>
      ) : (
        <NodeSummaryCards
          nodes={nodes}
          activeFilter={statusFilter}
          onSelectFilter={handleSelectSummaryFilter}
        />
      )}

      {/* 3. NODE FILTERS & SEARCH */}
      <NodeFilters
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(s) => {
          setStatusFilter(s);
          setCurrentPage(1);
        }}
        zoneFilter={zoneFilter}
        onZoneChange={(z) => {
          setZoneFilter(z);
          setCurrentPage(1);
        }}
        riskFilter={riskFilter}
        onRiskChange={(r) => {
          setRiskFilter(r);
          setCurrentPage(1);
        }}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortDirection={sortDirection}
        onToggleSortDirection={() =>
          setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        }
        onResetFilters={handleResetFilters}
        zones={availableZones}
        totalMatches={totalMatches}
        totalCount={nodes.length}
      />

      {/* 4. NODE TABLE (DESKTOP) / CARDS (MOBILE) */}
      {isLoading ? (
        <Card>
          <div style={{ padding: '24px' }}>
            <LoadingSkeleton variant="table" count={5} height={40} />
          </div>
        </Card>
      ) : totalMatches === 0 ? (
        <Card>
          <EmptyState
            type="custom"
            title={isLiveBackend && nodes.length === 0 ? "No sensor nodes registered" : "No nodes match your current filters"}
            description={isLiveBackend && nodes.length === 0 ? "No monitoring nodes found in the backend database. Deploy nodes to view telemetry." : "Adjust your search query or reset status and zone filters to view deployed telemetry probes."}
            action={
              <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="mg-nodes-page__desktop-view">
            <NodeTable
              nodes={paginatedNodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={(node) => setSelectedNodeId(node.id)}
            />
          </div>

          {/* Mobile Cards View */}
          <div className="mg-nodes-page__mobile-view">
            {paginatedNodes.map((node) => (
              <NodeMobileCard
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelectNode={(n) => setSelectedNodeId(n.id)}
              />
            ))}
          </div>

          {/* 5. PAGINATION BAR */}
          {totalPages > 1 && (
            <div className="mg-nodes-page__pagination">
              <span className="mg-nodes-page__pagination-info mono-telemetry">
                Showing{' '}
                <strong>
                  {(validCurrentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(validCurrentPage * PAGE_SIZE, totalMatches)}
                </strong>{' '}
                of {totalMatches}
              </span>

              <div className="mg-nodes-page__pagination-controls">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft size={14} />}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage <= 1}
                  aria-label="Previous page"
                >
                  Previous
                </Button>

                <div className="mg-nodes-page__pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`mg-nodes-page__page-btn ${
                        validCurrentPage === pageNum ? 'is-active' : ''
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                      aria-label={`Page ${pageNum}`}
                      aria-current={validCurrentPage === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ChevronRight size={14} />}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage >= totalPages}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 6. NODE DETAILS DRAWER */}
      <NodeDetailsDrawer
        node={selectedNode}
        isOpen={selectedNode !== null}
        onClose={() => setSelectedNodeId(null)}
        onRefreshNode={handleRefreshNode}
        onAcknowledgeNode={handleAcknowledgeNode}
      />

      {/* 7. ADD NODE MODAL */}
      <AddNodeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </PageContainer>
  );
};
