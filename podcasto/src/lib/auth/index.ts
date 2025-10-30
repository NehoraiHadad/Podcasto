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

export { SessionService } from './session';

export type {
  User,
  Session,
  AuthState,
  SessionValidation,
  RefreshSessionOptions,
} from './session';

export {
  // Core getters (✅ Use getUser() for auth!)
  getCachedServerClient,
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
  getAdminStatus,
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

// Error utilities from errors module
export {
  handleSupabaseAuthError,
  isAuthenticationError,
  toAuthError,
  authErrorToResult,
  logAuthError,
  createAuthError,
  getErrorMessage,
  withAuthErrorHandling,
} from './errors/utils';

// ============================================================================
// Input Validation (Zod Schemas)
// ============================================================================

export {
  // Schemas
  loginSchema,
  registerSchema,
  passwordResetSchema,
  passwordUpdateSchema,
  roleAssignmentSchema,
  emailSchema,
  passwordSchema,
  userIdSchema,
  roleSchema,

  // Validation helpers
  validateLogin,
  validateRegistration,
  validatePasswordReset,
  validatePasswordUpdate,
  validateRoleAssignment,
  validateEmail,
  validatePassword,
  validateRole,

  // Types
  type LoginInput,
  type RegisterInput,
  type PasswordResetInput,
  type PasswordUpdateInput,
  type RoleAssignmentInput,
  type ValidationResult,
} from './validation';

// ============================================================================
// Common Types
// ============================================================================

export type {
  AuthResult,
  AuthError,
  ServerAuthError,
} from './types';

export { isAuthError } from './types';
