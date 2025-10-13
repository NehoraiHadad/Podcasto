/**
 * Authentication Module
 *
 * Centralized authentication and session management for Podcasto.
 * This module provides a unified interface for all auth operations,
 * including comprehensive error handling.
 */

// Session Service
// Note: SessionService namespace object NOT exported to avoid "use server" conflict
// Import individual functions instead: import { getUser, getSession } from '@/lib/auth'
export {
  getUser,
  getSession,
  getAuthState,
  refreshSession,
  validateSession,
  clearSession,
} from './session-service';

// Session Utilities
export {
  isSessionExpired,
  getSessionExpiryTime,
  getSecondsUntilExpiry,
  shouldRefreshSession,
  validateSession as validateSessionUtil,
  formatSessionExpiry,
} from './session-utils';

// Types
export type {
  User,
  Session,
  AuthState,
  AuthResult,
  AuthError,
  ServerAuthError,
  SessionValidation,
  RefreshSessionOptions,
} from './types';

export { isAuthError } from './types';

// Error Types and Constants
export {
  AUTH_ERROR_CODES,
  CLIENT_ERROR_MESSAGES,
  AUTH_ERROR_STATUS_CODES,
  AuthenticationError,
  InvalidCredentialsError,
  SessionExpiredError,
  SessionMissingError,
  UnauthorizedError,
  InsufficientPermissionsError,
  EmailNotConfirmedError,
  WeakPasswordError,
  EmailAlreadyExistsError,
  RateLimitError,
  type AuthErrorCode,
} from './errors';

// Error Utilities
export {
  handleSupabaseAuthError,
  isAuthenticationError,
  toAuthError,
  authErrorToResult,
  logAuthError,
  createAuthError,
  getErrorMessage,
  withAuthErrorHandling,
} from './error-utils';

// Role Service
// Note: RoleService namespace object NOT exported to avoid "use server" conflict
// Import individual functions instead: import { requireAdmin, isAdmin } from '@/lib/auth'
export {
  getUserRoles,
  hasRole,
  isAdmin,
  hasPermission,
  getUserPermissions,
  getUserHighestRole,
  requireAuth,
  requireAdmin,
  requireRole,
  requirePermission,
  addUserRole,
  removeUserRole,
  checkRole,
  checkPermission,
} from './role-service';

// Permission System
export {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  hasRolePermission,
  getRolePermissions,
  getHighestRole,
  isValidRole,
  type Permission,
  type Role,
} from './permissions';

// Role-related types
export type { RoleCheckResult, PermissionCheckResult } from './types';
