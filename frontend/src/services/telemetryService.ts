/**
 * Telemetry Service
 * Interacts with /telemetry endpoints.
 */

import { api } from '../api/client';
import type {
  LatestReadingsResponse,
  TelemetryHistoryParams,
  TelemetryHistoryResponse,
  WindowAggregateParams,
  WindowAggregateResponse,
} from '../types/api';

export const telemetryService = {
  getLatestReadings: (nodeIdentifier: string): Promise<LatestReadingsResponse> => {
    return api.get<LatestReadingsResponse>(
      `/telemetry/nodes/${encodeURIComponent(nodeIdentifier)}/latest`
    );
  },

  getHistory: (
    nodeIdentifier: string,
    params?: TelemetryHistoryParams
  ): Promise<TelemetryHistoryResponse> => {
    return api.get<TelemetryHistoryResponse>(
      `/telemetry/nodes/${encodeURIComponent(nodeIdentifier)}/history`,
      params as unknown as Record<string, unknown>
    );
  },

  getWindowAggregate: (
    nodeIdentifier: string,
    params: WindowAggregateParams
  ): Promise<WindowAggregateResponse> => {
    return api.get<WindowAggregateResponse>(
      `/telemetry/nodes/${encodeURIComponent(nodeIdentifier)}/aggregate`,
      params as unknown as Record<string, unknown>
    );
  },
};
