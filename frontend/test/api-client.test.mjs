/**
 * SIH 2026 Integrated Mine Safety Monitoring System
 * Frontend API Integration Foundation — Unit & Integration Test Suite
 *
 * Uses Node.js built-in test runner (node:test) and assertions (node:assert/strict).
 */

import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

// Import from compiled or directly using ESM
import { apiClient, buildQueryString } from '../src/api/client.ts';
import { ApiError, parseApiErrorResponse } from '../src/api/errors.ts';
import { adaptAlertResponseToDashboardAlert, adaptAlertResponseToMineAlert } from '../src/services/adapters/alertAdapter.ts';
import { adaptNodeSummaryToMapNode } from '../src/services/adapters/nodeAdapter.ts';
import {
  calculateCompositeMineRiskScore,
  deriveFleetRiskLevel,
  deriveMineRiskStatus,
  extractRiskIndicators,
  mapRiskLevelToStatus,
} from '../src/services/adapters/riskAdapter.ts';
import { adaptSensorReadingsToTelemetry } from '../src/services/adapters/telemetryAdapter.ts';
import {
  adaptHistoryToTelemetryTimeSeries,
  getTimeRangeDateBounds,
  mapParameterKeyToSensorType,
} from '../src/services/adapters/trendsAdapter.ts';
import { aiService } from '../src/services/aiService.ts';
import { LiveTelemetryService } from '../src/services/liveService.ts';
import { formatRelativeTime, formatUtcDisplay, parseUtcTimestamp } from '../src/utils/date.ts';

describe('1. API Query String Builder', () => {
  it('returns empty string when no params are provided', () => {
    assert.equal(buildQueryString(), '');
    assert.equal(buildQueryString({}), '');
  });

  it('serializes valid parameters and skips null/undefined/empty string', () => {
    const params = {
      sensor_type: 'displacement',
      limit: 50,
      skip_me: undefined,
      null_me: null,
      empty_me: '',
      is_active: true,
    };
    const qs = buildQueryString(params);
    assert.equal(qs, '?sensor_type=displacement&limit=50&is_active=true');
  });
});

describe('2. Error Parsing & ApiError Model', () => {
  it('correctly maps backend standard error envelope', () => {
    const backendPayload = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: [{ loc: ['body', 'node_identifier'], msg: 'field required', type: 'missing' }],
      },
    };

    const err = parseApiErrorResponse(422, '/nodes', backendPayload);
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 422);
    assert.equal(err.code, 'VALIDATION_ERROR');
    assert.equal(err.message, 'Request validation failed.');
    assert.deepEqual(err.details, backendPayload.error.details);
    assert.equal(err.path, '/nodes');
  });

  it('maps 404 status to NOT_FOUND', () => {
    const err = parseApiErrorResponse(404, '/nodes/UNKNOWN', 'Resource not found');
    assert.equal(err.status, 404);
    assert.equal(err.code, 'NOT_FOUND');
  });

  it('maps 500 status to SERVER_ERROR', () => {
    const err = parseApiErrorResponse(500, '/telemetry', null);
    assert.equal(err.status, 500);
    assert.equal(err.code, 'SERVER_ERROR');
  });
});

describe('3. HTTP API Client Execution', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('executes successful GET request and parses JSON', async () => {
    const mockData = { status: 'ok' };
    globalThis.fetch = async (url, options) => {
      assert.ok(String(url).includes('/health'));
      assert.equal(options.headers.Accept, 'application/json');
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      };
    };

    const res = await apiClient('/health');
    assert.deepEqual(res, mockData);
  });

  it('throws structured ApiError on HTTP 404', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        error: {
          code: 'NODE_NOT_FOUND',
          message: 'Node with identifier N99 does not exist.',
        },
      }),
    });

    await assert.rejects(
      async () => {
        await apiClient('/nodes/N99');
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, 'NODE_NOT_FOUND');
        assert.equal(err.message, 'Node with identifier N99 does not exist.');
        return true;
      }
    );
  });

  it('handles network connection failures gracefully', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch');
    };

    await assert.rejects(
      async () => {
        await apiClient('/nodes');
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.isNetworkError, true);
        assert.equal(err.code, 'NETWORK_ERROR');
        return true;
      }
    );
  });

  it('handles request timeout abort correctly', async () => {
    globalThis.fetch = async (url, options) => {
      return new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => {
          const abortErr = new DOMException('The operation was aborted.', 'AbortError');
          reject(abortErr);
        });
      });
    };

    await assert.rejects(
      async () => {
        await apiClient('/slow-endpoint', { timeoutMs: 50 });
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.isTimeout, true);
        assert.equal(err.code, 'TIMEOUT_ERROR');
        assert.equal(err.status, 408);
        return true;
      }
    );
  });
});

