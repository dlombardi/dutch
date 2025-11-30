/**
 * API Client Types
 */

export interface ApiErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
}
