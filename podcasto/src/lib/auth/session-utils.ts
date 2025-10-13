import type { Session } from '@supabase/supabase-js';
import type { SessionValidation } from './types';

/**
 * Default session refresh threshold in seconds (5 minutes before expiry)
 */
const DEFAULT_REFRESH_THRESHOLD_SECONDS = 5 * 60;

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
 */
export function validateSession(session: Session | null): SessionValidation {
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
