/**
 * Session Module
 *
 * Unified exports for session management following 2025 Supabase SSR best practices.
 * Prefer consuming the SessionService for the curated API surface while
 * retaining direct access to individual helpers when necessary.
 * CRITICAL: Always use getUser() for authentication checks, never getSession().
 */

// Service (recommended entry point for server modules)
export { SessionService } from './session-service';
export { type SessionService } from './session-service';

// Types
export type {
  User,
  Session,
  AuthState,
  SessionValidation,
  RefreshSessionOptions,
} from './types';

// Getters (✅ Use getUser() for auth checks!)
export {
  getCachedServerClient,
  createServerClient,
  getUser,
  getSession,
  getAuthState,
} from './getters';

// Validators
export {
  isSessionExpired,
  getSessionExpiryTime,
  getSecondsUntilExpiry,
  shouldRefreshSession,
  validateSession,
  validateSessionSync,
  refreshSession,
  clearSession,
  formatSessionExpiry,
} from './validators';

// Middleware helpers
export {
  createMiddlewareClient,
  updateSession,
} from './middleware';
