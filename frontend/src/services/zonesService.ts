/**
 * Zones Service
 * Interacts with /zones endpoints.
 */

import { api } from '../api/client';
import type { ZoneDetailResponse, ZoneSummaryResponse } from '../types/api';

export const zonesService = {
  listZones: (mineId?: number): Promise<ZoneSummaryResponse[]> => {
    return api.get<ZoneSummaryResponse[]>('/zones', { mine_id: mineId });
  },

  getZoneDetail: (zoneId: number): Promise<ZoneDetailResponse> => {
    return api.get<ZoneDetailResponse>(`/zones/${zoneId}`);
  },
};