describe('4. Data Transformation Adapters', () => {
  it('telemetryAdapter transforms flat sensor readings into compound telemetry', () => {
    const flatReadings = [
      { id: 1, sensor_id: 1, sensor_type: 'tilt_pitch_deg', node_id: 1, node_identifier: 'N01', timestamp: '2026-09-09T12:00:00Z', value: 3.5 },
      { id: 2, sensor_id: 2, sensor_type: 'tilt_roll_deg', node_id: 1, node_identifier: 'N01', timestamp: '2026-09-09T12:00:00Z', value: 2.1 },
      { id: 3, sensor_id: 3, sensor_type: 'displacement_mm', node_id: 1, node_identifier: 'N01', timestamp: '2026-09-09T12:00:00Z', value: 14.8 },
      { id: 4, sensor_id: 4, sensor_type: 'vibration_peak_mms', node_id: 1, node_identifier: 'N01', timestamp: '2026-09-09T12:00:00Z', value: 6.2 },
      { id: 5, sensor_id: 5, sensor_type: 'methane_ppm', node_id: 1, node_identifier: 'N01', timestamp: '2026-09-09T12:00:00Z', value: 1200 },
    ];

    const compound = adaptSensorReadingsToTelemetry(flatReadings);
    assert.equal(compound.tilt.pitchDeg, 3.5);
    assert.equal(compound.tilt.rollDeg, 2.1);
    assert.equal(compound.displacementMm, 14.8);
    assert.equal(compound.vibrationIntensityG, 6.2);
    assert.equal(compound.gas.ch4Ppm, 1200);
    assert.equal(compound.gas.isGasAnomaly, true); // CH4 > 1000 threshold
  });

  it('alertAdapter maps backend AlertResponse to UI MineAlert', () => {
    const backendAlert = {
      id: 42,
      node_id: 4,
      node_identifier: 'N04',
      alert_type: 'THRESHOLD',
      condition_key: 'DISPLACEMENT_CRITICAL',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      message: 'Surface displacement 24.5mm exceeded critical limit 20.0mm',
      context_data: { observed: 24.5, limit: 20.0 },
      triggered_at: '2026-09-09T10:30:00Z',
      created_at: '2026-09-09T10:30:00Z',
    };

    const uiAlert = adaptAlertResponseToMineAlert(backendAlert);
    assert.equal(uiAlert.id, 'ALT-42');
    assert.equal(uiAlert.nodeId, 'N04');
    assert.equal(uiAlert.severity, 'CRITICAL');
    assert.equal(uiAlert.status, 'NEW'); // ACTIVE maps to NEW
    assert.equal(uiAlert.category, 'GROUND_MOVEMENT');
    assert.equal(uiAlert.description, backendAlert.message);
  });

  it('adaptAlertResponseToDashboardAlert maps to lightweight dashboard alert', () => {
    const backendAlert = {
      id: 7,
      node_id: 2,
      node_identifier: 'N02',
      alert_type: 'THRESHOLD',
      condition_key: 'TILT_WARNING',
      severity: 'WARNING',
      status: 'ACTIVE',
      message: 'Tilt exceeded advisory threshold 1.5 deg',
      context_data: { observed: 1.6 },
      triggered_at: '2026-09-09T10:00:00Z',
      created_at: '2026-09-09T10:00:00Z',
    };

    const dAlert = adaptAlertResponseToDashboardAlert(backendAlert);
    assert.equal(dAlert.id, 'ALT-7');
    assert.equal(dAlert.severity, 'warning');
    assert.equal(dAlert.target, 'Node N02');
    assert.equal(dAlert.nodeId, 'N02');
    assert.equal(dAlert.isAcknowledged, false);
  });

  it('nodeAdapter creates valid MapNode and derives safety status', () => {
    const summary = {
      id: 1,
      zone_id: 1,
      node_identifier: 'N01',
      status: 'ACTIVE',
      last_seen_at: '2026-09-09T12:00:00Z',
      sensor_count: 5,
    };

    const mapNode = adaptNodeSummaryToMapNode(summary, [], 'ELEVATED');
    assert.equal(mapNode.id, 'N01');
    assert.equal(mapNode.status, 'WARNING'); // ELEVATED -> WARNING
    assert.equal(mapNode.isOnline, true);
    assert.equal(typeof mapNode.xPct, 'number');
    assert.equal(typeof mapNode.yPct, 'number');
  });

  it('riskAdapter calculates composite score, derives fleet risk, and extracts indicators accurately', () => {
    const zones = [
      { zone_id: 1, zone_name: 'Zone A', highest_risk_level: 'HIGH', active_node_count: 5, unresponsive_node_count: 0, active_alert_count: 2, assessed_at: '2026-09-09T12:00:00Z' },
      { zone_id: 2, zone_name: 'Zone B', highest_risk_level: 'NORMAL', active_node_count: 6, unresponsive_node_count: 0, active_alert_count: 0, assessed_at: '2026-09-09T12:00:00Z' },
    ];

    // Worst-case fleet risk level
    assert.equal(deriveFleetRiskLevel(zones), 'HIGH');
    assert.equal(deriveFleetRiskLevel([zones[1]]), 'NORMAL');
    assert.equal(deriveFleetRiskLevel([]), 'NORMAL');

    // Risk level to UI status mapping
    assert.equal(mapRiskLevelToStatus('HIGH'), 'HIGH_RISK');
    assert.equal(mapRiskLevelToStatus('ELEVATED'), 'WARNING');
    assert.equal(mapRiskLevelToStatus('NORMAL'), 'NORMAL');

    // Composite gauge score
    const score = calculateCompositeMineRiskScore(zones);
    assert.equal(score, 75); // HIGH -> 75
    assert.equal(calculateCompositeMineRiskScore([zones[1]]), 15); // NORMAL -> 15

    assert.equal(deriveMineRiskStatus(80), 'CRITICAL');
    assert.equal(deriveMineRiskStatus(60), 'HIGH_RISK');
    assert.equal(deriveMineRiskStatus(35), 'WARNING');
    assert.equal(deriveMineRiskStatus(10), 'NORMAL');

    // Explainable indicators extraction
    const assessment = {
      node_id: 1,
      node_identifier: 'NODE-JHR-01',
      risk_level: 'HIGH',
      contributing_factors: [
        { factor_type: 'THRESHOLD_BREACH', message: 'CH4 exceeded critical limit', severity: 'CRITICAL' },
      ],
      assessed_at: '2026-09-09T12:00:00Z',
      evaluation_metadata: {},
    };
    const indicators = extractRiskIndicators(assessment);
    assert.equal(indicators.length, 1);
    assert.equal(indicators[0], 'CH4 exceeded critical limit');
    assert.ok(extractRiskIndicators(null)[0].includes('Nominal Baseline'));
  });

  it('trendsAdapter maps parameter keys and computes time-series data', () => {
    assert.equal(mapParameterKeyToSensorType('displacement'), 'displacement');
    assert.equal(mapParameterKeyToSensorType('tilt'), 'tilt_pitch_deg');
    assert.equal(mapParameterKeyToSensorType('vibration'), 'vibration_peak_mms');

    const bounds = getTimeRangeDateBounds('24H');
    assert.ok(bounds.from_dt);
    assert.ok(bounds.to_dt);

    const backendReadings = [
      { id: 1, node_id: 1, sensor_id: 1, node_identifier: 'NODE-01', sensor_type: 'displacement', value: 2.5, unit: 'mm', timestamp: '2026-09-09T10:00:00Z' },
      { id: 2, node_id: 1, sensor_id: 1, node_identifier: 'NODE-01', sensor_type: 'displacement', value: 3.8, unit: 'mm', timestamp: '2026-09-09T11:00:00Z' },
    ];

    const { points, metrics } = adaptHistoryToTelemetryTimeSeries(backendReadings, 'mm', 2.0);
    assert.equal(points.length, 2);
    assert.equal(points[0].value, 2.5);
    assert.equal(points[1].value, 3.8);
    assert.equal(metrics.current, 3.8);
    assert.equal(metrics.unit, 'mm');
    assert.ok(metrics.rateOfChange > 0);
  });
});

