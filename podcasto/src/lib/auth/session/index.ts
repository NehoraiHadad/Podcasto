/**
 * Session Module
 *
 * Unified exports for session management following 2025 Supabase SSR best practices.
 * CRITICAL: Always use getUser() for authentication checks, never getSession().
 */

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
