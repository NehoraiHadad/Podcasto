'use server';

import { withAuthErrorHandling, createAuthError, AUTH_ERROR_CODES, logAuthError, AuthenticationError } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type { AuthErrorCode } from '@/lib/auth';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActionResult } from './types';
import { executeAction } from './error-handler';

interface RunAuthActionOptions {
  /** Optional friendly error message when the action fails */
  errorMessage?: string;
  /**
   * Additional context that will be attached to auth error logs.
   * Can be a static object or a callback that derives context from the error.
   */
  logContext?:
    | Record<string, unknown>
    | ((error: AuthenticationError) => Record<string, unknown> | undefined);
}

/**
 * Helper to execute Supabase auth actions with consistent error handling.
 *
 * Wraps {@link withAuthErrorHandling} to convert Supabase errors into
 * {@link AuthenticationError} instances and then leverages the shared
 * {@link executeAction} helper to produce {@link ActionResult} responses.
 */
export async function runAuthAction<TResult>(
  callback: (supabase: SupabaseClient) => Promise<TResult>,
  options: RunAuthActionOptions = {}
): Promise<ActionResult<TResult>> {
  const supabase = await createServerClient();
  const safeAction = withAuthErrorHandling(async () => callback(supabase));

  return executeAction(async () => {
    const authResult = await safeAction();

    if (!authResult.success) {
      const authError = authResult.error
        ? new AuthenticationError(
            (authResult.error.code as AuthErrorCode | undefined) ?? AUTH_ERROR_CODES.UNKNOWN_ERROR,
            authResult.error.message,
            authResult.error.status
              ? { status: authResult.error.status }
              : undefined
          )
        : createAuthError(
            { message: options.errorMessage ?? 'Authentication failed' },
            AUTH_ERROR_CODES.UNKNOWN_ERROR
          );

      if (options.logContext) {
        const context =
          typeof options.logContext === 'function'
            ? options.logContext(authError)
            : options.logContext;

        if (context) {
          logAuthError(authError, context);
        }
      }

      // Re-throw the serializable AuthError object so executeAction can
      // convert it into an ActionResult while preserving message/code.
      throw authResult.error ?? { message: authError.message, code: authError.code };
    }

    return authResult.data as TResult;
  }, options.errorMessage);
}
