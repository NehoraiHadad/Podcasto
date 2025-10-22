import { NextResponse } from 'next/server';

/**
 * Standard success response structure for API endpoints
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Standard error response structure for API endpoints
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  timestamp: string;
}

/**
 * Create a standardized success response with consistent structure
 *
 * @example
 * ```typescript
 * // Simple success response
 * return apiSuccess({ episodeId: '123', message: 'Processing started' });
 *
 * // Success with custom status code
 * return apiSuccess({ userId: '456' }, 201);
 *
 * // Success with complex data
 * return apiSuccess({
 *   results: episodes,
 *   count: episodes.length
 * });
 * ```
 *
 * @param data - Response data to return to client
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with standardized success format
 */
export function apiSuccess<T>(
  data: T,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Create a standardized error response with consistent structure
 *
 * @example
 * ```typescript
 * // Simple error response
 * return apiError('Episode not found', 404);
 *
 * // Error from caught exception
 * try {
 *   // ... operation
 * } catch (error) {
 *   return apiError(error, 500);
 * }
 *
 * // Error with additional details
 * return apiError('Validation failed', 400, {
 *   fields: ['title', 'description']
 * });
 * ```
 *
 * @param error - Error message string or Error object
 * @param status - HTTP status code (default: 500)
 * @param details - Optional additional error details for debugging
 * @returns NextResponse with standardized error format
 */
export function apiError(
  error: string | Error,
  status = 500,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : error;

  const response: ApiErrorResponse = {
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  };

  // Only include details in development or if explicitly provided
  if (details !== undefined) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

