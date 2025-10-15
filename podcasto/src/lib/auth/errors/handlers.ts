/**
 * Error Handlers
 *
 * Functions for handling and converting errors from Supabase and other sources.
 * Note: handleSupabaseAuthError has been moved to utils.ts to avoid circular dependencies.
 */

import {
  AuthenticationError,
} from './classes';

/**
 * Format an authentication error for API response
 *
 * Converts an AuthenticationError to a plain object safe for JSON serialization.
 *
 * @param error - The error to format
 * @returns Formatted error object
 *
 * @example
 * ```typescript
 * const formatted = formatErrorResponse(authError);
 * return Response.json(formatted, { status: authError.statusCode });
 * ```
 */
export function formatErrorResponse(error: AuthenticationError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    },
  };
}
