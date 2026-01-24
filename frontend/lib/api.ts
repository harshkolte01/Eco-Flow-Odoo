/**
 * API fetch helper with Bearer token support
 * Handles JSON requests/responses and error extraction
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, any>;
  auth?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

/**
 * Custom error class for API failures
 */
export class ApiError extends Error {
  errors?: string[];
  statusCode: number;

  constructor(message: string, statusCode: number, errors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Wrapper around fetch with automatic JSON handling and Bearer token support
 * @param path - API path (e.g., '/api/auth/login')
 * @param options - Fetch options including method, body, and auth flag
 * @returns Parsed JSON response
 * @throws ApiError with backend message and errors on non-2xx responses
 */
export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, auth = true } = options;

  // Build full URL
  const url = `${API_BASE_URL}${path}`;

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add Bearer token if auth is enabled and token exists
  if (auth !== false) {
    const token = localStorage.getItem('ecoflow_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Add body for non-GET requests
  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Parse JSON response
    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      // If JSON parsing fails, create a generic response
      data = {
        success: false,
        message: 'Invalid response from server',
      };
    }

    // Handle non-2xx responses
    if (!response.ok) {
      // Extract error message and potential validation errors
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    // Re-throw ApiError as is, or wrap other errors
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new ApiError(error.message, 500);
    }
    throw new ApiError('An unexpected error occurred', 500);
  }
}
