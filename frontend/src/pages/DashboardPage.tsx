import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { Button } from '../components/ui/Button';
import { MetricCard } from '../components/dashboard/MetricCard';
import { LiveMineMap } from '../components/dashboard/LiveMineMap';
import { CurrentMineRisk } from '../components/dashboard/CurrentMineRisk';
import { RecentAlerts } from '../components/dashboard/RecentAlerts';
import { NodeParameterTrends } from '../components/dashboard/NodeParameterTrends';
import { RiskScoreTrend } from '../components/dashboard/RiskScoreTrend';
import { AlertBanner } from '../components/feedback/AlertBanner';
import { DASHBOARD_METRICS } from '../data/mock/dashboardTelemetry';
import type { DashboardMetric, MineRiskSummary } from '../data/mock/dashboardTelemetry';
import type { MapNode } from '../data/mock/nodes';
import type { DashboardAlert } from '../data/mock/alerts';
import { dashboardService } from '../services/dashboardService';
import { alertsService } from '../services/alertsService';
import { nodesService } from '../services/nodesService';
import { telemetryService } from '../services/telemetryService';
import { adaptAlertResponseToDashboardAlert } from '../services/adapters/alertAdapter';
import { adaptNodeSummaryToMapNode } from '../services/adapters/nodeAdapter';
import {
  deriveFleetRiskLevel,
  mapRiskLevelToStatus,
  calculateCompositeMineRiskScore,
} from '../services/adapters/riskAdapter';
import type {
  AlertResponse,
  DashboardOverviewResponse,
  NodeSummaryResponse,
  SensorReadingResponse,
} from '../types/api';
import { getErrorMessage } from '../api/errors';
import { RefreshCw } from 'lucide-react';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('NODE-JHR-01');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  // Live state from backend
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [rawAlerts, setRawAlerts] = useState<AlertResponse[]>([]);
  const [rawNodes, setRawNodes] = useState<NodeSummaryResponse[]>([]);
  const [nodeReadings, setNodeReadings] = useState<SensorReadingResponse[]>([]);

  // Load live data from backend APIs (manual refresh / retry)
  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [overviewData, activeAlerts, nodeList] = await Promise.all([
        dashboardService.getOverview(),
        alertsService.getActiveAlerts().catch(() => []),
        nodesService.listNodes().catch(() => []),
      ]);

      setOverview(overviewData);
      setRawAlerts(activeAlerts);
      setRawNodes(nodeList);
      setIsLiveBackend(true);

      const targetNodeId = selectedNodeId || (nodeList.length > 0 ? nodeList[0].node_identifier : 'NODE-JHR-01');
      if (targetNodeId) {
        telemetryService
          .getLatestReadings(targetNodeId)
          .then((res) => setNodeReadings(res.readings))
          .catch(() => setNodeReadings([]));
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Backend unavailable.');
      setError(msg);
      setIsLiveBackend(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedNodeId]);

  // Initial mount load without synchronous setState in effect body
  useEffect(() => {
    let active = true;
    Promise.all([
      dashboardService.getOverview(),
      alertsService.getActiveAlerts().catch(() => []),
      nodesService.listNodes().catch(() => []),
    ])
      .then(([overviewData, activeAlerts, nodeList]) => {
        if (!active) return;
        setOverview(overviewData);
        setRawAlerts(activeAlerts);
        setRawNodes(nodeList);
        setIsLiveBackend(true);
        setIsLoading(false);

        // Select first active node from backend if default is not in list
        const initialNode = nodeList.length > 0 ? nodeList[0].node_identifier : 'NODE-JHR-01';
        setSelectedNodeId(initialNode);

        telemetryService
          .getLatestReadings(initialNode)
          .then((res) => {
            if (active) setNodeReadings(res.readings);
          })
          .catch(() => {
            if (active) setNodeReadings([]);
          });
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err, 'Backend unavailable.'));
        setIsLiveBackend(false);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Update node readings when selectedNodeId changes
  useEffect(() => {
    if (!selectedNodeId) return;
    let active = true;

    telemetryService
      .getLatestReadings(selectedNodeId)
      .then((res) => {
        if (active) setNodeReadings(res.readings);
      })
      .catch(() => {
        if (active) setNodeReadings([]);
      });

    return () => {
      active = false;
    };
  }, [selectedNodeId]);

  // Derived dynamic metrics (6 cards)
  const metrics: DashboardMetric[] = useMemo(() => {
    if (!overview) {
      return DASHBOARD_METRICS.map((m) => ({
        ...m,
        value: '—',
        change: error ? 'Offline' : 'Loading...',
        changeType: 'neutral',
      }));
    }

    // Helper to find latest reading for given sensor keywords
    const findReading = (...keywords: string[]) => {
      return nodeReadings.find((r) =>
        keywords.some((k) => r.sensor_type.toLowerCase().includes(k.toLowerCase()))
      );
    };

    return DASHBOARD_METRICS.map((m) => {
      // 1. Nodes Fleet Metric (🟢 REAL from overview)
      if (m.id === 'nodes') {
        return {
          ...m,
          value: `${overview.active_nodes} / ${overview.total_nodes}`,
          change:
            overview.unresponsive_nodes > 0
              ? `${overview.unresponsive_nodes} Unresponsive`
              : 'All Active',
          changeType: overview.unresponsive_nodes > 0 ? 'moderate-risk' : 'good',
          secondaryText: `${overview.total_zones} Zones`,
        };
      }

      // 2. Physical Sensor Metrics (🟢 REAL from selectedNodeId latest readings)
      let matchedReading: SensorReadingResponse | undefined;
      if (m.id === 'tilt') {
        matchedReading = findReading('tilt');
      } else if (m.id === 'displacement') {
        matchedReading = findReading('displacement');
      } else if (m.id === 'vibration') {
        matchedReading = findReading('vibration');
      } else if (m.id === 'crack') {
        matchedReading = findReading('crack', 'crack_progression');
      } else if (m.id === 'temperature') {
        matchedReading = findReading('temp', 'temperature');
      }

      if (matchedReading) {
        return {
          ...m,
          value: matchedReading.value.toFixed(2),
          unit: matchedReading.unit || m.unit,
          change: selectedNodeId ? `Node ${selectedNodeId}` : 'Latest',
          changeType: 'neutral',
          secondaryText: 'Live Telemetry',
        };
      }

      // Sensor reading not available on this node or awaiting telemetry
      return {
        ...m,
        value: '—',
        change: selectedNodeId ? `Node ${selectedNodeId}` : 'Awaiting Data',
        changeType: 'neutral',
        secondaryText: 'Awaiting Reading',
      };
    });
  }, [overview, nodeReadings, selectedNodeId, error]);

  // Derived real risk summary (Phase 6 Explainable Risk)
  const riskSummary: MineRiskSummary = useMemo(() => {
    if (!overview || !overview.zones_overview || overview.zones_overview.length === 0) {
      return {
        score: 0,
        status: 'NORMAL',
        trend: 'Stable',
        trendRate: '0.0 / shift',
        confidence: 0,
        primaryIndicators: error
          ? ['Backend Disconnected — Verify database and service status.']
          : ['Nominal Baseline — Zero active risk factors detected.'],
        sparkline24h: [],
      };
    }

    const level = deriveFleetRiskLevel(overview.zones_overview);
    const status = mapRiskLevelToStatus(level);
    const score = calculateCompositeMineRiskScore(overview.zones_overview);

    // Explainable indicators derived from real zone assessments & alerts
    const indicators: string[] = [];
    for (const zone of overview.zones_overview) {
      if (zone.highest_risk_level !== 'NORMAL') {
        indicators.push(
          `${zone.zone_name}: Assessed ${zone.highest_risk_level} (${zone.active_alert_count} active alert(s))`
        );
      }
    }
    if (overview.alerts.critical > 0) {
      indicators.push(`${overview.alerts.critical} Critical Safety Alert(s) Active in Fleet`);
    }
    if (overview.alerts.warning > 0) {
      indicators.push(`${overview.alerts.warning} Warning Alert(s) Active in Fleet`);
    }
    if (indicators.length === 0) {
      indicators.push('Nominal Baseline — All zones operating within safety limits');
    }

    return {
      score,
      status,
      trend: level === 'HIGH' ? 'Increasing' : 'Stable',
      trendRate: level === 'HIGH' ? '+Active Risk' : 'Nominal',
      confidence: 1.0,
      primaryIndicators: indicators,
      sparkline24h: [], // Backend provides instantaneous assessments without rolling table
    };
  }, [overview, error]);

  // Derived recent alerts
  const recentAlerts: DashboardAlert[] = useMemo(() => {
    if (rawAlerts && rawAlerts.length > 0) {
      return rawAlerts.map(adaptAlertResponseToDashboardAlert);
    }
    return [];
  }, [rawAlerts]);

  // Derived live nodes
  const liveNodes: MapNode[] = useMemo(() => {
    if (rawNodes && rawNodes.length > 0) {
      return rawNodes.map((n) => {
        const parentZone = overview?.zones_overview.find((z) => z.zone_id === n.zone_id);
        return adaptNodeSummaryToMapNode(n, [], parentZone?.highest_risk_level);
      });
    }
    return [];
  }, [rawNodes, overview]);


  return (
    <PageContainer maxWidth="wide" className="mg-dashboard-container">
      {/* COMPACT EXECUTIVE DASHBOARD HEADER */}
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time mine subsidence monitoring, multi-sensor telemetry correlation, and TARP early warning."
        badge={
          <StatusIndicator
            status={isLiveBackend ? 'LIVE' : 'WARNING'}
            size="sm"
            customLabel={isLiveBackend ? 'Backend API Connected' : 'Backend Unavailable'}
          />
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={loadDashboardData}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Polling Mesh...' : 'Poll Nodes'}
          </Button>
        }
      />

      {/* OFFLINE / DISCONNECTED NOTIFICATION BANNER */}
      {error && (
        <div style={{ marginBottom: '16px' }}>
          <AlertBanner
            severity="critical"
            title="Backend Disconnected"
            message={`${error} — Unable to connect to backend overview API.`}
            action={
              <Button variant="secondary" size="sm" onClick={loadDashboardData}>
                Retry Connection
              </Button>
            }
          />
        </div>
      )}

      {/* 1. TOP METRIC ROW (6 CARDS) */}
      <div className="mg-dashboard__metric-row" role="region" aria-label="Summary Telemetry Metrics">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* 2. MAIN CONTENT (MAP + CURRENT RISK & RECENT ALERTS) */}
      <div className="mg-dashboard__main-grid">
        {/* Left / Large: Live Mine Map */}
        <div className="mg-dashboard__map-col">
          <LiveMineMap
            nodes={liveNodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {/* Right: Current Mine Risk & Recent Alerts */}
        <div className="mg-dashboard__side-col">
          <CurrentMineRisk summary={riskSummary} />
          <RecentAlerts
            alerts={recentAlerts}
            isLoading={isLoading}
            onSelectNode={setSelectedNodeId}
          />
        </div>
      </div>

      {/* 3. LOWER CONTENT (PARAMETER TRENDS + RISK SCORE TREND) */}
      <div className="mg-dashboard__lower-grid">
        {/* Left / Large: Node Parameter Trends */}
        <div className="mg-dashboard__trends-col">
          <NodeParameterTrends selectedNodeId={selectedNodeId || 'N04'} />
        </div>

        {/* Right: Risk Score Trend */}
        <div className="mg-dashboard__risk-trend-col">
          <RiskScoreTrend />
        </div>
      </div>
    </PageContainer>
  );
};
