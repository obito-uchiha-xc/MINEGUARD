/**
 * Risk Assessment Service
 * Interacts with /risk endpoints.
 */

import { api } from '../api/client';
import type { RiskAssessmentResponse, ZoneRiskSummaryResponse } from '../types/api';

export const riskService = {
  getNodeRisk: (nodeIdentifier: string): Promise<RiskAssessmentResponse> => {
    return api.get<RiskAssessmentResponse>(
      `/risk/nodes/${encodeURIComponent(nodeIdentifier)}/latest`
    );
  },

  getZoneRisk: (zoneId: number): Promise<ZoneRiskSummaryResponse> => {
    return api.get<ZoneRiskSummaryResponse>(`/risk/zones/${zoneId}`);
  },
};
