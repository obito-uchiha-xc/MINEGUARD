import React, { useState } from 'react';
import { Table, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import type { TelemetryPoint } from '../../data/mock/trendsAnalysis';
import type { MapNode } from '../../data/mock/nodes';
import './TelemetryDataTable.css';

export interface TelemetryDataTableProps {
  node: MapNode;
  points: TelemetryPoint[];
  paramLabel: string;
  unit: string;
  onExportCsv: () => void;
}

export const TelemetryDataTable: React.FC<TelemetryDataTableProps> = ({
  node,
  points,
  paramLabel,
  unit,
  onExportCsv,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const zoneCode = node.zone.replace('Zone ', '');
  const panelCode = node.panel.replace('Panel ', '');

  return (
    <div className="mg-data-table-section">
      <div className="mg-data-table-section__header">
        <button
          type="button"
          className="mg-data-table-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <Table size={16} className="text-primary" />
          <span className="title">Granular Telemetry Log Table</span>
          <span className="count mono-telemetry">({points.length} records)</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isOpen && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={onExportCsv}
          >
            Export CSV
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="mg-data-table-wrapper" tabIndex={0} aria-label="Raw Telemetry Data">
          <table className="mg-granular-table">
            <thead>
              <tr>
                <th scope="col">Timestamp</th>
                <th scope="col">Node</th>
                <th scope="col">Zone</th>
                <th scope="col">{paramLabel} ({unit})</th>
                <th scope="col">Baseline ({unit})</th>
                <th scope="col">Deviation ({unit})</th>
                <th scope="col">Tilt (°)</th>
                <th scope="col">Vibration (mm/s)</th>
                <th scope="col">Crack (mm)</th>
                <th scope="col">Moisture (%)</th>
                <th scope="col">Temp (°C)</th>
                <th scope="col">Condition</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, idx) => (
                <tr key={idx} className={p.isAnomaly ? 'row-anomaly' : ''}>
                  <td className="mono-telemetry text-tertiary">{p.time}</td>
                  <td className="mono-telemetry font-bold text-primary">{node.id}</td>
                  <td className="mono-telemetry">{zoneCode}{panelCode}</td>
                  <td className="mono-telemetry font-semibold">{p.value.toFixed(2)}</td>
                  <td className="mono-telemetry text-tertiary">{p.baseline.toFixed(2)}</td>
                  <td className={`mono-telemetry ${p.deviation > 0 ? 'text-critical' : ''}`}>
                    {p.deviation > 0 ? `+${p.deviation.toFixed(2)}` : p.deviation.toFixed(2)}
                  </td>
                  <td className="mono-telemetry">{node.tiltDeg.toFixed(2)}</td>
                  <td className="mono-telemetry">{node.vibrationMmS.toFixed(2)}</td>
                  <td className="mono-telemetry">{node.crackWidthMm.toFixed(2)}</td>
                  <td className="mono-telemetry">{node.moisturePct}</td>
                  <td className="mono-telemetry">{node.temperatureC.toFixed(1)}</td>
                  <td>
                    <span
                      className={`cond-tag ${
                        p.isAnomaly ? 'cond-anomaly' : 'cond-normal'
                      }`}
                    >
                      {p.isAnomaly ? 'Anomaly' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
