/**
 * Authentication Module
 *
 * Centralized authentication and session management for Podcasto.
 * This module provides a unified interface for all auth operations,
 * including comprehensive error handling.
 *
 * Following 2025 Supabase SSR best practices.
 */

// ============================================================================
// Session Management (✅ ALWAYS use getUser() for auth checks!)
// ============================================================================

export type {
  User,
  Session,
  AuthState,
  SessionValidation,
  RefreshSessionOptions,
} from './session';

export {
  // Core getters (✅ Use getUser() for auth!)
  createServerClient,
  getUser,
  getSession,
  getAuthState,

  // Validators
  isSessionExpired,
  getSessionExpiryTime,
  getSecondsUntilExpiry,
  shouldRefreshSession,
  validateSession,
  validateSessionSync,
  refreshSession,
  clearSession,
  formatSessionExpiry,

  // Middleware helpers
  createMiddlewareClient,
  updateSession,
} from './session';

// ============================================================================
// Role & Permission Management
// ============================================================================

export type {
  RoleCheckResult,
  PermissionCheckResult,
} from './role';

export {
  // Queries (cached per request)
  getUserRoles,
  hasRole,
  isAdmin,
  hasPermission,
  getUserPermissions,

  // Guards (throw on failure)
  requireAuth,
  requireAdmin,
  requireRole,
  requirePermission,

  // Checks (return detailed info)
  checkRole,
  checkPermission,
  getUserHighestRole,

  // Management
  addUserRole,
  removeUserRole,
} from './role';

// ============================================================================
// Permission System
// ============================================================================

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

// ============================================================================
// Error Handling
// ============================================================================

export {
  // Constants
  AUTH_ERROR_CODES,
  CLIENT_ERROR_MESSAGES,
  AUTH_ERROR_STATUS_CODES,
  type AuthErrorCode,

  // Error Classes
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
} from './errors';

// Error utilities from error-utils.ts (temporary - will migrate in Task 1.3)
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

// ============================================================================
// Common Types
// ============================================================================

export type {
  AuthResult,
  AuthError,
  ServerAuthError,
} from './types';

export { isAuthError } from './types';
