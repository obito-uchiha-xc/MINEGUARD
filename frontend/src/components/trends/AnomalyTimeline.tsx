import React from 'react';
import { Clock, History, Info } from 'lucide-react';
import type { AnomalyTimelineItem } from '../../data/mock/trendsAnalysis';
import './AnomalyTimeline.css';

export interface AnomalyTimelineProps {
  nodeId: string;
  /**
   * Real AI anomaly records from backend Phase 7 (aiService.getAnomalyHistory).
   * When undefined = still loading. When [] = backend returned no anomalies.
   */
  items?: AnomalyTimelineItem[];
  isLoading?: boolean;
}

export const AnomalyTimeline: React.FC<AnomalyTimelineProps> = ({
  nodeId,
  items,
  isLoading = false,
}) => {
  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'sev-critical';
      case 'High':
        return 'sev-high';
      case 'Warning':
        return 'sev-warning';
      case 'Info':
      default:
        return 'sev-info';
    }
  };

  const renderAnomalyContent = () => {
    if (isLoading) {
      return (
        <div className="mg-timeline-empty">
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Loading anomaly records from backend…
          </span>
        </div>
      );
    }

    if (!items || items.length === 0) {
      return (
        <div className="mg-timeline-empty">
          <div className="mg-drawer__info-notice" style={{ marginTop: 0 }}>
            <Info size={13} />
            <span>
              No AI anomaly records returned for node <strong>{nodeId}</strong> in this
              time window. The Phase 7 anomaly detector logs events only when statistical
              deviations exceed the configured detection threshold.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="mg-timeline-list">
        {items.map((item) => (
          <div key={item.id} className="mg-timeline-item">
            <div className="mg-timeline-item__indicator">
              <div className={`indicator-dot ${getSeverityBadgeClass(item.severity)}`} />
              <div className="indicator-line" />
            </div>
            <div className="mg-timeline-item__content">
              <div className="mg-timeline-item__top">
                <span className="time mono-telemetry">{item.time}</span>
                <span className={`sev-badge ${getSeverityBadgeClass(item.severity)}`}>
                  {item.severity}
                </span>
                <span className="param-tag">{item.parameter}</span>
              </div>
              <div className="event-desc">{item.event}</div>
              <div className="event-status mono-telemetry" style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {item.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mg-timeline-panel-grid">
      {/* 1. REAL-TIME ANOMALY TIMELINE — sourced from Phase 7 AI backend */}
      <div className="mg-timeline-card">
        <div className="mg-timeline-card__header">
          <div className="mg-timeline-card__title-row">
            <Clock size={16} className="text-primary" />
            <h4 className="mg-timeline-card__title">AI Anomaly Timeline</h4>
          </div>
          <span className="mg-timeline-card__badge mono-telemetry">
            Phase 7 Detection • {nodeId}
          </span>
        </div>

        <p className="mg-timeline-card__desc">
          Statistical anomaly evaluation records from the Phase 7 unsupervised detector.
          These are assistive observations only and do not replace Phase 6 deterministic
          safety rules.
        </p>

        {renderAnomalyContent()}
      </div>

      {/* 2. HISTORICAL SHIFT LOGS — requires operator logging API (not in Phase 0–10) */}
      <div className="mg-timeline-card">
        <div className="mg-timeline-card__header">
          <div className="mg-timeline-card__title-row">
            <History size={16} className="text-secondary" />
            <h4 className="mg-timeline-card__title">Historical Shift Logs</h4>
          </div>
          <span className="mg-timeline-card__badge mono-telemetry">Not Available</span>
        </div>

        <p className="mg-timeline-card__desc">
          Operator-annotated shift change records and geotechnical observation notes.
        </p>

        <div className="mg-drawer__info-notice">
          <Info size={13} />
          <span>
            Shift log entries require an operator event-logging API endpoint.
            This feature is not implemented in backend Phases 0–10. Shift notes
            must be recorded through your site's Mine Management System (MMS) and
            linked in a future integration phase.
          </span>
        </div>
      </div>
    </div>
  );
};
