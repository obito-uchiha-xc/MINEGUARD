import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Compass,
  Radio,
  Info,
  Loader2,
} from 'lucide-react';
import { zonesService } from '../../services/zonesService';
import { riskService } from '../../services/riskService';
import type { ZoneSummaryResponse, ZoneRiskSummaryResponse } from '../../types/api';
import './SpatialTemporalAnalysis.css';

export interface SpatialTemporalAnalysisProps {
  selectedNodeId: string;
}

interface ZoneWithRisk {
  zone: ZoneSummaryResponse;
  risk: ZoneRiskSummaryResponse | null;
}

/**
 * Spatial-Temporal Analysis — Phase 16
 *
 * Uses real zone and zone risk data from the backend.
 * Spatial cluster analysis (multi-node proximity, pillar rib analysis) and
 * data quality metrics (packet loss, RSSI, heartbeat) are NOT available in
 * backend Phases 0–10 and are shown with honest unavailability notices.
 */
export const SpatialTemporalAnalysis: React.FC<SpatialTemporalAnalysisProps> = ({
  selectedNodeId,
}) => {
  const [zonesWithRisk, setZonesWithRisk] = useState<ZoneWithRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    zonesService
      .listZones()
      .then(async (zones) => {
        if (!active) return;

        // Fetch risk summary for each zone in parallel, tolerating individual failures
        const withRisk: ZoneWithRisk[] = await Promise.all(
          zones.map(async (zone) => {
            try {
              const risk = await riskService.getZoneRisk(zone.id);
              return { zone, risk };
            } catch {
              return { zone, risk: null };
            }
          })
        );

        if (!active) return;
        setZonesWithRisk(withRisk);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Could not load zone data from backend.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const getRiskStatusLabel = (risk: ZoneRiskSummaryResponse | null): string => {
    if (!risk) return '—';
    switch (risk.highest_risk_level) {
      case 'HIGH':
        return 'High Risk';
      case 'ELEVATED':
        return 'Elevated';
      case 'NORMAL':
      default:
        return 'Normal';
    }
  };

  const getRiskStatusClass = (risk: ZoneRiskSummaryResponse | null): string => {
    if (!risk) return '';
    switch (risk.highest_risk_level) {
      case 'HIGH':
        return 'status-high';
      case 'ELEVATED':
        return 'status-elevated';
      case 'NORMAL':
      default:
        return 'status-normal';
    }
  };

  return (
    <div className="mg-spatial-temporal-grid">
      {/* 1. SPATIAL CLUSTER ANALYSIS — NOT AVAILABLE */}
      <div className="mg-sp-card mg-sp-card--highlight">
        <div className="mg-sp-card__header">
          <div className="mg-sp-card__title-row">
            <Compass size={17} className="text-warning" />
            <h4 className="mg-sp-card__title">Spatial-Temporal Pattern Insight</h4>
          </div>
          <span className="mg-sp-badge mono-telemetry">Not Available</span>
        </div>

        <div className="mg-sp-card__body">
          <div className="mg-drawer__info-notice">
            <Info size={14} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                Spatial Cluster Analysis Not Available
              </p>
              <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
                Multi-node spatial clustering (proximity correlation across nodes within
                the same area) requires GPS/positional coordinates and a cluster
                computation API. The backend (Phases 0–10) stores node zone associations
                but does not track physical coordinates or compute spatial proximity metrics.
              </p>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                Node currently selected: <strong className="mono-telemetry">{selectedNodeId}</strong>.
                Zone-level risk comparison is available in the table below using real backend data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ZONE RISK COMPARISON — REAL BACKEND DATA */}
      <div className="mg-sp-card">
        <div className="mg-sp-card__header">
          <div className="mg-sp-card__title-row">
            <MapPin size={17} className="text-primary" />
            <h4 className="mg-sp-card__title">Zone Risk Comparison</h4>
          </div>
          <span className="mg-sp-badge mono-telemetry">
            {loading ? 'Loading…' : `${zonesWithRisk.length} Zones`}
          </span>
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            <Loader2 size={14} className="animate-spin" />
            Loading zone risk data…
          </div>
        )}

        {error && !loading && (
          <div className="mg-drawer__info-notice">
            <Info size={13} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && zonesWithRisk.length === 0 && (
          <div className="mg-drawer__info-notice">
            <Info size={13} />
            <span>No zones returned from backend. The mine may have no configured zones yet.</span>
          </div>
        )}

        {!loading && zonesWithRisk.length > 0 && (
          <div className="mg-zone-table-wrapper">
            <table className="mg-zone-table">
              <thead>
                <tr>
                  <th scope="col">Zone</th>
                  <th scope="col">Risk Level</th>
                  <th scope="col">Active Nodes</th>
                  <th scope="col">Alerts</th>
                  <th scope="col">Unresponsive</th>
                </tr>
              </thead>
              <tbody>
                {zonesWithRisk.map(({ zone, risk }) => (
                  <tr key={zone.id}>
                    <td className="zone-name font-semibold">{zone.name}</td>
                    <td>
                      <span className={`zone-status-pill ${getRiskStatusClass(risk)}`}>
                        {getRiskStatusLabel(risk)}
                      </span>
                    </td>
                    <td className="mono-telemetry">
                      {risk ? risk.active_node_count : '—'}
                    </td>
                    <td className="mono-telemetry">
                      {risk ? risk.active_alert_count : '—'}
                    </td>
                    <td className="mono-telemetry">
                      {risk ? risk.unresponsive_node_count : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              Risk level, node counts, and alert counts sourced from{' '}
              <code>GET /api/v1/risk/zones/&#123;id&#125;</code>. Average displacement
              and tilt per zone are not provided by the backend API.
            </p>
          </div>
        )}
      </div>

      {/* 3. DATA QUALITY & HARDWARE COVERAGE — NOT AVAILABLE */}
      <div className="mg-sp-card">
        <div className="mg-sp-card__header">
          <div className="mg-sp-card__title-row">
            <Radio size={17} className="text-primary" />
            <h4 className="mg-sp-card__title">Data Quality & Probe Health</h4>
          </div>
          <span className="mg-sp-badge mono-telemetry">Not Available</span>
        </div>

        <div className="mg-drawer__info-notice" style={{ marginTop: '8px' }}>
          <Info size={14} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
              Packet Quality Metrics Not Available
            </p>
            <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
              Packet reception rate, missing packet counts, heartbeat intervals, and
              per-chip probe health (MPU6500, SW-1801P, MQ-2, etc.) are not tracked
              in the backend telemetry schema (Phases 0–10). These metrics require a
              dedicated network monitoring pipeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
