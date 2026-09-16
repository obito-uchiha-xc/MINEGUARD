/**
 * SIH 2026 Integrated Mine Safety Monitoring System
 * Centralized API Client Configuration
 *
 * Configurable via Vite environment variables:
 * - VITE_API_BASE_URL: Base path for REST API (Default: /api/v1)
 * - VITE_API_TIMEOUT_MS: Request timeout in ms (Default: 10000)
 * - VITE_WS_BASE_URL: WebSocket URL for live telemetry (Default: ws://localhost:8000/api/v1/ws/telemetry)
 */

// Fallbacks are explicitly documented and safe for local development
export const DEFAULT_API_BASE_URL = '/api/v1';
export const DEFAULT_TIMEOUT_MS = 10000;
export const DEFAULT_WS_BASE_URL = 'ws://localhost:8000/api/v1/ws/telemetry';
export const DEFAULT_ENABLE_MOCK_FALLBACK = false;

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  wsBaseUrl: string;
  enableMockFallback: boolean;
}

export const getApiConfig = (): ApiConfig => {
  const viteEnv = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string> }).env : undefined;
  const nodeEnv = typeof globalThis !== 'undefined' && 'process' in globalThis
    ? (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env
    : undefined;

  const baseUrl = viteEnv?.VITE_API_BASE_URL || nodeEnv?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  const timeoutStr = viteEnv?.VITE_API_TIMEOUT_MS || nodeEnv?.VITE_API_TIMEOUT_MS;
  const timeoutMs = timeoutStr ? parseInt(timeoutStr, 10) : DEFAULT_TIMEOUT_MS;
  const wsBaseUrl = viteEnv?.VITE_WS_BASE_URL || nodeEnv?.VITE_WS_BASE_URL || DEFAULT_WS_BASE_URL;
  const enableMockFallback = (viteEnv?.VITE_ENABLE_MOCK_FALLBACK || nodeEnv?.VITE_ENABLE_MOCK_FALLBACK) === 'true';

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''), // strip trailing slash
    timeoutMs: isNaN(timeoutMs) || timeoutMs <= 0 ? DEFAULT_TIMEOUT_MS : timeoutMs,
    wsBaseUrl,
    enableMockFallback,
  };
};

export const API_CONFIG = getApiConfig();
