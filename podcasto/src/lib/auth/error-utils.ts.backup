/**
 * Authentication Error Utilities
 *
 * Provides utilities for creating, handling, and converting authentication errors.
 * Focuses on security by sanitizing errors for client display.
 */

import {
  AuthError as SupabaseAuthError,
  AuthApiError as SupabaseAuthApiError,
  AuthWeakPasswordError as SupabaseAuthWeakPasswordError,
  AuthSessionMissingError as SupabaseAuthSessionMissingError,
  AuthInvalidCredentialsError as SupabaseAuthInvalidCredentialsError,
  AuthRetryableFetchError as SupabaseAuthRetryableFetchError,
} from '@supabase/supabase-js';

import {
  AuthenticationError,
  InvalidCredentialsError,
  SessionMissingError,
  UnauthorizedError,
  WeakPasswordError,
  RateLimitError,
  AUTH_ERROR_CODES,
  CLIENT_ERROR_MESSAGES,
  type AuthErrorCode,
} from './errors';

import type { AuthResult, AuthError } from './types';

/**
 * Maps Supabase error messages to our standardized error codes
 * This uses pattern matching to identify common error scenarios
 */
const SUPABASE_ERROR_PATTERNS: Array<{
  pattern: RegExp;
  code: AuthErrorCode;
}> = [
  // Authentication errors
  { pattern: /invalid.*credentials/i, code: AUTH_ERROR_CODES.INVALID_CREDENTIALS },
  { pattern: /invalid login credentials/i, code: AUTH_ERROR_CODES.INVALID_CREDENTIALS },
  { pattern: /email not confirmed/i, code: AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED },
  { pattern: /invalid.*token/i, code: AUTH_ERROR_CODES.INVALID_TOKEN },
  { pattern: /jwt.*expired/i, code: AUTH_ERROR_CODES.SESSION_EXPIRED },
  { pattern: /session.*expired/i, code: AUTH_ERROR_CODES.SESSION_EXPIRED },
  { pattern: /session.*missing/i, code: AUTH_ERROR_CODES.SESSION_MISSING },
  { pattern: /no.*session/i, code: AUTH_ERROR_CODES.SESSION_MISSING },

  // User management
  { pattern: /user.*not.*found/i, code: AUTH_ERROR_CODES.USER_NOT_FOUND },
  { pattern: /user.*already.*registered/i, code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS },
  { pattern: /email.*already.*exists/i, code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS },
  { pattern: /email.*taken/i, code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS },

  // Validation
  { pattern: /password.*weak/i, code: AUTH_ERROR_CODES.WEAK_PASSWORD },
  { pattern: /password.*short/i, code: AUTH_ERROR_CODES.WEAK_PASSWORD },
  { pattern: /invalid.*email/i, code: AUTH_ERROR_CODES.INVALID_EMAIL },

  // Rate limiting
  { pattern: /too.*many.*requests/i, code: AUTH_ERROR_CODES.TOO_MANY_REQUESTS },
  { pattern: /rate.*limit/i, code: AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED },

  // Network/Service
  { pattern: /network.*error/i, code: AUTH_ERROR_CODES.NETWORK_ERROR },
  { pattern: /fetch.*failed/i, code: AUTH_ERROR_CODES.NETWORK_ERROR },
  { pattern: /service.*unavailable/i, code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE },
];

/**
 * Convert a Supabase auth error to our standardized error type
 *
 * @param error The Supabase error to convert
 * @returns An AuthenticationError instance
 *
 * @example
 * ```typescript
 * try {
 *   await supabase.auth.signInWithPassword({ email, password });
 * } catch (error) {
 *   const authError = handleSupabaseAuthError(error);
 *   console.log(authError.code); // 'invalid_credentials'
 * }
 * ```
 */
export function handleSupabaseAuthError(
  error: unknown
): AuthenticationError {
  // Handle Supabase AuthWeakPasswordError specially to preserve reasons
  if (error instanceof SupabaseAuthWeakPasswordError) {
    return new WeakPasswordError(
      error.reasons?.map((r) => r) || [],
      { originalError: error.message }
    );
  }

  // Handle Supabase AuthSessionMissingError
  if (error instanceof SupabaseAuthSessionMissingError) {
    return new SessionMissingError({ originalError: error.message });
  }

  // Handle Supabase AuthInvalidCredentialsError
  if (error instanceof SupabaseAuthInvalidCredentialsError) {
    return new InvalidCredentialsError({ originalError: error.message });
  }

  // Handle Supabase AuthRetryableFetchError (network/rate limit)
  if (error instanceof SupabaseAuthRetryableFetchError) {
    const status = error.status || 0;
    if (status === 429) {
      return new RateLimitError(undefined, { originalError: error.message });
    }
    return new AuthenticationError(
      AUTH_ERROR_CODES.NETWORK_ERROR,
      undefined,
      { originalError: error.message, status }
    );
  }

  // Handle generic Supabase AuthError and AuthApiError
  if (
    error instanceof SupabaseAuthError ||
    error instanceof SupabaseAuthApiError
  ) {
    const errorMessage = error.message.toLowerCase();

    // Try to match error message to a known pattern
    for (const { pattern, code } of SUPABASE_ERROR_PATTERNS) {
      if (pattern.test(errorMessage)) {
        return new AuthenticationError(code, undefined, {
          originalError: error.message,
          status: error.status,
          code: error.code,
        });
      }
    }

    // Check status code if no pattern matched
    if (error.status === 401) {
      return new UnauthorizedError({
        originalError: error.message,
        status: error.status,
      });
    }

    if (error.status === 429) {
      return new RateLimitError(undefined, {
        originalError: error.message,
        status: error.status,
      });
    }

    // Default to generic error based on status
    const code =
      error.status && error.status >= 500
        ? AUTH_ERROR_CODES.INTERNAL_ERROR
        : AUTH_ERROR_CODES.UNKNOWN_ERROR;

    return new AuthenticationError(code, undefined, {
      originalError: error.message,
      status: error.status,
      code: error.code,
    });
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Try to match error message to a known pattern
    for (const { pattern, code } of SUPABASE_ERROR_PATTERNS) {
      if (pattern.test(errorMessage)) {
        return new AuthenticationError(code, undefined, {
          originalError: error.message,
        });
      }
    }

    // Default to internal error for unknown Error instances
    return new AuthenticationError(
      AUTH_ERROR_CODES.INTERNAL_ERROR,
      undefined,
      { originalError: error.message }
    );
  }

  // Handle unknown error types
  return new AuthenticationError(AUTH_ERROR_CODES.UNKNOWN_ERROR, undefined, {
    originalError: String(error),
  });
}

