import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  AlertOctagon,
  WifiOff,
  ExternalLink,
  Info,
  Volume2,
  VolumeX,
  Radio,
  Loader2,
} from 'lucide-react';
import type { MapNode } from '../../data/mock/nodes';
import type { SafetyStatus } from '../../types/safety';
import type { NodeDetailResponse, LatestReadingsResponse, SensorReadingResponse } from '../../types/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Inclinometer3D } from './Inclinometer3D';
import { industrialAudio, useHazardAlarm } from '../../utils/sirenAudio';
import { nodesService } from '../../services/nodesService';
import { telemetryService } from '../../services/telemetryService';
import './NodeDetailsDrawer.css';

export interface NodeDetailsDrawerProps {
  node: MapNode | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshNode?: (nodeId: string) => void;
  onAcknowledgeNode?: (nodeId: string) => void;
}

interface LiveNodeData {
  detail: NodeDetailResponse | null;
  readings: SensorReadingResponse[];
  loadingDetail: boolean;
  loadingReadings: boolean;
  errorDetail: string | null;
  errorReadings: string | null;
}

/** Formats a reading value with its unit, or '—' if absent */
function formatReading(
  readings: SensorReadingResponse[],
  sensorTypeHint: string,
  unit: string,
  decimals = 2
): string {
  const match = readings.find((r) =>
    r.sensor_type.toLowerCase().includes(sensorTypeHint.toLowerCase())
  );
  if (!match) return '—';
  return `${match.value.toFixed(decimals)} ${unit}`;
}

/** Finds a reading value or returns null */
function findReadingValue(
  readings: SensorReadingResponse[],
  sensorTypeHint: string
): number | null {
  const match = readings.find((r) =>
    r.sensor_type.toLowerCase().includes(sensorTypeHint.toLowerCase())
  );
  return match ? match.value : null;
}

