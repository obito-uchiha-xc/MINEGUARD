/**
 * Assistive AI & Anomaly Detection Service
 * Interacts with /ai endpoints.
 */

import { api } from '../api/client';
import type {
  AIAnomalyHistoryParams,
  AIAnomalyRecordResponse,
  ModelMetadataResponse,
} from '../types/api';

export const aiService = {
  getLatestAnomalies: (nodeIdentifier: string): Promise<AIAnomalyRecordResponse[]> => {
    return api.get<AIAnomalyRecordResponse[]>(
      `/ai/nodes/${encodeURIComponent(nodeIdentifier)}/latest`
    );
  },

  getAnomalyHistory: (
    nodeIdentifier: string,
    params?: AIAnomalyHistoryParams
  ): Promise<AIAnomalyRecordResponse[]> => {
    return api.get<AIAnomalyRecordResponse[]>(
      `/ai/nodes/${encodeURIComponent(nodeIdentifier)}/history`,
      params as Record<string, unknown>
    );
  },

  getModels: (): Promise<ModelMetadataResponse[]> => {
    return api.get<ModelMetadataResponse[]>('/ai/models');
  },
};

