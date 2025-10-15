/**
 * Error Classes
 *
 * Custom error class definitions for authentication operations.
 * All errors extend AuthenticationError and are safe for client display.
 */

import {
  AUTH_ERROR_CODES,
  CLIENT_ERROR_MESSAGES,
  AUTH_ERROR_STATUS_CODES,
  type AuthErrorCode,
} from './types';

// Re-export constants for convenience
export { AUTH_ERROR_CODES, CLIENT_ERROR_MESSAGES, AUTH_ERROR_STATUS_CODES };
export type { AuthErrorCode };

/**
 * Base authentication error class
 *
 * All authentication errors extend this base class.
 * Contains client-safe messages and structured error information.
 */
export class AuthenticationError extends Error {
  public readonly code: AuthErrorCode;
  public readonly statusCode: number;
  public readonly timestamp: number;
  public readonly isOperational: boolean;

  /**
   * Additional context for internal logging (not exposed to client)
   */
  public readonly context?: Record<string, unknown>;

  constructor(
    code: AuthErrorCode,
    message?: string,
    context?: Record<string, unknown>
  ) {
    // Use client-safe message by default
    const clientMessage = message || CLIENT_ERROR_MESSAGES[code];
    super(clientMessage);

    this.name = 'AuthenticationError';
    this.code = code;
    this.statusCode = AUTH_ERROR_STATUS_CODES[code];
    this.timestamp = Date.now();
    this.isOperational = true;
    this.context = context;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to client-safe JSON (no sensitive data)
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.INVALID_CREDENTIALS, undefined, context);
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Session expired error
 */
export class SessionExpiredError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.SESSION_EXPIRED, undefined, context);
    this.name = 'SessionExpiredError';
  }
}

/**
 * Session missing error
 */
export class SessionMissingError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.SESSION_MISSING, undefined, context);
    this.name = 'SessionMissingError';
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.UNAUTHORIZED, undefined, context);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Insufficient permissions error
 */
export class InsufficientPermissionsError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS, undefined, context);
    this.name = 'InsufficientPermissionsError';
  }
}

/**
 * Email not confirmed error
 */
export class EmailNotConfirmedError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED, undefined, context);
    this.name = 'EmailNotConfirmedError';
  }
}

/**
 * Weak password error
 */
export class WeakPasswordError extends AuthenticationError {
  public readonly reasons?: string[];

  constructor(reasons?: string[], context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.WEAK_PASSWORD, undefined, context);
    this.name = 'WeakPasswordError';
    this.reasons = reasons;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      reasons: this.reasons,
    };
  }
}

/**
 * Email already exists error
 */
export class EmailAlreadyExistsError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS, undefined, context);
    this.name = 'EmailAlreadyExistsError';
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends AuthenticationError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number, context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED, undefined, context);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}
