/**
 * SIH 2026 Integrated Mine Safety Monitoring System
 * Backend API Contract & DTO Type Definitions
 *
 * Source of Truth: Backend FastAPI Schemas (backend/app/schemas/)
 * Strict Anti-Hallucination: Matches actual backend response & request models.
 */

// ==========================================
// 1. Standard Error Envelope
// ==========================================

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorEnvelope {
  error: ApiErrorDetail;
}

// ==========================================
// 2. System & Health
// ==========================================

export interface HealthResponse {
  status: string;
}

export interface ReadinessDetails {
  live_ws_clients: number;
}

export interface ReadinessResponse {
  status: string;
  database: string;
  details?: ReadinessDetails;
}

// ==========================================
// 3. Spatial Hierarchy: Mines & Zones
// ==========================================

export interface MineSummaryResponse {
  id: number;
  name: string;
  code?: string | null;
  zone_count: number;
}

export interface MineDetailResponse {
  id: number;
  name: string;
  code?: string | null;
  zones: ZoneSummaryResponse[];
}

export interface ZoneSummaryResponse {
  id: number;
  mine_id: number;
  name: string;
  code?: string | null;
  node_count: number;
}

export interface ZoneDetailResponse {
  id: number;
  mine_id: number;
  name: string;
  code?: string | null;
  nodes: NodeSummaryResponse[];
}

// ==========================================
// 4. Integrated Nodes & Sensors
// ==========================================

export interface SensorInfoResponse {
  id: number;
  sensor_type: string;
  sensor_identifier?: string | null;
  unit?: string | null;
  is_active: boolean;
}

export interface NodeSummaryResponse {
  id: number;
  zone_id: number;
  node_identifier: string;
  status: 'ACTIVE' | 'UNRESPONSIVE' | string;
  last_seen_at?: string | null;
  sensor_count: number;
}

export interface NodeDetailResponse {
  id: number;
  zone_id: number;
  zone_name?: string | null;
  node_identifier: string;
  status: 'ACTIVE' | 'UNRESPONSIVE' | string;
  last_seen_at?: string | null;
  sensors: SensorInfoResponse[];
}

// Query parameters for listing nodes
export interface NodeListParams {
  zone_id?: number;
  status?: 'ACTIVE' | 'UNRESPONSIVE' | string;
}

// ==========================================
// 5. Dashboard Overview Snapshot
// ==========================================

export interface AlertSeverityCount {
  warning: number;
  critical: number;
  total: number;
}

export interface DashboardOverviewResponse {
  total_mines: number;
  total_zones: number;
  total_nodes: number;
  active_nodes: number;
  unresponsive_nodes: number;
  alerts: AlertSeverityCount;
  zones_overview: ZoneRiskSummaryResponse[];
  snapshot_at: string;
}

// ==========================================
// 6. Telemetry Data Contracts
// ==========================================

export interface SensorReadingResponse {
  id: number;
  sensor_id: number;
  sensor_type: string;
  sensor_identifier?: string | null;
  unit?: string | null;
  node_id: number;
  node_identifier: string;
  timestamp: string; // ISO-8601 UTC
  value: number;
}

export interface TelemetryHistoryResponse {
  node_identifier: string;
  sensor_type?: string | null;
  from_dt?: string | null;
  to_dt?: string | null;
  total_count: number;
  returned_count: number;
  limit: number;
  readings: SensorReadingResponse[];
}

export interface LatestReadingsResponse {
  node_identifier: string;
  snapshot_at: string; // ISO-8601 UTC
  sensor_count: number;
  readings: SensorReadingResponse[];
}

export interface WindowAggregateResponse {
  node_identifier: string;
  sensor_type: string;
  from_dt?: string | null;
  to_dt?: string | null;
  reading_count: number;
  min_value: number;
  max_value: number;
  avg_value: number;
}

export interface TelemetryHistoryParams {
  sensor_type?: string;
  from_dt?: string;
  to_dt?: string;
  limit?: number;
}

export interface WindowAggregateParams {
  sensor_type: string;
  from_dt?: string;
  to_dt?: string;
}

// Ingestion payload (for testing or admin upload)
export interface TelemetryReadingIngest {
  sensor_type: string;
  sensor_identifier?: string | null;
  unit?: string | null;
  timestamp: string;
  value: number;
}

export interface TelemetryPayloadIngest {
  node_identifier: string;
  readings: TelemetryReadingIngest[];
}