export const NodeDetailsDrawer: React.FC<NodeDetailsDrawerProps> = ({
  node: rawNode,
  isOpen,
  onClose,
  onRefreshNode,
  onAcknowledgeNode,
}) => {
  const navigate = useNavigate();
  const alarmState = useHazardAlarm();
  const [acknowledgedNodeId, setAcknowledgedNodeId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [liveData, setLiveData] = useState<LiveNodeData>({
    detail: null,
    readings: [],
    loadingDetail: false,
    loadingReadings: false,
    errorDetail: null,
    errorReadings: null,
  });


  const isAcknowledged =
    Boolean(rawNode?.acknowledged) || (rawNode ? acknowledgedNodeId === rawNode.id : false);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch real backend data whenever the selected node changes
  useEffect(() => {
    if (!isOpen || !rawNode) return;

    const nodeId = rawNode.id;
    let active = true;

    // Reset state asynchronously to avoid synchronous setState in effect
    const reset = Promise.resolve();

    reset.then(() => {
      if (!active) return;
      setLiveData({
        detail: null,
        readings: [],
        loadingDetail: true,
        loadingReadings: true,
        errorDetail: null,
        errorReadings: null,
      });
    });

    // Fetch node detail (mounted sensors, zone_name)
    nodesService
      .getNodeDetail(nodeId)
      .then((detail) => {
        if (!active) return;
        setLiveData((prev) => ({
          ...prev,
          detail,
          loadingDetail: false,
          errorDetail: null,
        }));
      })
      .catch(() => {
        if (!active) return;
        setLiveData((prev) => ({
          ...prev,
          loadingDetail: false,
          errorDetail: 'Could not load node detail from backend.',
        }));
      });

    // Fetch latest sensor readings
    telemetryService
      .getLatestReadings(nodeId)
      .then((snapshot: LatestReadingsResponse) => {
        if (!active) return;
        setLiveData((prev) => ({
          ...prev,
          readings: snapshot.readings,
          loadingReadings: false,
          errorReadings: null,
        }));
      })
      .catch(() => {
        if (!active) return;
        setLiveData((prev) => ({
          ...prev,
          loadingReadings: false,
          errorReadings: 'Could not load latest telemetry readings.',
        }));
      });

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, rawNode?.id]);

  if (!isOpen || !rawNode) return null;

  const node = rawNode;
  const isOffline = !node.isOnline || node.status === 'OFFLINE';
  const isFlagged =
    !isOffline &&
    (node.status === 'CRITICAL' ||
      node.status === 'HIGH_RISK' ||
      node.status === 'WARNING' ||
      node.aiRiskScore >= 30);

  const { readings, loadingReadings, loadingDetail, detail } = liveData;

  // Derive telemetry values from real readings (0 = no reading)
  const tiltDeg = findReadingValue(readings, 'tilt') ?? node.tiltDeg;
  const displacementMm = findReadingValue(readings, 'displacement') ?? node.displacementMm;
  const vibrationMmS = findReadingValue(readings, 'vibration') ?? node.vibrationMmS;
  const crackWidthMm = findReadingValue(readings, 'crack') ?? node.crackWidthMm;
  const temperatureC = findReadingValue(readings, 'temp') ?? node.temperatureC;
  const moisturePct = findReadingValue(readings, 'moisture') ?? findReadingValue(readings, 'humidity') ?? node.moisturePct;

  const handleNavigateMap = () => {
    navigate(`/live-map?node=${node.id}`);
  };

  const handleAcknowledge = () => {
    setAcknowledgedNodeId(node.id);
    if (onAcknowledgeNode) onAcknowledgeNode(node.id);
    setToastMessage(`Anomaly condition acknowledged for ${node.id}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshNode) onRefreshNode(node.id);

    // Re-fetch readings
    telemetryService
      .getLatestReadings(node.id)
      .then((snapshot: LatestReadingsResponse) => {
        setLiveData((prev) => ({
          ...prev,
          readings: snapshot.readings,
          errorReadings: null,
        }));
        setToastMessage(`Telemetry refreshed for ${node.id}`);
        setTimeout(() => setToastMessage(null), 2500);
      })
      .catch(() => {
        setToastMessage(`Could not refresh telemetry for ${node.id}`);
        setTimeout(() => setToastMessage(null), 2500);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  const renderStatusBadge = (status: SafetyStatus) => {
    if (isOffline) {
      return (
        <span className="mg-drawer__status-pill mg-drawer__status-pill--offline">
          <WifiOff size={13} />
          <span>Offline</span>
        </span>
      );
    }
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="mg-drawer__status-pill mg-drawer__status-pill--critical">
            <AlertOctagon size={13} />
            <span>Critical</span>
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="mg-drawer__status-pill mg-drawer__status-pill--high-risk">
            <Flame size={13} />
            <span>High Risk</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="mg-drawer__status-pill mg-drawer__status-pill--warning">
            <AlertTriangle size={13} />
            <span>Warning</span>
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="mg-drawer__status-pill mg-drawer__status-pill--normal">
            <CheckCircle2 size={13} />
            <span>Normal</span>
          </span>
        );
    }
  };

  // Render a single telemetry row from live readings
  const renderTelemetryCard = (
    label: string,
    value: string,
    subtext: string
  ) => (
    <div className="mg-telemetry-card">
      <span className="mg-telemetry-card__label">{label}</span>
      <span className="mg-telemetry-card__value mono-telemetry">
        {isOffline ? '—' : value}
      </span>
      <span className="mg-telemetry-card__subtext">{subtext}</span>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="mg-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className="mg-node-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Telemetry and Diagnostic Details for Node ${node.id}`}
      >
        {/* HEADER */}
        <div className="mg-drawer__header">
          <div className="mg-drawer__title-area">
            <div className="mg-drawer__title-row">
              <h2 className="mg-drawer__node-id mono-telemetry">
                NODE {node.id}
              </h2>
              {renderStatusBadge(node.status)}
              <span className="mg-drawer__zone-tag mono-telemetry">
                {node.zone}
              </span>
            </div>
            <p className="mg-drawer__node-name">{node.name}</p>
            <div className="mg-drawer__meta-row">
              <span className="mg-drawer__online-dot">
                <span
                  className={`dot ${node.isOnline ? 'dot--live' : 'dot--offline'}`}
                />
                {node.isOnline ? 'Online' : 'Offline'}
              </span>
              <span className="mg-drawer__separator">•</span>
              <span className="mg-drawer__last-updated mono-telemetry">
                Last updated: {node.lastUpdated}
              </span>
              {node.sensorCount !== undefined && (
                <>
                  <span className="mg-drawer__separator">•</span>
                  <span className="mg-drawer__last-updated mono-telemetry">
                    {node.sensorCount} sensor{node.sensorCount !== 1 ? 's' : ''} registered
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="mg-drawer__header-actions">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ExternalLink size={14} />}
              onClick={handleNavigateMap}
              title="Locate and highlight this node on Live Mine Map"
            >
              View on Map
            </Button>
            <button
              type="button"
              className="mg-drawer__close-btn"
              onClick={onClose}
              aria-label="Close details panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TOAST FEEDBACK */}
        {toastMessage && (
          <div className="mg-drawer__toast" role="status">
            <Info size={14} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HAZARD ALARM & SHUT CONTROL */}
        {isFlagged && (
          <div className="mg-drawer__alarm-banner">
            <div className="mg-drawer__alarm-banner-header">
              <div className="flex items-center gap-2">
                <Radio
                  size={15}
                  className={alarmState.isSounding ? 'animate-ping text-red-500' : 'text-amber-400'}
                />
                <span className="font-bold text-xs uppercase tracking-wider text-white">
                  {alarmState.isSounding
                    ? 'SOS Audible Alarm Sounding'
                    : alarmState.isSilenced
                    ? 'Audible Alarm Silenced'
                    : 'Emergency Alarm Ready'}
                </span>
              </div>
              {alarmState.isSounding ? (
                <button
                  type="button"
                  className="mg-drawer__shut-alarm-btn"
                  onClick={() => industrialAudio.silenceHazardAlarm()}
                  title="Shut off audible SOS buzzer"
                >
                  <VolumeX size={14} />
                  <span>SHUT ALARM SOUND</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="mg-drawer__rearm-alarm-btn"
                  onClick={() =>
                    alarmState.isSilenced
                      ? industrialAudio.rearmHazardAlarm()
                      : industrialAudio.triggerManualHazard(node.id)
                  }
                  title="Test or re-arm audible siren"
                >
                  <Volume2 size={14} />
                  <span>{alarmState.isSilenced ? 'Re-Arm Siren' : 'Test Siren'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* DRAWER BODY (SCROLLABLE) */}
        <div className="mg-drawer__body">

          {/* 1. RISK FLAG (shown when flagged) */}
          {isFlagged && (
            <div className="mg-drawer__section mg-drawer__section--risk-flag">
              <div className="mg-drawer__section-header">
                <div className="mg-drawer__flag-header">
                  <AlertTriangle size={16} className="text-critical" />
                  <h3 className="mg-drawer__flag-title">NODE ELEVATED RISK</h3>
                </div>
                <Badge variant="critical">
                  {node.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="mg-drawer__explanation-box">
                <p className="mg-drawer__explanation-lead">
                  This node is currently in a <strong>{node.status.replace('_', ' ')}</strong> state.
                  Review live telemetry below and trigger an acknowledgement if reviewed.
                </p>
              </div>
            </div>
          )}

          {/* 2. CURRENT TELEMETRY — sourced from real backend readings */}
          <div className="mg-drawer__section">
            <div className="mg-drawer__section-header">
              <h3 className="mg-drawer__section-title">CURRENT TELEMETRY</h3>
              {loadingReadings ? (
                <span className="mg-drawer__section-badge mono-telemetry flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Loading…
                </span>
              ) : liveData.errorReadings ? (
                <span className="mg-drawer__section-badge mono-telemetry text-warning">
                  ⚠ Readings unavailable
                </span>
              ) : (
                <span className="mg-drawer__section-badge mono-telemetry">
                  {readings.length} READING{readings.length !== 1 ? 'S' : ''}
                </span>
              )}
            </div>

            {liveData.errorReadings && !loadingReadings && (
              <div className="mg-drawer__info-notice" style={{ marginBottom: '12px' }}>
                <Info size={13} />
                <span>{liveData.errorReadings} Check backend connectivity or retry.</span>
              </div>
            )}

            <div className="mg-telemetry-grid">
              {renderTelemetryCard(
                'Tilt',
                readings.length > 0 ? formatReading(readings, 'tilt', '°', 2) : `${tiltDeg.toFixed(2)}°`,
                'Angular deviation'
              )}
              {renderTelemetryCard(
                'Displacement',
                readings.length > 0 ? formatReading(readings, 'displacement', 'mm', 1) : `${displacementMm.toFixed(1)} mm`,
                'Surface drop'
              )}
              {renderTelemetryCard(
                'Vibration',
                readings.length > 0 ? formatReading(readings, 'vibration', 'mm/s', 2) : `${vibrationMmS.toFixed(2)} mm/s`,
                'Dynamic seismicity'
              )}
              {renderTelemetryCard(
                'Crack Width',
                readings.length > 0 ? formatReading(readings, 'crack', 'mm', 2) : `${crackWidthMm.toFixed(2)} mm`,
                'Aperture expansion'
              )}
              {renderTelemetryCard(
                'Soil Moisture',
                readings.length > 0 ? formatReading(readings, 'moisture', '%', 1) : `${moisturePct.toFixed(1)}%`,
                'Strata pore saturation'
              )}
              {renderTelemetryCard(
                'Temperature',
                readings.length > 0 ? formatReading(readings, 'temp', '°C', 1) : `${temperatureC.toFixed(1)} °C`,
                'Ambient probe temp'
              )}
              {renderTelemetryCard(
                'Gas Status',
                readings.length > 0 ? (
                  (() => {
                    const gasR = readings.find((r) =>
                      r.sensor_type.toLowerCase().includes('gas') ||
                      r.sensor_type.toLowerCase().includes('ch4') ||
                      r.sensor_type.toLowerCase().includes('co')
                    );
                    return gasR ? `${gasR.value.toFixed(1)} ${gasR.unit ?? ''}`.trim() : node.gasStatus;
                  })()
                ) : node.gasStatus,
                'Hazardous gas level'
              )}
              {/* Battery — not monitored in current backend */}
              <div className="mg-telemetry-card">
                <span className="mg-telemetry-card__label">Battery (ESP32)</span>
                <span className="mg-telemetry-card__value mono-telemetry">—</span>
                <span className="mg-telemetry-card__subtext">Not monitored via API</span>
              </div>
              {/* RSSI — not monitored in current backend */}
              <div className="mg-telemetry-card">
                <span className="mg-telemetry-card__label">RSSI (LoRa)</span>
                <span className="mg-telemetry-card__value mono-telemetry">—</span>
                <span className="mg-telemetry-card__subtext">Not monitored via API</span>
              </div>
            </div>

            {/* 3D Inclinometer Orientation Visualizer */}
            <Inclinometer3D
              tiltDeg={tiltDeg}
              nodeId={node.id}
              isOnline={node.isOnline}
            />
          </div>

          {/* 3. MOUNTED SENSORS (from real backend NodeDetailResponse) */}
          <div className="mg-drawer__section">
            <div className="mg-drawer__section-header">
              <h3 className="mg-drawer__section-title">MOUNTED SENSORS</h3>
              {loadingDetail ? (
                <span className="mg-drawer__section-badge mono-telemetry flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Loading…
                </span>
              ) : detail ? (
                <span className="mg-drawer__section-badge mono-telemetry">
                  {detail.sensors.length} REGISTERED
                </span>
              ) : null}
            </div>

            {liveData.errorDetail && !loadingDetail && (
              <div className="mg-drawer__info-notice">
                <Info size={13} />
                <span>{liveData.errorDetail}</span>
              </div>
            )}

            {!loadingDetail && detail && detail.sensors.length === 0 && (
              <div className="mg-drawer__info-notice">
                <Info size={13} />
                <span>No sensors registered to this node in the backend.</span>
              </div>
            )}

            {!loadingDetail && detail && detail.sensors.length > 0 && (
              <div className="mg-health-list">
                {detail.sensors.map((sensor) => (
                  <div key={sensor.id} className="mg-health-item">
                    <span className="mg-health-item__name">
                      {sensor.sensor_type}
                      {sensor.sensor_identifier ? ` (${sensor.sensor_identifier})` : ''}
                      {sensor.unit ? ` [${sensor.unit}]` : ''}
                    </span>
                    <span
                      className={`mg-health-item__badge mg-health-item__badge--${
                        sensor.is_active ? 'healthy' : 'offline'
                      }`}
                    >
                      ● {sensor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Unmonitored hardware note */}
            <div className="mg-drawer__info-notice" style={{ marginTop: '8px' }}>
              <Info size={13} />
              <span>
                Battery (ESP32 BMS), LoRa RSSI/SNR, and per-chip firmware health are not
                tracked by the backend API (Phases 0–10). These fields are displayed as{' '}
                <strong>—</strong>.
              </span>
            </div>
          </div>

          {/* 4. COMMUNICATION & NODE STATUS */}
          <div className="mg-drawer__section">
            <div className="mg-drawer__section-header">
              <h3 className="mg-drawer__section-title">COMMUNICATION & NODE STATUS</h3>
            </div>

            <div className="mg-comm-grid">
              <div className="mg-comm-box">
                <span className="mg-comm-box__label">Link Status</span>
                <span className="mg-comm-box__value">
                  {node.isOnline ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="mg-comm-box">
                <span className="mg-comm-box__label">RSSI</span>
                <span className="mg-comm-box__value mono-telemetry">—</span>
              </div>
              <div className="mg-comm-box">
                <span className="mg-comm-box__label">Last Seen</span>
                <span className="mg-comm-box__value mono-telemetry">
                  {node.lastUpdated}
                </span>
              </div>
              <div className="mg-comm-box">
                <span className="mg-comm-box__label">Battery</span>
                <span className="mg-comm-box__value mono-telemetry">—</span>
              </div>
              <div className="mg-comm-box">
                <span className="mg-comm-box__label">Zone</span>
                <span className="mg-comm-box__value">
                  {detail?.zone_name || node.zone}
                </span>
              </div>
              <div className="mg-comm-box">
                <span className="mg-comm-box__label">Backend Status</span>
                <span className="mg-comm-box__value mono-telemetry">
                  {detail?.status || node.isOnline ? 'ACTIVE' : 'UNRESPONSIVE'}
                </span>
              </div>
            </div>
          </div>

          {/* 5. NODE LOCATION */}
          <div className="mg-drawer__section">
            <div className="mg-drawer__section-header">
              <h3 className="mg-drawer__section-title">NODE LOCATION</h3>
            </div>
            <div className="mg-location-card">
              <div className="mg-location-card__row">
                <span className="label">Zone:</span>
                <span className="val font-semibold">
                  {detail?.zone_name || node.zone} ({node.panel})
                </span>
              </div>
              <div className="mg-location-card__row">
                <span className="label">Node ID:</span>
                <span className="val mono-telemetry">{node.id}</span>
              </div>
              <div className="mg-location-card__row">
                <span className="label">Geographic Coords:</span>
                <span className="val mono-telemetry">
                  — (GPS not tracked by backend)
                </span>
              </div>
              <div className="mg-location-card__row">
                <span className="label">Map Position:</span>
                <span className="val mono-telemetry">
                  Schematic layout ({node.xPct.toFixed(0)}%, {node.yPct.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DRAWER FOOTER / ACTIONS */}
        <div className="mg-drawer__footer">
          <Button
            variant="primary"
            size="md"
            leftIcon={<MapPin size={15} />}
            onClick={handleNavigateMap}
            className="mg-drawer__btn-full"
          >
            View on Map
          </Button>

          {isFlagged && (
            <Button
              variant={isAcknowledged ? 'secondary' : 'warning'}
              size="md"
              leftIcon={<CheckCircle2 size={15} />}
              onClick={handleAcknowledge}
              disabled={isAcknowledged}
            >
              {isAcknowledged ? 'Alert Acknowledged' : 'Acknowledge Alert'}
            </Button>
          )}

          <Button
            variant="ghost"
            size="md"
            leftIcon={<RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />}
            onClick={handleRefresh}
            title="Refresh live telemetry from backend"
          >
            Refresh
          </Button>
        </div>
      </aside>
    </>
  );
};
