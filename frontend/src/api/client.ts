/**
 * SIH 2026 Integrated Mine Safety Monitoring System
 * Centralized HTTP API Client
 *
 * Uses modern fetch API with AbortController timeout, automatic JSON serialization,
 * predictable query parameter formatting, and standard error handling.
 */

import { API_CONFIG } from './config';
import { ApiError, parseApiErrorResponse } from './errors';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, unknown>;
  body?: unknown;
  timeoutMs?: number;
}

/**
 * Builds a query string from an object, skipping undefined/null fields.
 */
export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Core HTTP Request Execution Engine
 */
export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    params,
    body,
    headers: customHeaders,
    timeoutMs = API_CONFIG.timeoutMs,
    ...restOptions
  } = options;

  // Build target URL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryString = buildQueryString(params);
  const fullUrl = `${API_CONFIG.baseUrl}${normalizedPath}${queryString}`;

  // Build headers
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Setup abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // Prepare body if applicable
  let requestBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (typeof body === 'string' || body instanceof FormData || body instanceof Blob) {
      requestBody = body;
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(fullUrl, {
      ...restOptions,
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    // Try to parse JSON response body
    let parsedBody: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        parsedBody = await response.json();
      } catch {
        parsedBody = null;
      }
    } else {
      try {
        parsedBody = await response.text();
      } catch {
        parsedBody = null;
      }
    }

    // Check if HTTP response is an error
    if (!response.ok) {
      throw parseApiErrorResponse(response.status, normalizedPath, parsedBody);
    }

    return parsedBody as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle Timeout (AbortError)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError({
        message: `Request to ${normalizedPath} timed out after ${timeoutMs}ms.`,
        status: 408,
        code: 'TIMEOUT_ERROR',
        path: normalizedPath,
        isTimeout: true,
      });
    }

    // Handle Network Errors (TypeError: Failed to fetch)
    const errMessage = error instanceof Error ? error.message : 'Network connection failure';
    throw new ApiError({
      message: `Network error connecting to backend: ${errMessage}`,
      status: 0,
      code: 'NETWORK_ERROR',
      path: normalizedPath,
      details: error,
      isNetworkError: true,
    });
  }
}

// Convenience Methods
export const api = {
  get: <T>(path: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<T> =>
    apiClient<T>(path, { ...options, method: 'GET', params }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    apiClient<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    apiClient<T>(path, { ...options, method: 'PUT', body }),

  delete: <T>(path: string, options?: RequestOptions): Promise<T> =>
    apiClient<T>(path, { ...options, method: 'DELETE' }),
};
