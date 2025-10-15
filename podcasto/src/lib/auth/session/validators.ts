/**
 * Session Validators
 *
 * Functions for validating and refreshing session state.
 * Sync utility functions don't use 'use server' directive.
 */

import type { Session } from '@supabase/supabase-js';
import type { AuthResult } from '../types';
import type { SessionValidation, RefreshSessionOptions } from './types';
import { createServerClient } from './getters';

/**
 * Default session refresh threshold in seconds (5 minutes before expiry)
 */
const DEFAULT_REFRESH_THRESHOLD_SECONDS = 5 * 60;

// ============================================================================
// Synchronous Utility Functions (no 'use server')
// ============================================================================

/**
 * Check if a session is expired
 *
 * @param session - The session to check
 * @returns True if the session is expired, false otherwise
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session?.expires_at) {
    return true;
  }

  const expiryTime = session.expires_at * 1000; // Convert to milliseconds
  const currentTime = Date.now();

  return currentTime >= expiryTime;
}

/**
 * Get the expiry time of a session in milliseconds since epoch
 *
 * @param session - The session to check
 * @returns The expiry time in milliseconds, or null if no session or no expiry
 */
export function getSessionExpiryTime(session: Session | null): number | null {
  if (!session?.expires_at) {
    return null;
  }

  return session.expires_at * 1000; // Convert to milliseconds
}

/**
 * Get the time remaining until session expiry in seconds
 *
 * @param session - The session to check
 * @returns Seconds until expiry, or null if no session or already expired
 */
export function getSecondsUntilExpiry(session: Session | null): number | null {
  const expiryTime = getSessionExpiryTime(session);

  if (!expiryTime) {
    return null;
  }

  const currentTime = Date.now();
  const remainingMs = expiryTime - currentTime;

  // Return null if already expired
  if (remainingMs <= 0) {
    return null;
  }

  return Math.floor(remainingMs / 1000);
}

/**
 * Check if a session should be refreshed based on expiry threshold
 *
 * @param session - The session to check
 * @param thresholdSeconds - Seconds before expiry to trigger refresh (default: 5 minutes)
 * @returns True if the session should be refreshed
 */
export function shouldRefreshSession(
  session: Session | null,
  thresholdSeconds: number = DEFAULT_REFRESH_THRESHOLD_SECONDS
): boolean {
  const secondsUntilExpiry = getSecondsUntilExpiry(session);

  if (secondsUntilExpiry === null) {
    return true; // No session or already expired
  }

  return secondsUntilExpiry <= thresholdSeconds;
}

/**
 * Validate a session and return detailed validation information
 *
 * @param session - The session to validate
 * @returns SessionValidation object with detailed information
 *
 * @example
 * ```typescript
 * const validation = validateSessionSync(session);
 * if (validation.isValid) {
 *   console.log(`Session expires in ${validation.expiresIn} seconds`);
 * }
 * ```
 */
export function validateSessionSync(session: Session | null): SessionValidation {
  const expired = isSessionExpired(session);
  const expiryTime = getSessionExpiryTime(session);
  const expiresIn = getSecondsUntilExpiry(session);

  return {
    isValid: !expired && !!session,
    isExpired: expired,
    expiresAt: expiryTime,
    expiresIn,
  };
}

/**
 * Format session expiry time as a human-readable string
 *
 * @param session - The session to format
 * @returns Human-readable expiry time, or 'Never' if no expiry
 */
export function formatSessionExpiry(session: Session | null): string {
  const expiryTime = getSessionExpiryTime(session);

  if (!expiryTime) {
    return 'Never';
  }

  const date = new Date(expiryTime);
  return date.toLocaleString();
}

// ============================================================================
// Async Server Functions (use 'use server')
// ============================================================================

/**
 * Validate the current session (async version)
 *
 * Checks if the current session is valid and provides detailed validation info.
 *
 * @returns SessionValidation object with validation details
 *
 * @example
 * ```typescript
 * const validation = await validateSession();
 * if (validation.isValid) {
 *   console.log(`Session expires in ${validation.expiresIn} seconds`);
 * }
 * ```
 */
export async function validateSession(): Promise<SessionValidation> {
  'use server';

  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    return validateSessionSync(session);
  } catch (error) {
    console.error('[SessionValidators] Error validating session:', error);
    return {
      isValid: false,
      isExpired: true,
      expiresAt: null,
      expiresIn: null,
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
 * const result = await refreshSession({ forceRefresh: true });
 * if (result.success) {
 *   console.log('Session refreshed successfully');
 * }
 * ```
 */
export async function refreshSession(
  options: RefreshSessionOptions = {}
): Promise<AuthResult<Session>> {
  'use server';

  try {
    const supabase = await createServerClient();

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
      console.error('[SessionValidators] Error refreshing session:', error.message);
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
    console.error('[SessionValidators] Unexpected error in refreshSession:', error);
    return {
      success: false,
      error: {
        message: 'Unexpected error during session refresh',
      },
    };
  }
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
 * const result = await clearSession();
 * if (result.success) {
 *   console.log('Successfully signed out');
 * }
 * ```
 */
export async function clearSession(): Promise<AuthResult> {
  'use server';

  try {
    const supabase = await createServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[SessionValidators] Error clearing session:', error.message);
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
    console.error('[SessionValidators] Unexpected error in clearSession:', error);
    return {
      success: false,
      error: {
        message: 'Unexpected error during sign out',
      },
    };
  }
}