// ==========================================
// 7. Safety Alerts
// ==========================================

export type AlertSeverityType = 'WARNING' | 'CRITICAL';
export type AlertStatusType = 'ACTIVE' | 'RESOLVED';

export interface AlertResponse {
  id: number;
  node_id: number;
  node_identifier: string;
  alert_type: string;
  condition_key: string;
  severity: AlertSeverityType | string;
  status: AlertStatusType | string;
  message: string;
  context_data: Record<string, unknown>;
  triggered_at: string;
  resolved_at?: string | null;
  created_at: string;
}

export interface AlertResolveRequest {
  resolution_note?: string | null;
}

export interface AlertHistoryParams {
  node_identifier?: string;
  alert_type?: string;
  status?: AlertStatusType | string;
  limit?: number;
  offset?: number;
}

// ==========================================
// 8. Explainable Risk Assessment
// ==========================================

export type RiskLevelType = 'NORMAL' | 'ELEVATED' | 'HIGH';

export interface ContributingFactor {
  factor_type: string;
  sensor_type?: string | null;
  observed_value?: number | null;
  threshold_value?: number | null;
  operator?: string | null;
  rule_name?: string | null;
  message: string;
  severity: string;
}

export interface RiskAssessmentResponse {
  node_id: number;
  node_identifier: string;
  risk_level: RiskLevelType;
  contributing_factors: ContributingFactor[];
  assessed_at: string;
  evaluation_metadata: Record<string, unknown>;
}

export interface ZoneRiskSummaryResponse {
  zone_id: number;
  zone_name: string;
  zone_code?: string | null;
  highest_risk_level: RiskLevelType;
  active_node_count: number;
  unresponsive_node_count: number;
  active_alert_count: number;
  assessed_at: string;
}

// ==========================================
// 9. Assistive AI & Anomaly Detection
// ==========================================

export interface AIAnomalyRecordResponse {
  id: number;
  node_id: number;
  sensor_type?: string | null;
  is_anomaly: boolean;
  anomaly_score: number;
  threshold: number;
  model_name: string;
  model_version: string;
  features: Record<string, unknown>;
  explanation: string;
  detected_at: string;
}

export interface ModelMetadataResponse {
  model_name: string;
  model_version: string;
  algorithm: string;
  parameters: Record<string, unknown>;
  description: string;
  is_assistive: boolean;
  disclaimer: string;
}

export interface ManualEvaluationRequest {
  window_size?: number;
}

export interface AIAnomalyHistoryParams {
  sensor_type?: string;
  is_anomaly?: boolean;
  from_dt?: string;
  to_dt?: string;
  limit?: number;
}

// ==========================================
// 10. Configurable Safety Rules
// ==========================================

export interface ThresholdRuleResponse {
  id: number;
  name: string;
  sensor_type: string;
  operator: string;
  threshold_value: number;
  severity: string;
  is_active: boolean;
  description?: string | null;
  created_at: string;
}

// ==========================================
// 11. Live Monitoring & WebSocket Messages
// ==========================================

export type LiveEventType =
  | 'telemetry'
  | 'alert'
  | 'risk_update'
  | 'anomaly'
  | 'ping'
  | 'subscribed';

export interface LiveTelemetryEvent {
  event_type: 'telemetry';
  node_identifier: string;
  node_id: number;
  readings: SensorReadingResponse[];
  ingested_at: string;
}

export interface LiveAlertEvent {
  event_type: 'alert';
  node_identifier: string;
  node_id: number;
  alert_id: number;
  alert_type: string;
  severity: string;
  status: string;
  message: string;
  context_data: Record<string, unknown>;
  emitted_at: string;
}

export interface LiveRiskEvent {
  event_type: 'risk_update';
  node_identifier: string;
  node_id: number;
  risk_level: string;
  factor_count: number;
  assessed_at: string;
}

export interface LiveAnomalyEvent {
  event_type: 'anomaly';
  node_identifier: string;
  node_id: number;
  sensor_type?: string | null;
  is_anomaly: boolean;
  anomaly_score: number;
  threshold: number;
  model_name: string;
  model_version: string;
  explanation: string;
  detected_at: string;
}

export interface KeepalivePing {
  event_type: 'ping';
  server_time: string;
}

export interface SubscriptionMessage {
  action: 'subscribe';
  node_identifier?: string | null;
}

