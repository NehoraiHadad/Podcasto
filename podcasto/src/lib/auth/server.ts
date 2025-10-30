'use server';

// Session service and helpers
export { SessionService } from './session/session-service';
export {
  getCachedServerClient,
  createServerClient,
  getUser,
  getSession,
  getAuthState,
} from './session/getters';
export {
  validateSession,
  validateSessionSync,
  refreshSession,
  clearSession,
  isSessionExpired,
  getSessionExpiryTime,
  getSecondsUntilExpiry,
  shouldRefreshSession,
  formatSessionExpiry,
} from './session/validators';
export { createMiddlewareClient, updateSession } from './session/middleware';

// Role and permission helpers
export {
  getUserRoles,
  hasRole,
  isAdmin,
  getAdminStatus,
  hasPermission,
  getUserPermissions,
} from './role/queries';
export {
  checkRole,
  checkPermission,
  getUserHighestRole,
} from './role/checks';
export {
  requireAuth,
  requireAdmin,
  requireRole,
  requirePermission,
} from './role/guards';
export { addUserRole, removeUserRole } from './role/management';
