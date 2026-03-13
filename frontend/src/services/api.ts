/**
 * Central API service wrapper for all HTTP requests
 */

import { API_BASE_URL, ERROR_NETWORK, ERROR_SERVER, TOKEN_STORAGE_KEY } from '../utils/constants';
import { createApiError, normalizeApiError, type NormalizedApiError } from '../utils/errors';
import type { ApiResponse } from '../types';

export interface ApiOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

export type ApiError = NormalizedApiError;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Get JWT token from localStorage
 * @returns JWT token or null
 */
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Store JWT token in localStorage
 * @param token JWT token to store
 */
export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    console.error('Failed to store token');
  }
};

/**
 * Remove JWT token from localStorage
 */
export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    console.error('Failed to clear token');
  }
};

const parseApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: {
        message: `HTTP ${response.status}: ${response.statusText}`,
      },
    };
  }
};

/**
 * Make an API call with automatic auth header and error handling
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param endpoint API endpoint path (e.g., '/api/auth/login')
 * @param data Optional request body data (for POST, PUT, etc.)
 * @param options Optional fetch options and custom headers
 * @returns Parsed API response data
 * @throws ApiError with message and optional status/details
 */
export const apiCall = async <TResponse = unknown, TRequest = unknown>(
  method: HttpMethod,
  endpoint: string,
  data?: TRequest,
  options?: ApiOptions
): Promise<TResponse> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  // Add authorization header if token exists
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  };

  try {
    const response = await fetch(url, fetchOptions);
    const responseData = await parseApiResponse<TResponse>(response);

    // Handle non-2xx status codes
    if (!response.ok) {
      // Handle 401 Unauthorized - clear token
      if (response.status === 401) {
        clearToken();
      }

      throw createApiError(
        responseData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        responseData.error?.details
      );
    }

    // Check API success flag
    if (!responseData.success) {
      throw createApiError(
        responseData.error?.message || ERROR_SERVER,
        response.status || 500,
        responseData.error?.details
      );
    }

    return responseData.data as TResponse;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      throw createApiError(ERROR_NETWORK, 0, error.message);
    }

    if (error instanceof Error) {
      throw normalizeApiError(error);
    }

    throw createApiError('An unexpected error occurred');
  }
};

/**
 * Convenience methods for common HTTP verbs
 */

/**
 * Make a GET request
 */
export const apiGet = <TResponse = unknown>(
  endpoint: string,
  options?: ApiOptions
): Promise<TResponse> => {
  return apiCall<TResponse>('GET', endpoint, undefined, options);
};

/**
 * Make a POST request
 */
export const apiPost = <TResponse = unknown, TRequest = unknown>(
  endpoint: string,
  data?: TRequest,
  options?: ApiOptions
): Promise<TResponse> => {
  return apiCall<TResponse, TRequest>('POST', endpoint, data, options);
};

/**
 * Make a PUT request
 */
export const apiPut = <TResponse = unknown, TRequest = unknown>(
  endpoint: string,
  data?: TRequest,
  options?: ApiOptions
): Promise<TResponse> => {
  return apiCall<TResponse, TRequest>('PUT', endpoint, data, options);
};

/**
 * Make a DELETE request
 */
export const apiDelete = <TResponse = unknown>(
  endpoint: string,
  options?: ApiOptions
): Promise<TResponse> => {
  return apiCall<TResponse>('DELETE', endpoint, undefined, options);
};

/**
 * Make a PATCH request
 */
export const apiPatch = <TResponse = unknown, TRequest = unknown>(
  endpoint: string,
  data?: TRequest,
  options?: ApiOptions
): Promise<TResponse> => {
  return apiCall<TResponse, TRequest>('PATCH', endpoint, data, options);
};
