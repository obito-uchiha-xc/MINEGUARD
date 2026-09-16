/**
 * Nodes Service
 * Interacts with /nodes endpoints.
 */

import { api } from '../api/client';
import type { NodeDetailResponse, NodeListParams, NodeSummaryResponse } from '../types/api';

export const nodesService = {
  listNodes: (params?: NodeListParams): Promise<NodeSummaryResponse[]> => {
    return api.get<NodeSummaryResponse[]>('/nodes', params as Record<string, unknown>);
  },

  getNodeDetail: (nodeIdentifier: string): Promise<NodeDetailResponse> => {
    return api.get<NodeDetailResponse>(`/nodes/${encodeURIComponent(nodeIdentifier)}`);
  },
};
