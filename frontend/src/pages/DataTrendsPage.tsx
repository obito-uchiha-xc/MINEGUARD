import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { AlertBanner } from '../components/feedback/AlertBanner';
import { Download, RefreshCw } from 'lucide-react';
import type { MapNode } from '../data/mock/nodes';
import type {
  ParameterKey,
  TimeRangeKey,
  TelemetryPoint,
  AnomalyTimelineItem,
} from '../data/mock/trendsAnalysis';
import {
  PARAMETER_CONFIGS,
  getTelemetryTimeSeries,
  getNormalizedComparisonSeries,
} from '../data/mock/trendsAnalysis';
import { TrendsFilterBar } from '../components/trends/TrendsFilterBar';
import { TrendsSummaryCards } from '../components/trends/TrendsSummaryCards';
import { MainTelemetryChart } from '../components/trends/MainTelemetryChart';
import { SecondaryAnalysis } from '../components/trends/SecondaryAnalysis';
import { MultiSensorAnalysis } from '../components/trends/MultiSensorAnalysis';
import { AnomalyTimeline } from '../components/trends/AnomalyTimeline';
import { SpatialTemporalAnalysis } from '../components/trends/SpatialTemporalAnalysis';
import { TelemetryDataTable } from '../components/trends/TelemetryDataTable';
import { nodesService } from '../services/nodesService';
import { telemetryService } from '../services/telemetryService';
import { aiService } from '../services/aiService';
import { adaptNodeSummaryToMapNode } from '../services/adapters/nodeAdapter';
import {
  adaptHistoryToTelemetryTimeSeries,
  getTimeRangeDateBounds,
  mapParameterKeyToSensorType,
} from '../services/adapters/trendsAdapter';
import { getErrorMessage } from '../api/errors';
import { API_CONFIG } from '../api/config';
import { formatUtcTime } from '../utils/date';
import './DataTrendsPage.css';