describe('5. UTC Timestamp Utilities', () => {
  it('parses valid ISO string into Date', () => {
    const d = parseUtcTimestamp('2026-09-09T12:00:00Z');
    assert.ok(d instanceof Date);
    assert.equal(d.getUTCFullYear(), 2026);
    assert.equal(d.getUTCMonth(), 8); // 0-indexed September
    assert.equal(d.getUTCDate(), 9);
  });

  it('formats UTC display correctly', () => {
    const formatted = formatUtcDisplay('2026-09-09T12:00:00Z');
    assert.equal(formatted, '2026-09-09 12:00:00 UTC');
  });

  it('handles null/undefined gracefully', () => {
    assert.equal(parseUtcTimestamp(null), null);
    assert.equal(formatUtcDisplay(null), '—');
    assert.equal(formatRelativeTime(null), '—');
  });
});

describe('6. AI / Anomaly Detection Service & Verification', () => {
  it('aiService exposes verified endpoints and omits unmapped ones', () => {
    assert.equal(typeof aiService.getModels, 'function');
    assert.equal(typeof aiService.getLatestAnomalies, 'function');
    assert.equal(typeof aiService.getAnomalyHistory, 'function');
    assert.equal('triggerEvaluation' in aiService, false);
  });

  it('aiService.getModels parses backend prototype model descriptors', async () => {
    const originalFetch = globalThis.fetch;
    const mockModels = [
      {
        model_name: 'StatisticalAnomalyDetector',
        model_version: '1.0.0',
        algorithm: 'Rolling Z-score',
        parameters: { threshold: 3.0, window_size: 30, min_samples: 5 },
        description: 'Unsupervised rolling window Z-score statistical detector.',
        is_assistive: true,
        disclaimer: 'Prototype assistive model. Does NOT replace deterministic safety rules.',
      },
    ];

    globalThis.fetch = async (url) => {
      assert.ok(url.toString().includes('/ai/models'));
      return new Response(JSON.stringify(mockModels), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const models = await aiService.getModels();
      assert.equal(models.length, 1);
      assert.equal(models[0].model_name, 'StatisticalAnomalyDetector');
      assert.equal(models[0].algorithm, 'Rolling Z-score');
      assert.equal(models[0].is_assistive, true);
      assert.equal(models[0].parameters.threshold, 3.0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('aiService.getLatestAnomalies retrieves and validates anomaly evaluation records', async () => {
    const originalFetch = globalThis.fetch;
    const mockAnomalies = [
      {
        id: 101,
        node_id: 1,
        sensor_type: 'displacement',
        is_anomaly: true,
        anomaly_score: 3.45,
        threshold: 3.0,
        model_name: 'StatisticalAnomalyDetector',
        model_version: '1.0.0',
        features: { z_score: 3.45 },
        explanation: 'Observed reading deviated by 3.45 std dev from baseline mean.',
        detected_at: '2026-09-09T14:30:00Z',
      },
    ];

    globalThis.fetch = async (url) => {
      assert.ok(url.toString().includes('/ai/nodes/NODE-01/latest'));
      return new Response(JSON.stringify(mockAnomalies), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const records = await aiService.getLatestAnomalies('NODE-01');
      assert.equal(records.length, 1);
      assert.equal(records[0].is_anomaly, true);
      assert.equal(records[0].anomaly_score, 3.45);
      assert.equal(records[0].sensor_type, 'displacement');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('aiService.getAnomalyHistory correctly forwards filter parameters', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (url) => {
      const urlStr = url.toString();
      assert.ok(urlStr.includes('/ai/nodes/NODE-02/history'));
      assert.ok(urlStr.includes('sensor_type=methane'));
      assert.ok(urlStr.includes('is_anomaly=true'));
      assert.ok(urlStr.includes('limit=50'));
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const res = await aiService.getAnomalyHistory('NODE-02', {
        sensor_type: 'methane',
        is_anomaly: true,
        limit: 50,
      });
      assert.deepEqual(res, []);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('7. Live Monitoring WebSocket Service & Event Routing', () => {
  it('LiveTelemetryService initializes in DISCONNECTED status', () => {
    const service = new LiveTelemetryService();
    assert.equal(service.getStatus(), 'DISCONNECTED');
  });

  it('dispatches incoming LiveTelemetryEvent to registered listeners', () => {
    const service = new LiveTelemetryService();
    let receivedEvent = null;

    const unsub = service.onTelemetry((ev) => {
      receivedEvent = ev;
    });

    const mockTelemetryFrame = JSON.stringify({
      event_type: 'telemetry',
      node_identifier: 'NODE-JHR-01',
      node_id: 1,
      readings: [
        {
          id: 101,
          sensor_id: 1,
          sensor_type: 'tilt',
          node_id: 1,
          node_identifier: 'NODE-JHR-01',
          timestamp: '2026-09-09T12:00:00Z',
          value: 1.25,
        },
      ],
      ingested_at: '2026-09-09T12:00:01Z',
    });

    service.handleIncomingMessage(mockTelemetryFrame);

    assert.ok(receivedEvent !== null);
    assert.equal(receivedEvent.node_identifier, 'NODE-JHR-01');
    assert.equal(receivedEvent.readings.length, 1);
    assert.equal(receivedEvent.readings[0].value, 1.25);

    unsub();
    receivedEvent = null;
    service.handleIncomingMessage(mockTelemetryFrame);
    assert.equal(receivedEvent, null, 'Unsubscribed listener should not receive events');
  });

  it('dispatches incoming LiveAlertEvent to alert listeners', () => {
    const service = new LiveTelemetryService();
    let receivedAlert = null;

    service.onAlert((al) => {
      receivedAlert = al;
    });

    const mockAlertFrame = JSON.stringify({
      event_type: 'alert',
      node_identifier: 'NODE-JHR-02',
      node_id: 2,
      alert_id: 5,
      alert_type: 'EXCESSIVE_DISPLACEMENT',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      message: 'Displacement rate acceleration exceeded threshold.',
      context_data: { rate: 2.4 },
      emitted_at: '2026-09-09T12:05:00Z',
    });

    service.handleIncomingMessage(mockAlertFrame);

    assert.ok(receivedAlert !== null);
    assert.equal(receivedAlert.alert_id, 5);
    assert.equal(receivedAlert.severity, 'CRITICAL');
    assert.equal(receivedAlert.node_identifier, 'NODE-JHR-02');
  });

  it('handles keepalive ping frames without error or false dispatch', () => {
    const service = new LiveTelemetryService();
    let anyDispatched = false;

    service.onTelemetry(() => { anyDispatched = true; });
    service.onAlert(() => { anyDispatched = true; });
    service.onRisk(() => { anyDispatched = true; });
    service.onAnomaly(() => { anyDispatched = true; });

    const pingFrame = JSON.stringify({
      event_type: 'ping',
      server_time: '2026-09-09T12:00:00Z',
    });

    service.handleIncomingMessage(pingFrame);
    assert.equal(anyDispatched, false, 'Ping frame should not trigger domain event listeners');
  });
});


