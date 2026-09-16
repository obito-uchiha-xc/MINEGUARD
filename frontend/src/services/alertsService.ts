/**
 * Alerts Service
 * Interacts with /alerts endpoints.
 */

import { api } from '../api/client';
import type {
  AlertHistoryParams,
  AlertResolveRequest,
  AlertResponse,
} from '../types/api';

export const alertsService = {
  getActiveAlerts: (): Promise<AlertResponse[]> => {
    return api.get<AlertResponse[]>('/alerts/active');
  },

  getAlertHistory: (params?: AlertHistoryParams): Promise<AlertResponse[]> => {
    return api.get<AlertResponse[]>('/alerts/history', params as Record<string, unknown>);
  },

  resolveAlert: (alertId: number, data?: AlertResolveRequest): Promise<AlertResponse> => {
    return api.post<AlertResponse>(`/alerts/${alertId}/resolve`, data);
  },
};
