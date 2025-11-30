/**
 * API Error Classes
 */

import type { ApiErrorResponse } from './api-client.types';

/**
 * Base class for all API-related errors
 */
export abstract class BaseApiError extends Error {
  abstract readonly isNetworkError: boolean;
  abstract readonly isServerError: boolean;
  abstract readonly isUserRecoverable: boolean;
}

/**
 * Error for network connectivity issues (no internet, DNS failure, etc.)
 */
export class NetworkError extends BaseApiError {
  readonly isNetworkError = true;
  readonly isServerError = false;
  readonly isUserRecoverable = true;

  constructor(originalError?: Error) {
    super(
      originalError?.message ||
        'Network connection failed. Please check your internet connection.'
    );
    this.name = 'NetworkError';
    this.cause = originalError;
  }
}

/**
 * Error for request timeouts
 */
export class RequestTimeoutError extends BaseApiError {
  readonly isNetworkError = true;
  readonly isServerError = false;
  readonly isUserRecoverable = true;
  readonly url: string;
  readonly timeoutMs: number;

  constructor(url: string, timeoutMs: number) {
    super('Request timed out. Please try again.');
    this.name = 'RequestTimeoutError';
    this.url = url;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Error for API/server errors (4xx, 5xx responses)
 */
export class ApiError extends BaseApiError {
  readonly isNetworkError = false;
  readonly isServerError: boolean;
  readonly isUserRecoverable: boolean;
  readonly statusCode: number;
  readonly errorCode?: string;
  readonly details?: string | string[];

  constructor(response: ApiErrorResponse) {
    const message = Array.isArray(response.message)
      ? response.message.join(', ')
      : response.message;
    super(message);
    this.name = 'ApiError';
    this.statusCode = response.statusCode;
    this.errorCode = response.error;
    this.details = response.message;
    this.isServerError = response.statusCode >= 500;
    this.isUserRecoverable = response.statusCode < 500;
  }

  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  isValidationError(): boolean {
    return this.statusCode === 400 || this.statusCode === 422;
  }
}

/**
 * Type guard to check if an error is a network-related error
 */
export function isNetworkError(
  error: unknown
): error is NetworkError | RequestTimeoutError {
  return error instanceof NetworkError || error instanceof RequestTimeoutError;
}

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Get a user-friendly error message for any error
 */
export function getErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    if (error instanceof RequestTimeoutError) {
      return 'The request took too long. Please try again.';
    }
    return 'Unable to connect. Please check your internet connection.';
  }

  if (isApiError(error)) {
    if (error.isAuthError()) {
      return 'Please sign in again to continue.';
    }
    if (error.isNotFoundError()) {
      return 'The requested item was not found.';
    }
    if (error.isValidationError()) {
      return error.message || 'Please check your input and try again.';
    }
    if (error.isServerError) {
      return 'Something went wrong on our end. Please try again later.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
