import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AlertBanner } from '../components/feedback/AlertBanner';
import { EmptyState } from '../components/feedback/EmptyState';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import {
  Brain,
  Cpu,
  TrendingUp,
  Activity,
  CheckCircle2,
  RefreshCw,
  Info,
  Sliders,
  Radio,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { nodesService } from '../services/nodesService';
import { AiModelCopilot } from '../components/analytics/AiModelCopilot';
import type {
  AIAnomalyRecordResponse,
  ModelMetadataResponse,
  NodeSummaryResponse,
} from '../types/api';
import { formatUtcDisplay } from '../utils/date';
import './AnalyticsPage.css';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'COPILOT' | 'MODELS' | 'INSPECTOR' | 'CREEP' | 'FAILURE'>('COPILOT');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveModels, setLiveModels] = useState<ModelMetadataResponse[]>([]);
  const [nodes, setNodes] = useState<NodeSummaryResponse[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('NODE-01');
  const [anomalyRecords, setAnomalyRecords] = useState<AIAnomalyRecordResponse[]>([]);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(false);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [filterOnlyAnomalies, setFilterOnlyAnomalies] = useState(false);

  // Load models and registered nodes
  const loadInitialData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [models, nodeList] = await Promise.all([
        aiService.getModels().catch(() => []),
        nodesService.listNodes().catch(() => []),
      ]);

      if (models && models.length > 0) {
        setLiveModels(models);
        setIsLiveBackend(true);
      }

      if (nodeList && nodeList.length > 0) {
        setNodes(nodeList);
        setSelectedNodeId((prev) =>
          nodeList.some((n) => n.node_identifier === prev) ? prev : nodeList[0].node_identifier
        );
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      aiService.getModels().catch(() => []),
      nodesService.listNodes().catch(() => []),
    ]).then(([models, nodeList]) => {
      if (!active) return;
      if (models && models.length > 0) {
        setLiveModels(models);
        setIsLiveBackend(true);
      }
      if (nodeList && nodeList.length > 0) {
        setNodes(nodeList);
        setSelectedNodeId((prev) =>
          nodeList.some((n) => n.node_identifier === prev) ? prev : nodeList[0].node_identifier
        );
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Load anomaly records for selected node (manual refresh)
  const loadNodeAnomalies = useCallback(async (nodeId: string) => {
    if (!nodeId) return;
    setIsLoadingAnomalies(true);
    try {
      const records = await aiService.getAnomalyHistory(nodeId, {
        limit: 50,
      });
      setAnomalyRecords(records);
    } catch {
      setAnomalyRecords([]);
    } finally {
      setIsLoadingAnomalies(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedNodeId) return;
    let active = true;
    aiService
      .getAnomalyHistory(selectedNodeId, { limit: 50 })
      .then((records) => {
        if (!active) return;
        setAnomalyRecords(records);
      })
      .catch(() => {
        if (!active) return;
        setAnomalyRecords([]);
      });

    return () => {
      active = false;
    };
  }, [selectedNodeId]);

  // Filter anomaly records
  const displayedRecords = filterOnlyAnomalies
    ? anomalyRecords.filter((r) => r.is_anomaly)
    : anomalyRecords;

  const totalEvaluationsCount = anomalyRecords.length;
  const activeAnomalyCount = anomalyRecords.filter((r) => r.is_anomaly).length;

  const failureModesReference = [
    {
      mode: 'Rotational Bench Crest Failure',
      riskLevel: 'HIGH',
      mechanism: 'Tension crack propagation at crest with circular slip surface along weathered shale strata.',
      mitigation: 'Implement immediate 50m crest exclusion buffer; berm toe buttressing recommended per TARP Level 3.',
      statusNote: 'Kinematic ML classification 🟡 TBD (Theoretical TARP reference)',
    },
    {
      mode: 'Planar Wedge Sliding',
      riskLevel: 'MODERATE',
      mechanism: 'Daylighting discontinuity planes intersecting dipping joint sets at steep inclination.',
      mitigation: 'Schedule horizontal depressurization drain drilling; maintain automated continuous sensor polling.',
      statusNote: 'Kinematic ML classification 🟡 TBD (Theoretical TARP reference)',
    },
    {
      mode: 'Underground Pillar Spalling',
      riskLevel: 'LOW',
      mechanism: 'Confined compressive stress concentration on rib pillars during retreat extraction.',
      mitigation: 'Visual inspect rib mesh support; rib deformation within safe design tolerances.',
      statusNote: 'Kinematic ML classification 🟡 TBD (Theoretical TARP reference)',
    },
  ];

  return (
    <PageContainer maxWidth="wide">
      <PageHeader
        title="AI Ground Instability Analytics"
        subtitle="Multi-sensor statistical anomaly detection, baseline deviation tracking, and assistive geotechnical early warning."
        badge={
          <StatusIndicator
            status={isLiveBackend ? 'LIVE' : 'WARNING'}
            size="sm"
            customLabel={
              isLiveBackend && liveModels.length > 0
                ? `Backend AI: ${liveModels.length} Model(s) Active`
                : 'AI Service Offline'
            }
          />
        }
        actions={
          <div className="mg-analytics-header-actions" style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant={activeTab === 'COPILOT' ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Sparkles size={14} />}
              onClick={() => setActiveTab('COPILOT')}
            >
              Ask AI Model
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isRefreshing || isLoadingAnomalies ? 'animate-spin' : ''} />}
              onClick={() => {
                loadInitialData();
                loadNodeAnomalies(selectedNodeId);
              }}
            >
              Refresh AI Models
            </Button>
          </div>
        }
      />

      {/* PROTOTYPE DEMONSTRATION NOTICE */}
      <div style={{ marginBottom: '16px' }}>
        <AlertBanner
          severity="info"
          title="Assistive Intelligence Model Architecture (Phase 7)"
          message="Backend AI operates strictly as assistive statistical intelligence (ADR D-032). Models compute rolling Z-scores and multi-parameter distances to flag novel sensor deviations. Deterministic Phase 6 safety rules remain authoritative."
        />
      </div>

      <div className="mg-analytics-layout">
        {/* TOP SUMMARY CARDS */}
        <div className="mg-analytics-summary-grid">
          <Card className="analytics-stat-card">
            <div className="stat-header">
              <span className="stat-label">Active AI Models</span>
              <Cpu size={16} className="stat-icon" />
            </div>
            <div className="stat-value-row">
              <span className="stat-value mono-telemetry">{liveModels.length}</span>
              <span className="stat-tag positive">
                {liveModels.length > 0 ? 'Online' : 'None'}
              </span>
            </div>
            <span className="stat-desc">
              {liveModels.map((m) => m.model_name).join(', ') || 'No active models detected'}
            </span>
          </Card>

          <Card className="analytics-stat-card">
            <div className="stat-header">
              <span className="stat-label">Node Evaluations</span>
              <Activity size={16} className="stat-icon warning" />
            </div>
            <div className="stat-value-row">
              <span className="stat-value mono-telemetry">
                {isLoadingAnomalies ? '...' : totalEvaluationsCount}
              </span>
              <span className="stat-tag normal">Evaluated</span>
            </div>
            <span className="stat-desc">Historical evaluation records for {selectedNodeId}</span>
          </Card>

          <Card className="analytics-stat-card">
            <div className="stat-header">
              <span className="stat-label">Detected Anomalies</span>
              <TrendingUp size={16} className={`stat-icon ${activeAnomalyCount > 0 ? 'danger' : 'normal'}`} />
            </div>
            <div className="stat-value-row">
              <span className={`stat-value mono-telemetry ${activeAnomalyCount > 0 ? 'danger' : ''}`}>
                {isLoadingAnomalies ? '...' : activeAnomalyCount}
              </span>
              <span className={`stat-tag ${activeAnomalyCount > 0 ? 'danger' : 'positive'}`}>
                {activeAnomalyCount > 0 ? 'Flagged' : 'Nominal'}
              </span>
            </div>
            <span className="stat-desc">Statistical threshold breaches on node {selectedNodeId}</span>
          </Card>

          <Card className="analytics-stat-card">
            <div className="stat-header">
              <span className="stat-label">Decision Authority</span>
              <CheckCircle2 size={16} className="stat-icon normal" />
            </div>
            <div className="stat-value-row">
              <span className="stat-value mono-telemetry normal">Assistive</span>
            </div>
            <span className="stat-desc">Non-overriding statistical advisory per BE-REQ-015</span>
          </Card>
        </div>

        {/* MODEL TABS */}
        <div className="mg-analytics-tabs-bar">
          <button
            type="button"
            className={`mg-analytics-tab ${activeTab === 'COPILOT' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('COPILOT')}
          >
            <Sparkles size={15} />
            <span>AI Copilot (Ask Model)</span>
            <span style={{ fontSize: '10px', background: 'rgba(217, 119, 6, 0.12)', color: '#b45309', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>Interactive</span>
          </button>
          <button
            type="button"
            className={`mg-analytics-tab ${activeTab === 'MODELS' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('MODELS')}
          >
            <Cpu size={15} />
            <span>Active AI Models ({liveModels.length})</span>
          </button>
          <button
            type="button"
            className={`mg-analytics-tab ${activeTab === 'INSPECTOR' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('INSPECTOR')}
          >
            <Radio size={15} />
            <span>Node Anomaly Inspector</span>
          </button>
          <button
            type="button"
            className={`mg-analytics-tab ${activeTab === 'CREEP' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('CREEP')}
          >
            <TrendingUp size={15} />
            <span>Kinematic Creep Theory</span>
          </button>
          <button
            type="button"
            className={`mg-analytics-tab ${activeTab === 'FAILURE' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('FAILURE')}
          >
            <Brain size={15} />
            <span>Failure Mechanisms (Reference)</span>
          </button>
        </div>

        {/* TAB 0: INTERACTIVE AI COPILOT */}
        {activeTab === 'COPILOT' && (
          <AiModelCopilot nodes={nodes} defaultNodeId={selectedNodeId} />
        )}

        {/* TAB 1: ACTIVE MODELS */}
        {activeTab === 'MODELS' && (
          <div className="mg-analytics-section-grid">
            <Card className="analytics-main-panel">
              <div className="panel-title-row">
                <div className="title-group">
                  <Sliders size={18} className="title-icon" />
                  <h3 className="panel-title">Registered Anomaly Detection Models</h3>
                </div>
                <span className="panel-badge mono-telemetry">Backend Phase 7</span>
              </div>
              <p className="panel-desc">
                The backend runs unsupervised statistical models on ingested multi-sensor batches. Because mine slope failure datasets with labeled ground truth are unavailable, models establish rolling baselines without synthetic pre-training.
              </p>

              {liveModels.length === 0 ? (
                <EmptyState
                  title="No AI Models Available"
                  description="Could not load active model metadata from /api/v1/ai/models. Ensure backend is running."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  {liveModels.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '15px' }}>{m.model_name}</strong>
                          <span className="mono-telemetry" style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            v{m.model_version}
                          </span>
                        </div>
                        <span
                          className="mono-telemetry"
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                          }}
                        >
                          {m.algorithm}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                        {m.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', marginBottom: '12px' }}>
                        {Object.entries(m.parameters || {}).map(([k, v]) => (
                          <div key={k} className="mono-telemetry" style={{ background: 'var(--color-bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>{k}: </span>
                            <strong>{String(v)}</strong>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={12} />
                        <span>{m.disclaimer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="analytics-side-panel">
              <div className="title-group">
                <Info size={16} className="title-icon" />
                <h4 className="panel-title">Assisted Anomaly Architecture</h4>
              </div>
              <div className="principles-list">
                <div className="principle-box">
                  <strong>Statistical Z-Score (D-029):</strong>
                  <p>Evaluates deviation of each reading from the rolling baseline mean divided by standard deviation (Z &gt; 3.0).</p>
                </div>
                <div className="principle-box">
                  <strong>Multivariate Covariance (D-030):</strong>
                  <p>Correlates sensor channels (e.g. displacement with tilt) using covariance distance to catch joint shifts.</p>
                </div>
                <div className="principle-box">
                  <strong>Strict Non-Override (D-032):</strong>
                  <p>AI anomalies do not override Phase 6 TARP rules or auto-dismiss physical threshold alerts.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: NODE ANOMALY INSPECTOR */}
        {activeTab === 'INSPECTOR' && (
          <Card className="analytics-main-panel">
            <div className="panel-title-row" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div className="title-group">
                <FileCode size={18} className="title-icon" />
                <h3 className="panel-title">Node Anomaly Evaluation Explorer</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Node:</span>
                  <select
                    value={selectedNodeId}
                    onChange={(e) => setSelectedNodeId(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  >
                    {nodes.length > 0 ? (
                      nodes.map((n) => (
                        <option key={n.id} value={n.node_identifier}>
                          {n.node_identifier}
                        </option>
                      ))
                    ) : (
                      <option value="NODE-01">NODE-01</option>
                    )}
                  </select>
                </label>

                <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filterOnlyAnomalies}
                    onChange={(e) => setFilterOnlyAnomalies(e.target.checked)}
                  />
                  <span>Anomalies Only</span>
                </label>
              </div>
            </div>

            <p className="panel-desc">
              Inspect raw evaluations emitted by backend detectors for <strong>{selectedNodeId}</strong>. Each record logs whether statistical thresholding exceeded the configured Z-score limit.
            </p>

            {isLoadingAnomalies ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Loading anomaly records from backend…
              </div>
            ) : displayedRecords.length === 0 ? (
              <EmptyState
                title={filterOnlyAnomalies ? "No Statistical Anomalies Detected" : "No Evaluation Records Found"}
                description={`Node ${selectedNodeId} currently has zero ${filterOnlyAnomalies ? 'anomalies' : 'records'} logged in the backend anomaly table.`}
              />
            ) : (
              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '8px' }}>Timestamp (UTC)</th>
                      <th style={{ padding: '8px' }}>Sensor Type</th>
                      <th style={{ padding: '8px' }}>Status</th>
                      <th style={{ padding: '8px' }}>Score / Threshold</th>
                      <th style={{ padding: '8px' }}>Model</th>
                      <th style={{ padding: '8px' }}>Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRecords.map((rec) => (
                      <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td className="mono-telemetry" style={{ padding: '8px', fontSize: '12px' }}>
                          {formatUtcDisplay(rec.detected_at)}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 500 }}>
                          {rec.sensor_type || 'Multi-Sensor'}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: rec.is_anomaly ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                              color: rec.is_anomaly ? 'var(--color-critical)' : 'var(--color-normal)',
                            }}
                          >
                            {rec.is_anomaly ? 'ANOMALY' : 'NOMINAL'}
                          </span>
                        </td>
                        <td className="mono-telemetry" style={{ padding: '8px' }}>
                          {rec.anomaly_score.toFixed(2)} / {rec.threshold.toFixed(1)}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                          {rec.model_name}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                          {rec.explanation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* TAB 3: SAITO CREEP THEORY */}
        {activeTab === 'CREEP' && (
          <Card className="analytics-main-panel">
            <div className="panel-title-row">
              <div className="title-group">
                <TrendingUp size={18} className="title-icon" />
                <h3 className="panel-title">Saito / Voight Creep Acceleration Theory (Educational Reference)</h3>
              </div>
              <span className="creep-stage-tag warning mono-telemetry">Theory Reference • 🟡 Kinematic ML TBD</span>
            </div>
            <p className="panel-desc">
              Inverse velocity analysis (1/v vs Time). In empirical geotechnical mechanics, reciprocal velocity approaches zero prior to catastrophic shear release.
            </p>

            {/* SVG Creep Curve */}
            <div className="creep-chart-container">
              <svg viewBox="0 0 700 220" className="creep-svg">
                <line x1="60" y1="20" x2="680" y2="20" stroke="var(--color-border-subtle)" />
                <line x1="60" y1="80" x2="680" y2="80" stroke="var(--color-border-subtle)" />
                <line x1="60" y1="140" x2="680" y2="140" stroke="var(--color-border-subtle)" />
                <line x1="60" y1="180" x2="680" y2="180" stroke="var(--color-border)" strokeWidth="1.5" />
                <line x1="60" y1="20" x2="60" y2="180" stroke="var(--color-border)" strokeWidth="1.5" />

                <line x1="220" y1="20" x2="220" y2="180" stroke="#3b82f6" strokeDasharray="4 4" opacity="0.4" />
                <line x1="460" y1="20" x2="460" y2="180" stroke="#f97316" strokeDasharray="4 4" opacity="0.4" />

                <text x="140" y="35" fill="var(--color-text-muted)" fontSize="11" textAnchor="middle">Phase I: Primary (Decelerating)</text>
                <text x="340" y="35" fill="var(--color-text-muted)" fontSize="11" textAnchor="middle">Phase II: Secondary (Steady)</text>
                <text x="570" y="35" fill="var(--color-high-risk)" fontSize="11" textAnchor="middle" fontWeight="bold">Phase III: Tertiary (Accelerating)</text>

                <path
                  d="M 60,170 Q 140,165 220,150 T 460,110 Q 560,75 640,25"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                <text x="25" y="100" fill="var(--color-text-muted)" fontSize="11" transform="rotate(-90 25 100)" textAnchor="middle">Displacement u (mm)</text>
                <text x="370" y="205" fill="var(--color-text-muted)" fontSize="11" textAnchor="middle">Elapsed Time (Hours)</text>
              </svg>
            </div>

            <div className="creep-advisory-box">
              <Info size={18} className="advisory-icon" />
              <div>
                <strong>Implementation Status Note:</strong>
                <p>
                  Automatic tertiary creep inflection prediction requires site-specific shear strength parameters and geotechnical curve-fitting algorithms (🟡 TBD). The backend currently evaluates statistical velocity thresholds via Phase 6 rules and Phase 7 rolling Z-scores.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 4: FAILURE MECHANISMS */}
        {activeTab === 'FAILURE' && (
          <div className="failure-modes-list">
            <div style={{ gridColumn: '1 / -1', marginBottom: '8px' }}>
              <AlertBanner
                severity="info"
                title="Geotechnical TARP Failure Mechanism Reference"
                message="Specific failure mode classifications below represent standard open-pit mining hazards and TARP mitigation templates. Automated AI probability classification is 🟡 TBD and not provided by the backend."
              />
            </div>
            {failureModesReference.map((fm, idx) => (
              <Card key={idx} className="failure-mode-card">
                <div className="failure-header">
                  <div className="failure-title-group">
                    <span className={`failure-risk-pill ${fm.riskLevel.toLowerCase()}`}>
                      {fm.riskLevel} SEVERITY
                    </span>
                    <h4 className="failure-name">{fm.mode}</h4>
                  </div>
                  <span className="mono-telemetry" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {fm.statusNote}
                  </span>
                </div>

                <div className="failure-content">
                  <div className="failure-detail">
                    <span className="detail-label">Geological Mechanism:</span>
                    <p>{fm.mechanism}</p>
                  </div>
                  <div className="failure-detail">
                    <span className="detail-label">Recommended Mitigation Protocol:</span>
                    <p className="mitigation-text">{fm.mitigation}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
