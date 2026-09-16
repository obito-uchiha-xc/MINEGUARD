import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  AlertOctagon,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Check,
  Search,
  Compass,
  FileText,
} from 'lucide-react';
import type { MineAlert, AlertSeverityLevel, AlertOperationalStatus } from '../../data/mock/alertsCenter';
import { Button } from '../ui/Button';
import './AlertDetailsDrawer.css';

export interface AlertDetailsDrawerProps {
  alert: MineAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (alertId: string, newStatus: AlertOperationalStatus, notes?: string) => void;
}

export const AlertDetailsDrawer: React.FC<AlertDetailsDrawerProps> = ({
  alert,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const navigate = useNavigate();
  const [resolutionInput, setResolutionInput] = useState('');
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [supervisorName, setSupervisorName] = useState('Chief Geotech Eng. K. Robertson (DGMS-GT-8841)');
  const [checkCracks, setCheckCracks] = useState(true);
  const [checkRate, setCheckRate] = useState(true);
  const [checkRamp, setCheckRamp] = useState(true);

  if (!isOpen || !alert) return null;

  const renderSeverityBadge = (sev: AlertSeverityLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="mg-alert-drawer__sev-badge mg-alert-drawer__sev-badge--critical">
            <AlertOctagon size={14} aria-hidden="true" />
            <span>CRITICAL</span>
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="mg-alert-drawer__sev-badge mg-alert-drawer__sev-badge--high-risk">
            <Flame size={14} aria-hidden="true" />
            <span>HIGH RISK</span>
          </span>
        );
      case 'WARNING':
      default:
        return (
          <span className="mg-alert-drawer__sev-badge mg-alert-drawer__sev-badge--warning">
            <AlertTriangle size={14} aria-hidden="true" />
            <span>WARNING</span>
          </span>
        );
    }
  };

  const renderStatusBadge = (status: AlertOperationalStatus) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="mg-alert-drawer__status mg-alert-drawer__status--new">
            <span className="dot dot--pulse" />
            <span>New (Unacknowledged)</span>
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="mg-alert-drawer__status mg-alert-drawer__status--acknowledged">
            <Check size={13} />
            <span>Acknowledged</span>
          </span>
        );
      case 'INVESTIGATING':
        return (
          <span className="mg-alert-drawer__status mg-alert-drawer__status--investigating">
            <Clock size={13} />
            <span>Under Investigation</span>
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="mg-alert-drawer__status mg-alert-drawer__status--resolved">
            <CheckCircle2 size={13} />
            <span>Resolved</span>
          </span>
        );
    }
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionInput.trim()) return;
    const checklistNotes = [
      checkCracks ? '✓ Tension cracks surveyed' : '',
      checkRate ? '✓ Creep rate < 1.0mm/day' : '',
      checkRamp ? '✓ Ramp clearance signed' : '',
    ].filter(Boolean).join(' | ');
    const fullNotes = `[SUPERVISOR SIGN-OFF: ${supervisorName}] — ${resolutionInput.trim()} (${checklistNotes})`;
    onStatusChange(alert.id, 'RESOLVED', fullNotes);
    setResolutionInput('');
    setShowResolveDialog(false);
  };

  // Sparkline data points
  const sparklineData: number[] = alert.sparkline || [
    Math.max(1, alert.riskScore - 28),
    Math.max(2, alert.riskScore - 22),
    Math.max(4, alert.riskScore - 15),
    Math.max(6, alert.riskScore - 10),
    Math.max(8, alert.riskScore - 4),
    alert.riskScore,
  ];

  return (
    <div className="mg-alert-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="mg-alert-drawer"
        role="dialog"
        aria-label={`Details for alert ${alert.id}`}
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAWER HEADER */}
        <header className="mg-alert-drawer__header">
          <div className="mg-alert-drawer__header-meta">
            <div className="mg-alert-drawer__header-tags">
              {renderSeverityBadge(alert.severity)}
              <span className="mg-alert-drawer__id mono-telemetry">{alert.id}</span>
              <span className="mg-alert-drawer__node mono-telemetry">
                Node {alert.nodeId} · {alert.zone} · {alert.panel}
              </span>
            </div>
            <h2 className="mg-alert-drawer__title">{alert.title}</h2>
            <div className="mg-alert-drawer__timestamp mono-telemetry">
              Detected: {alert.timestamp} ({alert.relativeTime})
            </div>
          </div>
          <button
            type="button"
            className="mg-alert-drawer__close-btn"
            onClick={onClose}
            aria-label="Close alert details drawer"
          >
            <X size={20} />
          </button>
        </header>

        {/* STATUS ACTION TOOLBAR */}
        <section className="mg-alert-drawer__status-bar">
          <div className="status-current">
            <span className="label">Status:</span>
            {renderStatusBadge(alert.status)}
          </div>

          <div className="status-actions">
            {alert.status === 'NEW' && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Check size={14} />}
                onClick={() => onStatusChange(alert.id, 'ACKNOWLEDGED')}
              >
                Acknowledge
              </Button>
            )}

            {(alert.status === 'NEW' || alert.status === 'ACKNOWLEDGED') && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Search size={14} />}
                onClick={() => onStatusChange(alert.id, 'INVESTIGATING')}
              >
                Start Investigation
              </Button>
            )}

            {alert.status !== 'RESOLVED' && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<CheckCircle2 size={14} />}
                onClick={() => setShowResolveDialog(true)}
              >
                Resolve Alert
              </Button>
            )}
          </div>
        </section>

        {/* RESOLVE DIALOG FORM WITH STATUTORY SIGN-OFF */}
        {showResolveDialog && (
          <form className="mg-alert-drawer__resolve-dialog" onSubmit={handleResolveSubmit}>
            <h4>DGMS / MSHA Statutory Sign-Off &amp; Resolution</h4>
            <p>
              Verify geotechnical remediation checklists and submit authorized supervisor credentials to resolve alert {alert.id}.
            </p>

            <div className="mg-resolve-supervisor-field">
              <label>Authorized Geotechnical Supervisor:</label>
              <input
                type="text"
                required
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="mg-resolve-input"
              />
            </div>

            <div className="mg-resolve-checklist">
              <label className="mg-check-row">
                <input
                  type="checkbox"
                  checked={checkCracks}
                  onChange={(e) => setCheckCracks(e.target.checked)}
                />
                <span>Physical bench crack inspection completed</span>
              </label>
              <label className="mg-check-row">
                <input
                  type="checkbox"
                  checked={checkRate}
                  onChange={(e) => setCheckRate(e.target.checked)}
                />
                <span>Multi-sensor velocity confirmed stabilized below TARP 1</span>
              </label>
              <label className="mg-check-row">
                <input
                  type="checkbox"
                  checked={checkRamp}
                  onChange={(e) => setCheckRamp(e.target.checked)}
                />
                <span>Pit haulage ramp clearance signed &amp; exclusion removed</span>
              </label>
            </div>

            <textarea
              required
              rows={2}
              placeholder="Detailed engineering mitigation summary (e.g., secondary cable bolts installed, bench drained)..."
              value={resolutionInput}
              onChange={(e) => setResolutionInput(e.target.value)}
              className="mg-resolve-textarea"
            />
            <div className="mg-resolve-actions">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowResolveDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Sign &amp; Resolve Alert
              </Button>
            </div>
          </form>
        )}

        {/* DRAWER BODY (SCROLLABLE CONTENT) */}
        <div className="mg-alert-drawer__body">
          {/* AUDIT TIMELINE INFO IF ANY ACTION TAKEN */}
          {(alert.acknowledgedBy || alert.investigatingBy || alert.resolvedBy) && (
            <div className="mg-alert-drawer__audit-box">
              <span className="audit-title">Operational Lifecycle History:</span>
              <ul className="audit-list">
                {alert.acknowledgedBy && (
                  <li>
                    <Check size={12} className="audit-icon ack" />
                    <span>
                      Acknowledged by <strong>{alert.acknowledgedBy}</strong> at{' '}
                      <span className="mono-telemetry">{alert.acknowledgedAt}</span>
                    </span>
                  </li>
                )}
                {alert.investigatingBy && (
                  <li>
                    <Clock size={12} className="audit-icon inv" />
                    <span>
                      Investigation commenced by <strong>{alert.investigatingBy}</strong> at{' '}
                      <span className="mono-telemetry">{alert.investigatingAt}</span>
                    </span>
                  </li>
                )}
                {alert.resolvedBy && (
                  <li>
                    <CheckCircle2 size={12} className="audit-icon res" />
                    <div>
                      <span>
                        Resolved by <strong>{alert.resolvedBy}</strong> at{' '}
                        <span className="mono-telemetry">{alert.resolvedAt}</span>
                      </span>
                      {alert.resolutionNotes && (
                        <p className="audit-notes">"{alert.resolutionNotes}"</p>
                      )}
                    </div>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* SUMMARY CARDS / RISK METRICS */}
          <div className="mg-alert-drawer__metric-grid">
            <div className="metric-box">
              <span className="metric-box__label">Risk Index</span>
              <div className="metric-box__value-row">
                <span className="metric-box__val mono-telemetry font-bold">
                  {alert.riskScore}
                </span>
                <span className="metric-box__denom">/ 100</span>
              </div>
              <span className="metric-box__sub mono-telemetry">
                Trend: {alert.riskTrend}
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-box__label">Detection Confidence</span>
              <div className="metric-box__value-row">
                <span className="metric-box__val mono-telemetry font-bold">
                  {alert.confidencePct}%
                </span>
              </div>
              <span className="metric-box__sub">Multi-sensor consensus</span>
            </div>

            <div className="metric-box">
              <span className="metric-box__label">Active Duration</span>
              <div className="metric-box__value-row">
                <span className="metric-box__val mono-telemetry font-bold">
                  {alert.duration}
                </span>
              </div>
              <span className="metric-box__sub">Continuous deviation</span>
            </div>

            <div className="metric-box">
              <span className="metric-box__label">Telemetry Rate</span>
              <div className="metric-box__value-row">
                <span className="metric-box__val mono-telemetry font-bold">
                  {alert.telemetryRate || 'Escalated (5s)'}
                </span>
              </div>
              <span className="metric-box__sub">Escalated polling mode</span>
            </div>
          </div>

          {/* EXPLAINABILITY / WHY THIS ALERT WAS GENERATED */}
          <section className="mg-alert-drawer__section">
            <h3 className="section-title">
              <Activity size={16} />
              <span>Why This Alert Was Generated</span>
            </h3>
            <div className="mg-alert-drawer__reason-box">
              <p className="reason-text">{alert.reasoning || alert.description}</p>
            </div>
          </section>

          {/* CONTRIBUTING SENSORS BREAKDOWN */}
          <section className="mg-alert-drawer__section">
            <div className="section-title-row">
              <h3 className="section-title">
                <Layers size={16} />
                <span>Contributing Telemetry Sensors</span>
              </h3>
              <span className="sensor-ratio mono-telemetry">
                {alert.contributingCount} of {alert.totalSensorsCount} sensors active
              </span>
            </div>

            <div className="mg-alert-drawer__sensor-table-wrapper">
              <table className="mg-alert-drawer__sensor-table">
                <thead>
                  <tr>
                    <th>Sensor</th>
                    <th>Current Value</th>
                    <th>Baseline</th>
                    <th>Deviation</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alert.contributingSensors.map((s, idx) => (
                    <tr key={idx} className={s.isContributing ? 'is-deviated' : ''}>
                      <td className="sensor-name">
                        <span className={`status-indicator ${s.isContributing ? 'deviated' : 'normal'}`} />
                        <strong>{s.sensor}</strong>
                      </td>
                      <td className="mono-telemetry">{s.currentVal}</td>
                      <td className="mono-telemetry muted">{s.baselineVal}</td>
                      <td className={`mono-telemetry deviation ${s.isContributing ? 'alert' : ''}`}>
                        {s.deviation}
                      </td>
                      <td>
                        <span className={`sensor-tag ${s.isContributing ? 'sensor-tag--alert' : 'sensor-tag--ok'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* MINI TREND SPARKLINE PREVIEW */}
          <section className="mg-alert-drawer__section">
            <h3 className="section-title">
              <TrendingUp size={16} />
              <span>Telemetry Progression Trend</span>
            </h3>
            <div className="sparkline-card">
              <div className="sparkline-header">
                <span>Anomaly Risk Metric Progression</span>
                <span className="mono-telemetry current-disp">
                  Latest: {sparklineData[sparklineData.length - 1]} / 100
                </span>
              </div>
              <div className="sparkline-svg-container">
                <svg
                  viewBox="0 0 300 60"
                  preserveAspectRatio="none"
                  className="sparkline-svg"
                >
                  <defs>
                    <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const pts = sparklineData;
                    const min = Math.min(...pts);
                    const max = Math.max(...pts);
                    const range = max - min || 1;
                    const coords = pts.map((val: number, i: number) => {
                      const x = (i / (pts.length - 1)) * 300;
                      const y = 55 - ((val - min) / range) * 45;
                      return `${x},${y}`;
                    });
                    const linePath = `M ${coords.join(' L ')}`;
                    const areaPath = `M 0,60 L ${coords.join(' L ')} L 300,60 Z`;
                    return (
                      <>
                        <path d={areaPath} fill="url(#alertGrad)" />
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="sparkline-footer mono-telemetry">
                <span>Initial Detection</span>
                <span>Mid Interval</span>
                <span>Present Telemetry</span>
              </div>
            </div>
          </section>

          {/* SPATIAL CORRELATION & CLUSTER ANALYSIS */}
          {alert.spatialCorrelation && (
            <section className="mg-alert-drawer__section">
              <h3 className="section-title">
                <Compass size={16} />
                <span>Spatial Correlation & Cluster Context</span>
              </h3>
              <div className="spatial-box">
                <div className="spatial-cluster">
                  <span className="spatial-label">Correlated Cluster Nodes:</span>
                  <div className="cluster-tags">
                    {alert.spatialCorrelation.nearbyNodes.map((cn: string, i: number) => (
                      <span key={i} className="cluster-tag mono-telemetry">
                        {cn}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="spatial-context">{alert.spatialCorrelation.clusterSummary}</p>
              </div>
            </section>
          )}

          {/* TEMPORAL PROGRESSION SEQUENCE */}
          {alert.temporalProgression && alert.temporalProgression.length > 0 && (
            <section className="mg-alert-drawer__section">
              <h3 className="section-title">
                <Clock size={16} />
                <span>Temporal Progression Sequence</span>
              </h3>
              <div className="temporal-timeline">
                {alert.temporalProgression.map((step: { time: string; parameter: string; description: string }, idx: number) => (
                  <div key={idx} className="temporal-step">
                    <div className="temporal-marker">
                      <div className="temporal-dot" />
                      {idx < alert.temporalProgression.length - 1 && <div className="temporal-line" />}
                    </div>
                    <div className="temporal-content">
                      <div className="temporal-header">
                        <span className="temporal-time mono-telemetry">{step.time}</span>
                        <span className="temporal-event">{step.parameter}</span>
                      </div>
                      <p className="temporal-desc">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* RECOMMENDED OPERATIONAL ACTIONS */}
          {alert.recommendedAction && (
            <section className="mg-alert-drawer__section">
              <h3 className="section-title">
                <ShieldCheck size={16} />
                <span>Recommended Operational Actions</span>
              </h3>
              <ul className="recommended-list">
                <li className="recommended-item">
                  <ArrowRight size={14} className="action-arrow" />
                  <span>{alert.recommendedAction}</span>
                </li>
              </ul>
            </section>
          )}

          {/* DEEP NAVIGATION LINKS */}
          <section className="mg-alert-drawer__section deep-links-section">
            <h3 className="section-title">
              <ExternalLink size={16} />
              <span>Cross-Module Deep Links</span>
            </h3>
            <div className="deep-links-grid">
              <button
                type="button"
                className="deep-link-card"
                onClick={() => {
                  onClose();
                  navigate(`/live-map?node=${alert.nodeId}`);
                }}
              >
                <MapPin size={18} className="deep-link-icon" />
                <div className="deep-link-info">
                  <strong>Inspect on Live Mine Map</strong>
                  <span>Locate {alert.nodeId} in {alert.zone} spatial GIS</span>
                </div>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                className="deep-link-card"
                onClick={() => {
                  onClose();
                  navigate(`/nodes?node=${alert.nodeId}`);
                }}
              >
                <FileText size={18} className="deep-link-icon" />
                <div className="deep-link-info">
                  <strong>Node Telemetry Profile</strong>
                  <span>View sensor health and battery for {alert.nodeId}</span>
                </div>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                className="deep-link-card"
                onClick={() => {
                  onClose();
                  navigate(`/data-trends?node=${alert.nodeId}`);
                }}
              >
                <TrendingUp size={18} className="deep-link-icon" />
                <div className="deep-link-info">
                  <strong>Analyze Historical Telemetry</strong>
                  <span>Plot multi-sensor trends & correlation analysis</span>
                </div>
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};
