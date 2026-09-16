/**
 * Dashboard Service
 * Interacts with /dashboard/overview endpoint.
 */

import { api } from '../api/client';
import type { DashboardOverviewResponse } from '../types/api';

export const dashboardService = {
  getOverview: (): Promise<DashboardOverviewResponse> => {
    return api.get<DashboardOverviewResponse>('/dashboard/overview');
  },
};