export const DataTrendsPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Read initial node and parameter from URL search params if present
  const initialNodeId = searchParams.get('node') || 'N04';
  const rawParam = searchParams.get('param');
  const initialParam: ParameterKey = (rawParam && rawParam in PARAMETER_CONFIGS) ? (rawParam as ParameterKey) : 'displacement';
  const initialRange = (searchParams.get('range') as TimeRangeKey) || '24H';

  const [availableNodes, setAvailableNodes] = useState<MapNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialNodeId);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedParam, setSelectedParam] = useState<ParameterKey>(initialParam);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeKey>(initialRange);
  const [isNormalizedMode, setIsNormalizedMode] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live series state from backend
  const [livePoints, setLivePoints] = useState<TelemetryPoint[] | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<ReturnType<typeof adaptHistoryToTelemetryTimeSeries>['metrics'] | null>(null);
  const [liveAnomalies, setLiveAnomalies] = useState<AnomalyTimelineItem[] | null>(null);

  // Parameters selected for normalized comparison
  const [comparisonParams, setComparisonParams] = useState<ParameterKey[]>([
    'displacement',
    'tilt',
    'vibration',
    'crackWidth',
  ]);

  // Parameter configuration with defensive fallback
  const paramConfig = PARAMETER_CONFIGS[selectedParam] || PARAMETER_CONFIGS.displacement;

  // Load available nodes on mount
  useEffect(() => {
    let active = true;
    nodesService
      .listNodes()
      .then((nodeSummaries) => {
        if (!active) return;
        if (nodeSummaries && nodeSummaries.length > 0) {
          const adapted = nodeSummaries.map((n) => adaptNodeSummaryToMapNode(n));
          setAvailableNodes(adapted);
          // Auto-select first node if the URL-specified node is not in the backend
          const exists = adapted.some((n) => n.id === initialNodeId);
          if (!exists && adapted.length > 0) {
            setSelectedNodeId(adapted[0].id);
          }
        }
      })
      .catch(() => {
        // Backend unavailable — availableNodes stays [] and empty state is shown
      });

    return () => {
      active = false;
    };
  }, [initialNodeId]);

  // Selected node object
  const selectedNode = useMemo(() => {
    return availableNodes.find((n) => n.id === selectedNodeId) || availableNodes[0] || null;
  }, [availableNodes, selectedNodeId]);

  // Fetch telemetry & AI anomaly history from backend
  const loadTelemetryData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const sensorType = mapParameterKeyToSensorType(selectedParam);
      const { from_dt, to_dt } = getTimeRangeDateBounds(selectedTimeRange);

      const [historyData, anomalyRecords] = await Promise.all([
        telemetryService.getHistory(selectedNodeId, {
          sensor_type: sensorType,
          from_dt,
          to_dt,
          limit: 250,
        }).catch(() => null),
        aiService.getAnomalyHistory(selectedNodeId, {
          sensor_type: sensorType,
          from_dt,
          limit: 100,
        }).catch(() => []),
      ]);

      if (historyData && historyData.readings && historyData.readings.length > 0) {
        const { points: adaptedPoints, metrics: adaptedMetrics } =
          adaptHistoryToTelemetryTimeSeries(
            historyData.readings,
            paramConfig.unit,
            paramConfig.defaultBaseline,
            anomalyRecords || []
          );

        setLivePoints(adaptedPoints);
        setLiveMetrics(adaptedMetrics);

        if (anomalyRecords && anomalyRecords.length > 0) {
          const timelineItems: AnomalyTimelineItem[] = anomalyRecords.map((a) => ({
            id: `AI-${a.id}`,
            time: formatUtcTime(a.detected_at) || a.detected_at.slice(11, 16),
            nodeId: selectedNodeId,
            parameter: paramConfig.label,
            event: a.explanation || `Anomaly score: ${a.anomaly_score.toFixed(2)}`,
            severity: a.is_anomaly ? 'Critical' : 'Info',
            status: a.is_anomaly ? 'Active Anomaly' : 'Nominal',
          }));
          setLiveAnomalies(timelineItems);
        } else {
          setLiveAnomalies([]);
        }

        setIsLiveBackend(true);
      } else {
        // Empty backend readings for this specific sensor -> fallback to simulation
        setLivePoints(null);
        setLiveMetrics(null);
        setLiveAnomalies(null);
        setIsLiveBackend(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Backend historical telemetry unavailable.'));
      setLivePoints(null);
      setLiveMetrics(null);
      setLiveAnomalies(null);
      setIsLiveBackend(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedNodeId, selectedParam, selectedTimeRange, paramConfig.unit, paramConfig.defaultBaseline, paramConfig.label]);

  // Initial and reactive query when filters change
  useEffect(() => {
    let active = true;
    const sensorType = mapParameterKeyToSensorType(selectedParam);
    const { from_dt, to_dt } = getTimeRangeDateBounds(selectedTimeRange);

    Promise.all([
      telemetryService.getHistory(selectedNodeId, {
        sensor_type: sensorType,
        from_dt,
        to_dt,
        limit: 250,
      }).catch(() => null),
      aiService.getAnomalyHistory(selectedNodeId, {
        sensor_type: sensorType,
        from_dt,
        limit: 100,
      }).catch(() => []),
    ]).then(([historyData, anomalyRecords]) => {
      if (!active) return;
      if (historyData && historyData.readings && historyData.readings.length > 0) {
        const { points: adaptedPoints, metrics: adaptedMetrics } =
          adaptHistoryToTelemetryTimeSeries(
            historyData.readings,
            paramConfig.unit,
            paramConfig.defaultBaseline,
            anomalyRecords || []
          );
        setLivePoints(adaptedPoints);
        setLiveMetrics(adaptedMetrics);

        if (anomalyRecords && anomalyRecords.length > 0) {
          const timelineItems: AnomalyTimelineItem[] = anomalyRecords.map((a) => ({
            id: `AI-${a.id}`,
            time: formatUtcTime(a.detected_at) || a.detected_at.slice(11, 16),
            nodeId: selectedNodeId,
            parameter: paramConfig.label,
            event: a.explanation || `Anomaly score: ${a.anomaly_score.toFixed(2)}`,
            severity: a.is_anomaly ? 'Critical' : 'Info',
            status: a.is_anomaly ? 'Active Anomaly' : 'Nominal',
          }));
          setLiveAnomalies(timelineItems);
        } else {
          setLiveAnomalies([]);
        }
        setIsLiveBackend(true);
      } else {
        setLivePoints(null);
        setLiveMetrics(null);
        setLiveAnomalies(null);
        setIsLiveBackend(false);
      }
    }).catch(() => {
      if (!active) return;
      setLivePoints(null);
      setLiveMetrics(null);
      setLiveAnomalies(null);
      setIsLiveBackend(false);
    });

    return () => {
      active = false;
    };
  }, [selectedNodeId, selectedParam, selectedTimeRange, paramConfig.unit, paramConfig.defaultBaseline, paramConfig.label]);

  // Time-series data and calculated derivatives (fallback to mock only if explicitly enabled)
  const mockSeries = useMemo(() => {
    return getTelemetryTimeSeries(selectedNodeId, selectedParam, selectedTimeRange);
  }, [selectedNodeId, selectedParam, selectedTimeRange]);

  const points: TelemetryPoint[] = useMemo(() => {
    if (livePoints && livePoints.length > 0) return livePoints;
    if (API_CONFIG.enableMockFallback) return mockSeries.points;
    return [];
  }, [livePoints, mockSeries.points]);

  const metrics = useMemo(() => {
    if (liveMetrics) return liveMetrics;
    if (API_CONFIG.enableMockFallback) return mockSeries.metrics;
    return {
      current: 0,
      baseline: paramConfig.defaultBaseline,
      delta: 0,
      percentChange: 0,
      rateOfChange: 0,
      acceleration: 0,
      accelerationStatus: 'Stable' as const,
      status: 'NORMAL' as const,
      unit: paramConfig.unit,
      trendDirection: 'Stable' as const,
    };
  }, [liveMetrics, mockSeries.metrics, paramConfig.defaultBaseline, paramConfig.unit]);

  const anomalyRegions = useMemo(() => {
    if (API_CONFIG.enableMockFallback) return mockSeries.anomalyRegions;
    return [];
  }, [mockSeries.anomalyRegions]);

  // Normalized multi-sensor series
  const normalizedSeries = useMemo(() => {
    return getNormalizedComparisonSeries(selectedNodeId, selectedTimeRange, comparisonParams);
  }, [selectedNodeId, selectedTimeRange, comparisonParams]);

  // Toggle normalized multi-sensor parameter checkbox
  const handleToggleComparisonParam = (paramKey: ParameterKey) => {
    setComparisonParams((prev) => {
      if (prev.includes(paramKey)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((k) => k !== paramKey);
      } else {
        return [...prev, paramKey];
      }
    });
  };

  // Node selection change
  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
    const node = availableNodes.find((n) => n.id === id);
    if (node && selectedZone !== 'ALL' && node.zone !== selectedZone) {
      setSelectedZone('ALL');
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    loadTelemetryData();
  };

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = [
      'Timestamp',
      'Node_ID',
      'Zone',
      'Parameter',
      'Value',
      'Baseline',
      'Deviation',
      'Unit',
      'Is_Anomaly',
    ];

    const rows = points.map((p: TelemetryPoint) => [
      p.timestamp,
      selectedNode.id,
      selectedNode.zone,
      paramConfig.label,
      p.value,
      p.baseline,
      p.deviation,
      paramConfig.unit,
      p.isAnomaly ? 'YES' : 'NO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: (string | number)[]) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `MineGuard_Telemetry_${selectedNode.id}_${selectedParam}_${selectedTimeRange}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer maxWidth="wide" className="mg-data-trends-page">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Data & Trends"
        subtitle="Historical sensor telemetry and deformation analysis"
        badge={
          <StatusIndicator
            status={isLiveBackend ? 'LIVE' : 'WARNING'}
            size="sm"
            customLabel={isLiveBackend ? 'Backend Telemetry Active' : 'Simulated Series'}
          />
        }
        actions={
          <div className="mg-data-trends-page__header-actions">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
              onClick={loadTelemetryData}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Polling...' : 'Poll Mesh'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleExportCsv}
            >
              Export Data
            </Button>
          </div>
        }
      />

      {/* OFFLINE / NOTICE BANNER */}
      {error && (
        <div style={{ marginBottom: '16px' }}>
          <AlertBanner
            severity={API_CONFIG.enableMockFallback ? 'warning' : 'critical'}
            title="Backend Telemetry Unavailable"
            message={
              API_CONFIG.enableMockFallback
                ? `${error} — Displaying simulated time-series data (Development Fallback Mode).`
                : `${error} — Unable to query historical telemetry observations from backend.`
            }
            action={
              <Button variant="secondary" size="sm" onClick={loadTelemetryData}>
                Retry Query
              </Button>
            }
          />
        </div>
      )}

      {/* 2. GLOBAL FILTER BAR */}
      <TrendsFilterBar
        nodes={availableNodes}
        selectedNodeId={selectedNodeId}
        onSelectNode={handleSelectNode}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
        selectedParam={selectedParam}
        onSelectParam={setSelectedParam}
        selectedTimeRange={selectedTimeRange}
        onSelectTimeRange={setSelectedTimeRange}
        isNormalizedMode={isNormalizedMode}
        onToggleNormalizedMode={() => setIsNormalizedMode(!isNormalizedMode)}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
        isRefreshing={isRefreshing}
      />

      {/* 3. SUMMARY CARDS (CURRENT, BASELINE, CHANGE, RATE OF CHANGE, STATUS) */}
      <TrendsSummaryCards
        metrics={metrics}
        paramLabel={paramConfig.label}
      />

      {/* 4. MAIN TELEMETRY CHART */}
      <MainTelemetryChart
        data={points}
        config={paramConfig}
        nodeId={selectedNode.id}
        nodeName={selectedNode.name}
        timeRange={selectedTimeRange}
        trendDirection={metrics.trendDirection}
        anomalyRegions={anomalyRegions}
        isNormalizedMode={isNormalizedMode}
        normalizedSeries={normalizedSeries}
      />

      {/* 5. SECONDARY ANALYSIS (RATE OF CHANGE, ACCELERATION, BASELINE DEVIATION) */}
      <SecondaryAnalysis
        metrics={metrics}
        nodeId={selectedNode.id}
      />

      {/* 6. MULTI-SENSOR CORRELATION ANALYSIS & HEATMAP */}
      <MultiSensorAnalysis
        nodeId={selectedNode.id}
        selectedParams={comparisonParams}
        onToggleParam={handleToggleComparisonParam}
      />

      {/* 7. ANOMALY TIMELINE & HISTORICAL SHIFT LOGS */}
      <AnomalyTimeline nodeId={selectedNode.id} items={liveAnomalies || undefined} />

      {/* 8. SPATIAL-TEMPORAL CLUSTERS & SECTOR ZONE COMPARISONS */}
      <SpatialTemporalAnalysis selectedNodeId={selectedNode.id} />

      {/* 9. RAW TELEMETRY DATA TABLE & EXPORT */}
      <TelemetryDataTable
        node={selectedNode}
        points={points}
        paramLabel={paramConfig.label}
        unit={paramConfig.unit}
        onExportCsv={handleExportCsv}
      />
    </PageContainer>
  );
};
