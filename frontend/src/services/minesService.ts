/**
 * Mines Service
 * Interacts with /mines endpoints.
 */

import { api } from '../api/client';
import type { MineDetailResponse, MineSummaryResponse } from '../types/api';

export const minesService = {
  listMines: (): Promise<MineSummaryResponse[]> => {
    return api.get<MineSummaryResponse[]>('/mines');
  },

  getMineDetail: (mineId: number): Promise<MineDetailResponse> => {
    return api.get<MineDetailResponse>(`/mines/${mineId}`);
  },
};
