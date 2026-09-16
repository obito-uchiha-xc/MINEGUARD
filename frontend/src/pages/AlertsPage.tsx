import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import {
  type MineAlert,
  type AlertSeverityLevel,
  type AlertOperationalStatus,
  type AlertCategory,
  type AlertFilterState,
} from '../data/mock/alertsCenter';
import { AlertSummaryCards } from '../components/alerts/AlertSummaryCards';
import { AlertFilters } from '../components/alerts/AlertFilters';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertDetailsDrawer } from '../components/alerts/AlertDetailsDrawer';
import { AlertPreferencesModal } from '../components/alerts/AlertPreferencesModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/feedback/EmptyState';
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton';
import { AlertBanner } from '../components/feedback/AlertBanner';
import { alertsService } from '../services/alertsService';
import { adaptAlertResponseToMineAlert } from '../services/adapters/alertAdapter';
import { getErrorMessage } from '../api/errors';
import { API_CONFIG } from '../api/config';
import {
  Sliders,
  Download,
  CheckCheck,
  BellRing,
  RefreshCw,
} from 'lucide-react';
import './AlertsPage.css';

export const AlertsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [alerts, setAlerts] = useState<MineAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  // Fetch real alerts from backend (manual refresh / retry)
  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [activeList, historyList] = await Promise.all([
        alertsService.getActiveAlerts(),
        alertsService.getAlertHistory({ limit: 50 }).catch(() => []),
      ]);

      const seenIds = new Set<number>();
      const combined: MineAlert[] = [];

      for (const a of activeList) {
        if (!seenIds.has(a.id)) {
          seenIds.add(a.id);
          combined.push(adaptAlertResponseToMineAlert(a));
        }
      }
      for (const a of historyList) {
        if (!seenIds.has(a.id)) {
          seenIds.add(a.id);
          combined.push(adaptAlertResponseToMineAlert(a));
        }
      }

      setAlerts(combined);
      setIsLiveBackend(true);
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not connect to backend alerts service.');
      setError(msg);
      setAlerts([]);
      setIsLiveBackend(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial mount load without synchronous setState in effect body
  useEffect(() => {
    let active = true;
    Promise.all([
      alertsService.getActiveAlerts(),
      alertsService.getAlertHistory({ limit: 50 }).catch(() => []),
    ]).then(([activeList, historyList]) => {
      if (!active) return;
      const seenIds = new Set<number>();
      const combined: MineAlert[] = [];
      for (const a of activeList) {
        if (!seenIds.has(a.id)) {
          seenIds.add(a.id);
          combined.push(adaptAlertResponseToMineAlert(a));
        }
      }
      for (const a of historyList) {
        if (!seenIds.has(a.id)) {
          seenIds.add(a.id);
          combined.push(adaptAlertResponseToMineAlert(a));
        }
      }
      setAlerts(combined);
      setIsLiveBackend(true);
      setIsLoading(false);
    }).catch((err) => {
      if (!active) return;
      setError(getErrorMessage(err, 'Could not connect to backend alerts service.'));
      setAlerts([]);
      setIsLiveBackend(false);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);
  
  // Initialize selection state directly from URL query param if present
  const initialAlertId = searchParams.get('alert');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(initialAlertId);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(Boolean(initialAlertId));
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<AlertFilterState>(() => ({
    searchQuery: searchParams.get('node') || searchParams.get('q') || '',
    severity: (searchParams.get('severity') as AlertSeverityLevel | 'ALL') || 'ALL',
    status: (searchParams.get('status') as AlertOperationalStatus | 'ALL' | 'UNRESOLVED') || 'ALL',
    zone: searchParams.get('zone') || 'ALL',
    category: (searchParams.get('category') as AlertCategory | 'ALL') || 'ALL',
    sortBy: 'SEVERITY_DESC',
  }));

  // Derive selected alert object from canonical alerts state
  const selectedAlert = useMemo(() => {
    if (!selectedAlertId) return null;
    return alerts.find((a) => a.id.toLowerCase() === selectedAlertId.toLowerCase()) || null;
  }, [alerts, selectedAlertId]);

  // Derive available zone names from real backend alert data for the zone filter
  const availableZones = useMemo(() => {
    const zones = Array.from(new Set(alerts.map((a) => a.zone).filter(Boolean))).sort();
    return zones;
  }, [alerts]);

  // Handle Filter Change
  const handleFilterChange = (updated: Partial<AlertFilterState>) => {
    setFilters((prev: AlertFilterState) => {
      const next = { ...prev, ...updated };
      const params = new URLSearchParams();
      if (next.searchQuery) params.set('q', next.searchQuery);
      if (next.severity !== 'ALL') params.set('severity', next.severity);
      if (next.status !== 'ALL') params.set('status', next.status);
      if (next.zone !== 'ALL') params.set('zone', next.zone);
      if (next.category !== 'ALL') params.set('category', next.category);
      setSearchParams(params, { replace: true });
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      severity: 'ALL',
      status: 'ALL',
      zone: 'ALL',
      category: 'ALL',
      sortBy: 'SEVERITY_DESC',
    });
    setSearchParams({}, { replace: true });
  };

  // Determine active filter key for summary cards
  const activeSummaryKey = useMemo(() => {
    if (filters.severity === 'CRITICAL') return 'SEV_CRITICAL';
    if (filters.severity === 'HIGH_RISK') return 'SEV_HIGH_RISK';
    if (filters.severity === 'WARNING') return 'SEV_WARNING';
    if (filters.status === 'ACKNOWLEDGED') return 'STATUS_ACKNOWLEDGED';
    if (filters.status === 'UNRESOLVED') return 'STATUS_UNRESOLVED';
    return '';
  }, [filters.severity, filters.status]);

  // Summary card click filter toggle
  const handleSummaryCardSelect = (key: string) => {
    if (key === 'SEV_CRITICAL') {
      handleFilterChange({ severity: filters.severity === 'CRITICAL' ? 'ALL' : 'CRITICAL' });
    } else if (key === 'SEV_HIGH_RISK') {
      handleFilterChange({ severity: filters.severity === 'HIGH_RISK' ? 'ALL' : 'HIGH_RISK' });
    } else if (key === 'SEV_WARNING') {
      handleFilterChange({ severity: filters.severity === 'WARNING' ? 'ALL' : 'WARNING' });
    } else if (key === 'STATUS_ACKNOWLEDGED') {
      handleFilterChange({ status: filters.status === 'ACKNOWLEDGED' ? 'ALL' : 'ACKNOWLEDGED' });
    } else if (key === 'STATUS_UNRESOLVED') {
      handleFilterChange({ status: filters.status === 'UNRESOLVED' ? 'ALL' : 'UNRESOLVED' });
    }
  };

  // Alert Life-Cycle State Transitions
  const handleStatusChange = (
    alertId: string,
    newStatus: AlertOperationalStatus,
    notes?: string
  ) => {
    // If resolving a backend alert, push resolution to backend API
    if (newStatus === 'RESOLVED') {
      const match = alertId.match(/^ALT-(\d+)$/i) || alertId.match(/^(\d+)$/);
      if (match) {
        const numericId = parseInt(match[1], 10);
        alertsService
          .resolveAlert(numericId, { resolution_note: notes || 'Resolved via operator console' })
          .catch((err) => {
            console.warn(`Failed to resolve alert ${numericId} on backend:`, err);
          });
      }
    }

    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== alertId) return a;

        const updated: MineAlert = { ...a, status: newStatus };

        if (newStatus === 'ACKNOWLEDGED') {
          updated.acknowledgedAt = 'Just now';
          updated.acknowledgedBy = 'Control Room Operator';
        } else if (newStatus === 'INVESTIGATING') {
          updated.investigatingAt = 'Just now';
          updated.investigatingBy = 'Geotechnical Safety Team';
        } else if (newStatus === 'RESOLVED') {
          updated.resolvedAt = 'Just now';
          updated.resolvedBy = 'Shift Supervisor';
          if (notes) updated.resolutionNotes = notes;
        }

        return updated;
      })
    );
  };

  // Quick Acknowledge on Card
  const handleQuickAcknowledge = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleStatusChange(alertId, 'ACKNOWLEDGED');
  };

  // Filter & Sort Logic
  const filteredAlerts = useMemo(() => {
    const list = alerts.filter((alert) => {
      // Search Query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchId = alert.id.toLowerCase().includes(q);
        const matchNode = alert.nodeId.toLowerCase().includes(q);
        const matchZone = alert.zone.toLowerCase().includes(q);
        const matchTitle = alert.title.toLowerCase().includes(q);
        const matchDesc = alert.description.toLowerCase().includes(q);
        if (!matchId && !matchNode && !matchZone && !matchTitle && !matchDesc) {
          return false;
        }
      }

      // Severity
      if (filters.severity !== 'ALL' && alert.severity !== filters.severity) {
        return false;
      }

      // Status
      if (filters.status === 'UNRESOLVED') {
        if (alert.status !== 'NEW' && alert.status !== 'INVESTIGATING') {
          return false;
        }
      } else if (filters.status !== 'ALL' && alert.status !== filters.status) {
        return false;
      }

      // Zone
      if (filters.zone !== 'ALL' && alert.zone !== filters.zone) {
        return false;
      }

      // Category
      if (filters.category !== 'ALL' && alert.category !== filters.category) {
        return false;
      }

      return true;
    });

    const sevWeight: Record<AlertSeverityLevel, number> = {
      CRITICAL: 3,
      HIGH_RISK: 2,
      WARNING: 1,
    };

    const statusWeight: Record<AlertOperationalStatus, number> = {
      NEW: 4,
      INVESTIGATING: 3,
      ACKNOWLEDGED: 2,
      RESOLVED: 1,
    };

    return [...list].sort((a, b) => {
      if (filters.sortBy === 'SEVERITY_DESC') {
        const diffSev = sevWeight[b.severity] - sevWeight[a.severity];
        if (diffSev !== 0) return diffSev;
        const diffStatus = statusWeight[b.status] - statusWeight[a.status];
        if (diffStatus !== 0) return diffStatus;
        return b.riskScore - a.riskScore;
      }

      if (filters.sortBy === 'RISK_SCORE_DESC') {
        return b.riskScore - a.riskScore;
      }

      if (filters.sortBy === 'TIMESTAMP_DESC') {
        return b.id.localeCompare(a.id);
      }

      if (filters.sortBy === 'TIMESTAMP_ASC') {
        return a.id.localeCompare(b.id);
      }

      return 0;
    });
  }, [alerts, filters]);

  const newAlertsCountInFiltered = useMemo(() => {
    return filteredAlerts.filter((a) => a.status === 'NEW').length;
  }, [filteredAlerts]);

  // Bulk Acknowledge All Filtered New Alerts
  const handleBulkAcknowledge = () => {
    const targetIds = filteredAlerts.filter((a) => a.status === 'NEW').map((a) => a.id);
    if (targetIds.length === 0) return;

    setAlerts((prev) =>
      prev.map((a) =>
        targetIds.includes(a.id)
          ? {
              ...a,
              status: 'ACKNOWLEDGED' as AlertOperationalStatus,
              acknowledgedAt: 'Just now',
              acknowledgedBy: 'Control Room Operator (Bulk)',
            }
          : a
      )
    );
  };

  // Export CSV Log
  const handleExportCSV = () => {
    const headers = [
      'Alert ID',
      'Severity',
      'Status',
      'Node ID',
      'Zone',
      'Category',
      'Risk Score',
      'Title',
      'Timestamp',
      'Confidence (%)',
      'Acknowledged By',
      'Resolved By',
    ];

    const rows = filteredAlerts.map((a) => [
      a.id,
      a.severity,
      a.status,
      a.nodeId,
      a.zone,
      a.category,
      a.riskScore,
      `"${a.title.replace(/"/g, '""')}"`,
      a.timestamp,
      a.confidencePct,
      a.acknowledgedBy || '',
      a.resolvedBy || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MineGuard-Alerts-Export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer maxWidth="wide">
      {/* PAGE HEADER */}
      <PageHeader
        title="Alert & Early Warning Center"
        subtitle="Real-time multi-sensor anomaly consensus, spatial correlation, and supervisory safety escalation."
        actions={
          <div className="mg-alerts-header-actions">
            <div className="mg-live-telemetry-badge">
              <span className="live-dot" />
              <span className="live-text mono-telemetry">Telemetry Feed Active</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadAlerts}
              disabled={isLoading}
            >
              {isLoading ? 'Syncing...' : 'Refresh'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleExportCSV}
            >
              Export CSV Log
            </Button>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sliders size={14} />}
              onClick={() => setIsPrefsOpen(true)}
            >
              Early Warning Preferences
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
                ? `${error} — Showing simulated demonstration alerts (Development Fallback Mode).`
                : `${error} — Unable to query active alerts from backend API.`
            }
            action={
              <Button variant="secondary" size="sm" onClick={loadAlerts}>
                Retry Connection
              </Button>
            }
          />
        </div>
      )}

      <div className="mg-alerts-page-layout">
        {/* SUMMARY METRIC CARDS ROW */}
        <section aria-label="Alerts metric summary">
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <LoadingSkeleton variant="card" height={90} />
              <LoadingSkeleton variant="card" height={90} />
              <LoadingSkeleton variant="card" height={90} />
              <LoadingSkeleton variant="card" height={90} />
            </div>
          ) : (
            <AlertSummaryCards
              alerts={alerts}
              activeFilter={activeSummaryKey}
              onSelectFilter={handleSummaryCardSelect}
            />
          )}
        </section>

        {/* SEARCH & FILTERS CONTROLS */}
        <section aria-label="Filter alerts">
          <AlertFilters
            filters={filters}
            totalMatches={filteredAlerts.length}
            totalAlerts={alerts.length}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            availableZones={availableZones}
          />
        </section>

        {/* BULK ACTION / FEED CONTROL BAR */}
        <div className="mg-alerts-feed-header">
          <div className="feed-info">
            <h3 className="feed-title">
              Prioritized Safety Feed
              <span className="feed-badge mono-telemetry">{filteredAlerts.length}</span>
            </h3>
            {newAlertsCountInFiltered > 0 && (
              <span className="feed-sub mono-telemetry">
                ({newAlertsCountInFiltered} requiring acknowledgment)
              </span>
            )}
          </div>

          <div className="feed-bulk-actions">
            {newAlertsCountInFiltered > 0 && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<CheckCheck size={14} />}
                onClick={handleBulkAcknowledge}
              >
                Acknowledge All New ({newAlertsCountInFiltered})
              </Button>
            )}
          </div>
        </div>

        {/* ALERTS FEED LIST / EMPTY STATE */}
        {isLoading ? (
          <div className="mg-alerts-feed-list">
            <LoadingSkeleton variant="card" height={140} />
            <LoadingSkeleton variant="card" height={140} />
            <LoadingSkeleton variant="card" height={140} />
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="mg-alerts-feed-list" role="feed" aria-busy="false">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                isSelected={selectedAlert?.id === alert.id && isDrawerOpen}
                onSelectAlert={(a) => {
                  setSelectedAlertId(a.id);
                  setIsDrawerOpen(true);
                }}
                onQuickAcknowledge={handleQuickAcknowledge}
              />
            ))}
          </div>
        ) : (
          <div className="mg-alerts-empty-container">
            <EmptyState
              type="custom"
              icon={<BellRing size={40} />}
              title={isLiveBackend && alerts.length === 0 ? "All Systems Clear — Zero Active Alerts" : "No Alerts Match the Active Filters"}
              description={isLiveBackend && alerts.length === 0 ? "No threshold breaches or multi-parameter anomalies are currently active across deployed mine sectors." : "No safety anomalies or warnings match your selected filter criteria. Clear filters or broaden your query to review all recorded events."}
              action={
                <Button variant="primary" size="sm" onClick={handleResetFilters}>
                  Clear All Filters
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* ALERT DETAILS SLIDE-IN DRAWER */}
      <AlertDetailsDrawer
        alert={selectedAlert}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAlertId(null);
        }}
        onStatusChange={handleStatusChange}
      />

      {/* ALERT PREFERENCES MODAL */}
      <AlertPreferencesModal
        isOpen={isPrefsOpen}
        onClose={() => setIsPrefsOpen(false)}
      />
    </PageContainer>
  );
};
