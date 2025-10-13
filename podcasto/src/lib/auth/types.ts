import type { User, Session } from '@supabase/supabase-js';
import type { AuthErrorCode } from './errors';

/**
 * Re-export Supabase User type for consistency
 */
export type { User, Session } from '@supabase/supabase-js';

/**
 * Authentication state for the current session
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
}

/**
 * Session validation result
 */
export interface SessionValidation {
  isValid: boolean;
  isExpired: boolean;
  expiresAt: number | null;
  expiresIn: number | null;
}

/**
 * Generic result type for auth operations
 *
 * @template T The type of data returned on success
 */
export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

/**
 * Standardized auth error structure (client-safe)
 *
 * This is the error format returned to clients. It contains no sensitive
 * information and uses generic, user-friendly messages.
 */
export interface AuthError {
  /** User-friendly error message safe for display */
  message: string;
  /** Standardized error code for programmatic handling */
  code?: AuthErrorCode | string;
  /** HTTP status code */
  status?: number;
}

/**
 * Extended error structure for server-side logging
 *
 * Contains additional context and details that should NOT be exposed to clients.
 * Use this type when logging errors server-side.
 */
export interface ServerAuthError extends AuthError {
  /** Original error message from the underlying system */
  originalError?: string;
  /** Additional context data for debugging */
  context?: Record<string, unknown>;
  /** Timestamp when the error occurred */
  timestamp?: number;
  /** Error stack trace (development only) */
  stack?: string;
}

/**
 * Session refresh options
 */
export interface RefreshSessionOptions {
  forceRefresh?: boolean;
}

/**
 * Type guard to check if a value is an AuthError
 *
 * @param error The value to check
 * @returns True if the value is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AuthError).message === 'string'
  );
}

/**
 * Standard role types
 */
export type Role = 'admin' | 'moderator' | 'user';

/**
 * Role check result with detailed information
 */
export interface RoleCheckResult {
  hasRole: boolean;
  role?: string;
  userId: string;
  permissions?: string[];
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  userId: string;
  permission: string;
  grantingRole?: string;
}
