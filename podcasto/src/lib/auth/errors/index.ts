/**
 * Errors Module
 *
 * Unified exports for authentication error handling.
 * Provides error classes, constants, handlers, and utilities.
 */

// Types and Constants
export type { AuthErrorCode } from './types';
export { AUTH_ERROR_CODES, CLIENT_ERROR_MESSAGES, AUTH_ERROR_STATUS_CODES } from './types';

// Error Classes
export {
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
} from './classes';

// Error Handlers
export { formatErrorResponse } from './handlers';

// Error Utilities - Export all utilities from utils.ts
export {
  handleSupabaseAuthError,
  isAuthenticationError,
  toAuthError,
  authErrorToResult,
  logAuthError,
  createAuthError,
  getErrorMessage,
  withAuthErrorHandling,
} from './utils';
