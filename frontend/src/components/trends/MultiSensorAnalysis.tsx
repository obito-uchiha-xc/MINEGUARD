import React from 'react';
import { Layers, Info, CheckSquare, Square } from 'lucide-react';
import type { ParameterKey } from '../../data/mock/trendsAnalysis';
import { PARAMETER_CONFIGS } from '../../data/mock/trendsAnalysis';
import './MultiSensorAnalysis.css';

export interface MultiSensorAnalysisProps {
  nodeId: string;
  selectedParams: ParameterKey[];
  onToggleParam: (param: ParameterKey) => void;
}

/**
 * Multi-Sensor Analysis Panel — Phase 16
 *
 * The sensor correlation heatmap (Pearson r-matrix) previously displayed
 * fabricated coefficients. The backend (Phases 0–10) does not compute
 * cross-sensor correlation. This section now shows an honest disclaimer.
 *
 * The parameter selector on the right is real: it controls which sensors
 * are overlaid in the normalized chart on the main telemetry chart above.
 */
export const MultiSensorAnalysis: React.FC<MultiSensorAnalysisProps> = ({
  nodeId,
  selectedParams,
  onToggleParam,
}) => {
  // All available parameter keys from the config (used for the overlay toggle)
  const params: ParameterKey[] = [
    'displacement',
    'tilt',
    'vibration',
    'crackWidth',
    'soilMoisture',
    'temperature',
    'gas',
  ];

  return (
    <div className="mg-multi-sensor-panel">
      <div className="mg-multi-sensor-panel__header">
        <div className="mg-multi-sensor-panel__title-row">
          <Layers size={18} className="text-primary" />
          <h3 className="mg-multi-sensor-panel__title">
            Multi-Sensor Cross-Parameter Analysis
          </h3>
        </div>
        <span className="mg-multi-sensor-panel__badge mono-telemetry">
          Node {nodeId}
        </span>
      </div>

      <div className="mg-multi-sensor-grid">
        {/* LEFT: CORRELATION MATRIX — HONEST UNAVAILABILITY NOTICE */}
        <div className="mg-correlation-box">
          <h4 className="mg-sub-section-title">SENSOR CORRELATION MATRIX</h4>
          <p className="mg-sub-section-desc">
            Pairwise cross-sensor correlation coefficients (Pearson r) indicating
            co-variance during deformation cycles.
          </p>

          <div
            className="mg-drawer__info-notice"
            style={{ marginTop: '12px', flexDirection: 'column', gap: '8px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                  Correlation Computation Not Available
                </p>
                <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
                  The backend (Phases 0–10) stores individual sensor readings but does
                  not compute Pearson correlation coefficients between sensor streams.
                  A cross-sensor analytics API is required to populate this matrix with
                  verified data.
                </p>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              This section is documented as <strong>TBD</strong> in{' '}
              <code>docs/FRONTEND_UNKNOWNs.md</code>. The multi-sensor normalized overlay
              above the chart is the currently supported way to compare sensor trends.
            </p>
          </div>
        </div>

        {/* RIGHT: NORMALIZED OVERLAY PARAMETER SELECTOR */}
        <div className="mg-relationship-box">
          <h4 className="mg-sub-section-title">NORMALIZED OVERLAY CONTROLS</h4>
          <div className="mg-relationship-card">
            <p className="mg-relationship-card__text">
              Select which sensor parameters to include in the normalized (0–100%
              deviation) overlay on the main telemetry chart. Each selected parameter
              will be fetched from the backend using the current time range.
            </p>
            <div className="mg-relationship-card__conclusion">
              <span className="bullet">●</span>
              <span>
                <strong>Note:</strong> Only parameters with actual backend readings for
                node <strong>{nodeId}</strong> will produce visible chart lines.
                Parameters without data will show flat lines or be absent.
              </span>
            </div>
          </div>

          {/* SENSOR STATE SELECTION PILLS */}
          <div className="mg-sensor-state-summary">
            <span className="mg-sub-section-title">SELECT PARAMETERS FOR OVERLAY</span>
            <div className="mg-sensor-pills-row">
              {params.map((key) => {
                const isSelected = selectedParams.includes(key);
                const cfg = PARAMETER_CONFIGS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    className={`mg-sensor-state-pill ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onToggleParam(key)}
                    title={`Toggle ${cfg.label} in normalized overlay`}
                    aria-pressed={isSelected}
                  >
                    <span className="checkbox-icon">
                      {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                    </span>
                    <span className="name">{cfg.shortLabel}:</span>
                    <span className="trend mono-telemetry">{cfg.unit}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
