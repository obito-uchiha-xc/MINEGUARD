/**
 * Health & Readiness Service
 * Interacts with /health endpoints.
 */

import { api } from '../api/client';
import type { HealthResponse, ReadinessResponse } from '../types/api';

export const healthService = {
  checkHealth: (): Promise<HealthResponse> => {
    return api.get<HealthResponse>('/health');
  },

  checkLiveness: (): Promise<HealthResponse> => {
    return api.get<HealthResponse>('/health/liveness');
  },

  checkReadiness: (): Promise<ReadinessResponse> => {
    return api.get<ReadinessResponse>('/health/readiness');
  },
};
