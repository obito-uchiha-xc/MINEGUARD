/**
 * SIH 2026 Integrated Mine Safety Monitoring System
 * Live Monitoring WebSocket Client Service
 *
 * Source of Truth: Backend Phase 5 live WebSocket endpoint (GET /ws/telemetry)
 * Contract: backend/app/schemas/live.py
 */

import { API_CONFIG } from '../api/config';
import type {
  LiveAlertEvent,
  LiveAnomalyEvent,
  LiveRiskEvent,
  LiveTelemetryEvent,
  SubscriptionMessage,
} from '../types/api';

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export type LiveEventPayload =
  | LiveTelemetryEvent
  | LiveAlertEvent
  | LiveRiskEvent
  | LiveAnomalyEvent;

type TelemetryListener = (event: LiveTelemetryEvent) => void;
type AlertListener = (event: LiveAlertEvent) => void;
type RiskListener = (event: LiveRiskEvent) => void;
type AnomalyListener = (event: LiveAnomalyEvent) => void;
type RawEventListener = (event: LiveEventPayload) => void;
type StatusListener = (status: ConnectionStatus) => void;

export class LiveTelemetryService {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'DISCONNECTED';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManuallyClosed = false;
  private activeSubscriptionNode: string | null = null;

  // Listeners
  private telemetryListeners = new Set<TelemetryListener>();
  private alertListeners = new Set<AlertListener>();
  private riskListeners = new Set<RiskListener>();
  private anomalyListeners = new Set<AnomalyListener>();
  private rawListeners = new Set<RawEventListener>();
  private statusListeners = new Set<StatusListener>();

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: ConnectionStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((listener) => {
      try {
        listener(newStatus);
      } catch (err) {
        console.error('Error in live status listener:', err);
      }
    });
  }

  /**
   * Connect to the live telemetry WebSocket endpoint
   */
  public connect(url: string = API_CONFIG.wsBaseUrl): void {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isManuallyClosed = false;
    this.setStatus('CONNECTING');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED');

        // Resend active subscription if previously registered
        if (this.activeSubscriptionNode) {
          this.subscribe(this.activeSubscriptionNode);
        }
      };

      this.ws.onmessage = (messageEvent: MessageEvent) => {
        this.handleIncomingMessage(messageEvent.data);
      };

      this.ws.onerror = () => {
        this.setStatus('ERROR');
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.setStatus('DISCONNECTED');
        if (!this.isManuallyClosed) {
          this.scheduleReconnect(url);
        }
      };
    } catch {
      this.setStatus('ERROR');
      if (!this.isManuallyClosed) {
        this.scheduleReconnect(url);
      }
    }
  }

  /**
   * Handle incoming parsed WebSocket frames
   */
  public handleIncomingMessage(rawData: string): void {
    try {
      const parsed = JSON.parse(rawData) as Record<string, unknown>;
      const eventType = parsed.event_type;

      if (eventType === 'ping') {
        // Keepalive heartbeat handled gracefully
        return;
      }

      if (eventType === 'subscribed') {
        return;
      }

      if (eventType === 'telemetry') {
        const ev = parsed as unknown as LiveTelemetryEvent;
        this.telemetryListeners.forEach((l) => l(ev));
        this.rawListeners.forEach((l) => l(ev));
      } else if (eventType === 'alert') {
        const ev = parsed as unknown as LiveAlertEvent;
        this.alertListeners.forEach((l) => l(ev));
        this.rawListeners.forEach((l) => l(ev));
      } else if (eventType === 'risk_update') {
        const ev = parsed as unknown as LiveRiskEvent;
        this.riskListeners.forEach((l) => l(ev));
        this.rawListeners.forEach((l) => l(ev));
      } else if (eventType === 'anomaly') {
        const ev = parsed as unknown as LiveAnomalyEvent;
        this.anomalyListeners.forEach((l) => l(ev));
        this.rawListeners.forEach((l) => l(ev));
      }
    } catch {
      // Ignore malformed frames gracefully
    }
  }

  /**
   * Send node filter subscription frame
   */
  public subscribe(nodeIdentifier?: string): void {
    this.activeSubscriptionNode = nodeIdentifier ?? null;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg: SubscriptionMessage = {
        action: 'subscribe',
        node_identifier: nodeIdentifier,
      };
      this.ws.send(JSON.stringify(msg));
    }
  }

  /**
   * Manually disconnect the WebSocket
   */
  public disconnect(): void {
    this.isManuallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }

  /**
   * Exponential backoff reconnect
   */
  private scheduleReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      if (!this.isManuallyClosed) {
        this.connect(url);
      }
    }, delay);
  }

  // Event Subscription Helpers
  public onTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    return () => {
      this.telemetryListeners.delete(listener);
    };
  }

  public onAlert(listener: AlertListener): () => void {
    this.alertListeners.add(listener);
    return () => {
      this.alertListeners.delete(listener);
    };
  }

  public onRisk(listener: RiskListener): () => void {
    this.riskListeners.add(listener);
    return () => {
      this.riskListeners.delete(listener);
    };
  }

  public onAnomaly(listener: AnomalyListener): () => void {
    this.anomalyListeners.add(listener);
    return () => {
      this.anomalyListeners.delete(listener);
    };
  }

  public onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }
}

export const liveService = new LiveTelemetryService();
