/**
 * Session Service
 *
 * Bundles all server-safe session helpers into a single object that mirrors the
 * structure recommended in Supabase's Next.js SSR documentation. Importing the
 * service ensures we only expose the helpers intended for server-side usage in
 * a discoverable, self-documenting API surface.
 */

import {
  getCachedServerClient,
  createServerClient,
  getUser,
  getSession,
  getAuthState,
} from './getters';
import {
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
import { createMiddlewareClient, updateSession } from './middleware';

const sessionService = Object.freeze({
  getCachedServerClient,
  createServerClient,
  getUser,
  getSession,
  getAuthState,
  isSessionExpired,
  getSessionExpiryTime,
  getSecondsUntilExpiry,
  shouldRefreshSession,
  validateSession,
  validateSessionSync,
  refreshSession,
  clearSession,
  formatSessionExpiry,
  createMiddlewareClient,
  updateSession,
});

export type SessionService = typeof sessionService;

export { sessionService as SessionService };