/**
 * Type guard to check if an error is an AuthenticationError
 *
 * @param error The error to check
 * @returns True if the error is an AuthenticationError
 */
export function isAuthenticationError(
  error: unknown
): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Convert an AuthenticationError to an AuthError (for backwards compatibility)
 *
 * @param error The AuthenticationError to convert
 * @returns An AuthError object safe for client display
 */
export function toAuthError(error: AuthenticationError): AuthError {
  return {
    message: error.message,
    code: error.code,
    status: error.statusCode,
  };
}

/**
 * Convert an AuthenticationError to an AuthResult
 *
 * @param error The error to convert
 * @returns An AuthResult with success: false
 *
 * @example
 * ```typescript
 * export async function loginAction(formData: FormData) {
 *   try {
 *     // ... auth logic
 *   } catch (error) {
 *     if (isAuthenticationError(error)) {
 *       return authErrorToResult(error);
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */
export function authErrorToResult<T = never>(
  error: AuthenticationError
): AuthResult<T> {
  return {
    success: false,
    error: toAuthError(error),
  };
}

/**
 * Log authentication errors securely
 *
 * Logs detailed error information server-side while being careful not to
 * log sensitive information like passwords or tokens.
 *
 * @param error The error to log
 * @param context Additional context for the log
 */
export function logAuthError(
  error: AuthenticationError,
  context?: Record<string, unknown>
): void {
  // Filter out sensitive keys from context
  const sanitizedContext = context
    ? Object.fromEntries(
        Object.entries(context).filter(
          ([key]) =>
            !['password', 'token', 'secret', 'apiKey', 'api_key'].some((sensitive) =>
              key.toLowerCase().includes(sensitive)
            )
        )
      )
    : {};

  const logData = {
    name: error.name,
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: error.timestamp,
    context: {
      ...error.context,
      ...sanitizedContext,
    },
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  // Use appropriate log level based on error type
  if (error.statusCode >= 500) {
    console.error('[Auth Error]', JSON.stringify(logData, null, 2));
  } else if (error.statusCode === 429) {
    console.warn('[Auth Warning]', JSON.stringify(logData, null, 2));
  } else {
    console.info('[Auth Info]', JSON.stringify(logData, null, 2));
  }
}

/**
 * Create an AuthenticationError from an unknown error
 *
 * Safely converts any error type to an AuthenticationError.
 * Handles Supabase errors, standard Errors, and unknown types.
 *
 * @param error The error to convert
 * @param fallbackCode Fallback error code if type cannot be determined
 * @returns An AuthenticationError instance
 */
export function createAuthError(
  error: unknown,
  fallbackCode: AuthErrorCode = AUTH_ERROR_CODES.INTERNAL_ERROR
): AuthenticationError {
  // Already an AuthenticationError
  if (isAuthenticationError(error)) {
    return error;
  }

  // Supabase error
  if (
    error instanceof SupabaseAuthError ||
    error instanceof SupabaseAuthApiError
  ) {
    return handleSupabaseAuthError(error);
  }

  // Standard Error
  if (error instanceof Error) {
    return handleSupabaseAuthError(error);
  }

  // Unknown error type
  return new AuthenticationError(fallbackCode, undefined, {
    originalError: String(error),
  });
}

/**
 * Get a user-friendly error message from any error type
 *
 * @param error The error to get a message from
 * @returns A safe, user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isAuthenticationError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    const authError = handleSupabaseAuthError(error);
    return authError.message;
  }

  return CLIENT_ERROR_MESSAGES[AUTH_ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * Wrap an async function with error handling
 *
 * Automatically converts errors to AuthenticationError and returns AuthResult.
 *
 * @param fn The async function to wrap
 * @returns A wrapped function that returns AuthResult
 *
 * @example
 * ```typescript
 * const safeLogin = withAuthErrorHandling(async (email: string, password: string) => {
 *   const supabase = await createClient();
 *   const { data } = await supabase.auth.signInWithPassword({ email, password });
 *   return data.user;
 * });
 *
 * const result = await safeLogin('user@example.com', 'password');
 * if (result.success) {
 *   console.log('User:', result.data);
 * }
 * ```
 */
export function withAuthErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<AuthResult<TReturn>> {
  return async (...args: TArgs): Promise<AuthResult<TReturn>> => {
    try {
      const data = await fn(...args);
      return {
        success: true,
        data,
      };
    } catch (error) {
      const authError = createAuthError(error);
      logAuthError(authError, { function: fn.name, args });
      return authErrorToResult(authError);
    }
  };
}
