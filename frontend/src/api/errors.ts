/**
 * SIH 2026 Integrated Mine Safety Monitoring System
 * Centralized API Error Model & Handlers
 *
 * Maps HTTP status codes and backend JSON error envelopes into
 * predictable, typed error structures.
 */

import type { ApiErrorEnvelope } from '../types/api';

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'HTTP_ERROR'
  | string;

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;
  public readonly details?: unknown;
  public readonly path?: string;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;

  constructor(params: {
    message: string;
    status: number;
    code: ApiErrorCode;
    details?: unknown;
    path?: string;
    isNetworkError?: boolean;
    isTimeout?: boolean;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.path = params.path;
    this.isNetworkError = Boolean(params.isNetworkError);
    this.isTimeout = Boolean(params.isTimeout);

    // Maintain standard prototype chain in transpiled code
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Serializes the error into a clean JSON representation for logging.
   */
  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      path: this.path,
      isNetworkError: this.isNetworkError,
      isTimeout: this.isTimeout,
    };
  }
}

/**
 * Type guard to check if an unknown error is an ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Extracts a user-friendly error message from any error object.
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

/**
 * Parses a backend error response body into an ApiError.
 */
export function parseApiErrorResponse(
  status: number,
  path: string,
  responseBody: unknown
): ApiError {
  // Check if response follows backend standardized envelope: { error: { code, message, details } }
  const envelope = responseBody as ApiErrorEnvelope | null;
  if (envelope?.error?.message) {
    return new ApiError({
      message: envelope.error.message,
      status,
      code: envelope.error.code || determineDefaultCode(status),
      details: envelope.error.details,
      path,
    });
  }

  // Fallback for non-standard payloads
  const defaultCode = determineDefaultCode(status);
  const defaultMsg = typeof responseBody === 'string' && responseBody.trim().length > 0
    ? responseBody
    : `Request failed with status ${status}`;

  return new ApiError({
    message: defaultMsg,
    status,
    code: defaultCode,
    details: responseBody,
    path,
  });
}

function determineDefaultCode(status: number): ApiErrorCode {
  if (status === 404) return 'NOT_FOUND';
  if (status === 422) return 'VALIDATION_ERROR';
  if (status >= 500) return 'SERVER_ERROR';
  return 'HTTP_ERROR';
}
