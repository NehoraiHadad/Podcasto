'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  AuthState,
  AuthResult,
  User,
  Session,
  RefreshSessionOptions,
  SessionValidation,
} from './types';
import {
  shouldRefreshSession,
  validateSession as validateSessionUtil,
} from './session-utils';
import { cache } from 'react';

/**
 * SessionService - Centralized session management for Supabase Auth
 *
 * This service provides a unified interface for handling authentication sessions
 * following 2025 Supabase best practices for Next.js 15 App Router.
 *
 * Key Principles:
 * - Always use getUser() for session validation (never trust getSession() server-side)
 * - Use HTTP-only cookies for token storage
 * - Leverage middleware for automatic session refresh
 * - Cache user data per request to avoid redundant database calls
 */

/**
 * Get the current authenticated user
 *
 * This method is cached per request to avoid multiple database calls.
 * Uses Supabase's getUser() which validates the JWT token server-side.
 *
 * @returns The authenticated user or null if not authenticated
 *
 * @example
 * ```typescript
 * const user = await SessionService.getUser();
 * if (user) {
 *   console.log(`Authenticated as ${user.email}`);
 * }
 * ```
 */
export const getUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();

    // IMPORTANT: Use getUser() not getSession() for server-side validation
    // getUser() validates the JWT token, while getSession() just reads from storage
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Only log unexpected errors, not "no session" errors
      if (!error.message.includes('Auth session missing')) {
        console.error('[SessionService] Error getting user:', error.message);
      }
      return null;
    }

    return user;
  } catch (error) {
    console.error('[SessionService] Unexpected error in getUser:', error);
    return null;
  }
});

/**
 * Get the current session
 *
 * Note: This returns the session from storage. For server-side validation,
 * prefer using getUser() or getAuthState() which validate the JWT.
 *
 * @returns The current session or null if not authenticated
 *
 * @example
 * ```typescript
 * const session = await SessionService.getSession();
 * if (session) {
 *   console.log(`Session expires at ${session.expires_at}`);
 * }
 * ```
 */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await createClient();

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[SessionService] Error getting session:', error.message);
      return null;
    }

    return session;
  } catch (error) {
    console.error('[SessionService] Unexpected error in getSession:', error);
    return null;
  }
}

/**
 * Get the complete authentication state
 *
 * Returns both user and session information along with authentication status.
 * Uses getUser() for validation, ensuring the session is valid.
 *
 * @returns AuthState object containing user, session, and authentication status
 *
 * @example
 * ```typescript
 * const authState = await SessionService.getAuthState();
 * if (authState.isAuthenticated) {
 *   console.log(`User: ${authState.user?.email}`);
 * }
 * ```
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    const supabase = await createClient();

    // Use getUser() for validation
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        user: null,
        session: null,
        isAuthenticated: false,
      };
    }

    // Get session for additional metadata
    const { data: { session } } = await supabase.auth.getSession();

    return {
      user,
      session,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('[SessionService] Unexpected error in getAuthState:', error);
    return {
      user: null,
      session: null,
      isAuthenticated: false,
    };
  }
}

/**
 * Refresh the current session
 *
 * Attempts to refresh the authentication token. This is typically handled
 * automatically by middleware, but can be called manually if needed.
 *
 * @param options - Refresh options
 * @returns AuthResult indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await SessionService.refreshSession({ forceRefresh: true });
 * if (result.success) {
 *   console.log('Session refreshed successfully');
 * }
 * ```
 */
export async function refreshSession(
  options: RefreshSessionOptions = {}
): Promise<AuthResult<Session>> {
  try {
    const supabase = await createClient();

    // Check if refresh is needed (unless forced)
    if (!options.forceRefresh) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !shouldRefreshSession(session)) {
        return {
          success: true,
          data: session,
        };
      }
    }

    // Attempt to refresh the session
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[SessionService] Error refreshing session:', error.message);
      return {
        success: false,
        error: {
          message: 'Failed to refresh session',
          code: error.name,
        },
      };
    }

    if (!data.session) {
      return {
        success: false,
        error: {
          message: 'No session returned after refresh',
        },
      };
    }

    return {
      success: true,
      data: data.session,
    };
  } catch (error) {
    console.error('[SessionService] Unexpected error in refreshSession:', error);
    return {
      success: false,
      error: {
        message: 'Unexpected error during session refresh',
      },
    };
  }
}

/**
 * Validate the current session
 *
 * Checks if the current session is valid and provides detailed validation info.
 *
 * @returns SessionValidation object with validation details
 *
 * @example
 * ```typescript
 * const validation = await SessionService.validateSession();
 * if (validation.isValid) {
 *   console.log(`Session expires in ${validation.expiresIn} seconds`);
 * }
 * ```
 */
export async function validateSession(): Promise<SessionValidation> {
  const session = await getSession();
  return validateSessionUtil(session);
}

/**
 * Clear the current session (sign out)
 *
 * Logs out the user and clears all session data from cookies.
 *
 * @returns AuthResult indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await SessionService.clearSession();
 * if (result.success) {
 *   console.log('Successfully signed out');
 * }
 * ```
 */
export async function clearSession(): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[SessionService] Error clearing session:', error.message);
      return {
        success: false,
        error: {
          message: 'Failed to sign out',
          code: error.name,
        },
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('[SessionService] Unexpected error in clearSession:', error);
    return {
      success: false,
      error: {
        message: 'Unexpected error during sign out',
      },
    };
  }
}

/**
 * SessionService namespace export for cleaner imports
 *
 * NOTE: This export is commented out to avoid "use server" conflicts in Next.js.
 * In "use server" files, you can only export async functions, not objects.
 *
 * Instead, import individual functions:
 * import { getUser, getSession, clearSession } from '@/lib/auth';
 */
// export const SessionService = {
//   getUser,
//   getSession,
//   getAuthState,
//   refreshSession,
//   validateSession,
//   clearSession,
// } as const;
