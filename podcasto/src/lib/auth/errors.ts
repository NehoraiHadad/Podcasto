/**
 * Authentication Error Handling
 *
 * Provides comprehensive error types and utilities for authentication operations.
 * All error messages are security-conscious and safe for client display.
 */

/**
 * Standardized error codes for authentication operations
 * These codes are stable and can be used for programmatic error handling
 */
export const AUTH_ERROR_CODES = {
  // Authentication errors (401)
  INVALID_CREDENTIALS: 'invalid_credentials',
  SESSION_EXPIRED: 'session_expired',
  SESSION_MISSING: 'session_missing',
  INVALID_TOKEN: 'invalid_token',
  UNAUTHORIZED: 'unauthorized',

  // Authorization errors (403)
  INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',

  // Validation errors (400)
  WEAK_PASSWORD: 'weak_password',
  INVALID_EMAIL: 'invalid_email',
  INVALID_PASSWORD_FORMAT: 'invalid_password_format',
  MISSING_CREDENTIALS: 'missing_credentials',

  // User management errors (404/409)
  USER_NOT_FOUND: 'user_not_found',
  EMAIL_ALREADY_EXISTS: 'email_already_exists',
  USER_ALREADY_EXISTS: 'user_already_exists',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  TOO_MANY_REQUESTS: 'too_many_requests',

  // OAuth errors
  OAUTH_PROVIDER_ERROR: 'oauth_provider_error',
  OAUTH_CALLBACK_ERROR: 'oauth_callback_error',

  // Server errors (500)
  INTERNAL_ERROR: 'internal_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  NETWORK_ERROR: 'network_error',

  // Password reset errors
  RESET_TOKEN_INVALID: 'reset_token_invalid',
  RESET_TOKEN_EXPIRED: 'reset_token_expired',

  // Unknown
  UNKNOWN_ERROR: 'unknown_error',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

/**
 * Client-safe error messages
 * These messages are generic enough to not expose sensitive information
 */
export const CLIENT_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  // Authentication
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]:
    'Invalid email or password. Please try again.',
  [AUTH_ERROR_CODES.SESSION_EXPIRED]:
    'Your session has expired. Please sign in again.',
  [AUTH_ERROR_CODES.SESSION_MISSING]:
    'You must be signed in to access this resource.',
  [AUTH_ERROR_CODES.INVALID_TOKEN]:
    'Your session is invalid. Please sign in again.',
  [AUTH_ERROR_CODES.UNAUTHORIZED]:
    'You must be signed in to access this resource.',

  // Authorization
  [AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS]:
    'You do not have permission to perform this action.',
  [AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]:
    'Please verify your email address to continue.',

  // Validation
  [AUTH_ERROR_CODES.WEAK_PASSWORD]:
    'Password is too weak. Please choose a stronger password.',
  [AUTH_ERROR_CODES.INVALID_EMAIL]:
    'Please enter a valid email address.',
  [AUTH_ERROR_CODES.INVALID_PASSWORD_FORMAT]:
    'Password must be at least 8 characters long.',
  [AUTH_ERROR_CODES.MISSING_CREDENTIALS]:
    'Email and password are required.',

  // User management
  [AUTH_ERROR_CODES.USER_NOT_FOUND]:
    'Invalid email or password. Please try again.',
  [AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS]:
    'An account with this email already exists.',
  [AUTH_ERROR_CODES.USER_ALREADY_EXISTS]:
    'An account with this email already exists.',

  // Rate limiting
  [AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    'Too many attempts. Please try again later.',
  [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]:
    'Too many requests. Please wait a moment and try again.',

  // OAuth
  [AUTH_ERROR_CODES.OAUTH_PROVIDER_ERROR]:
    'Authentication with provider failed. Please try again.',
  [AUTH_ERROR_CODES.OAUTH_CALLBACK_ERROR]:
    'Authentication callback failed. Please try again.',

  // Server errors
  [AUTH_ERROR_CODES.INTERNAL_ERROR]:
    'An unexpected error occurred. Please try again.',
  [AUTH_ERROR_CODES.SERVICE_UNAVAILABLE]:
    'Service is temporarily unavailable. Please try again later.',
  [AUTH_ERROR_CODES.NETWORK_ERROR]:
    'Network error. Please check your connection and try again.',

  // Password reset
  [AUTH_ERROR_CODES.RESET_TOKEN_INVALID]:
    'Password reset link is invalid. Please request a new one.',
  [AUTH_ERROR_CODES.RESET_TOKEN_EXPIRED]:
    'Password reset link has expired. Please request a new one.',

  // Unknown
  [AUTH_ERROR_CODES.UNKNOWN_ERROR]:
    'An unexpected error occurred. Please try again.',
};

/**
 * HTTP status codes for authentication errors
 */
export const AUTH_ERROR_STATUS_CODES: Record<AuthErrorCode, number> = {
  // Authentication errors (401)
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 401,
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: 401,
  [AUTH_ERROR_CODES.SESSION_MISSING]: 401,
  [AUTH_ERROR_CODES.INVALID_TOKEN]: 401,
  [AUTH_ERROR_CODES.UNAUTHORIZED]: 401,

  // Authorization errors (403)
  [AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 403,
  [AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]: 403,

  // Validation errors (400)
  [AUTH_ERROR_CODES.WEAK_PASSWORD]: 400,
  [AUTH_ERROR_CODES.INVALID_EMAIL]: 400,
  [AUTH_ERROR_CODES.INVALID_PASSWORD_FORMAT]: 400,
  [AUTH_ERROR_CODES.MISSING_CREDENTIALS]: 400,

  // User management errors
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: 404,
  [AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS]: 409,
  [AUTH_ERROR_CODES.USER_ALREADY_EXISTS]: 409,

  // Rate limiting (429)
  [AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]: 429,

  // OAuth errors (400)
  [AUTH_ERROR_CODES.OAUTH_PROVIDER_ERROR]: 400,
  [AUTH_ERROR_CODES.OAUTH_CALLBACK_ERROR]: 400,

  // Server errors (500)
  [AUTH_ERROR_CODES.INTERNAL_ERROR]: 500,
  [AUTH_ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [AUTH_ERROR_CODES.NETWORK_ERROR]: 503,

  // Password reset
  [AUTH_ERROR_CODES.RESET_TOKEN_INVALID]: 400,
  [AUTH_ERROR_CODES.RESET_TOKEN_EXPIRED]: 400,

  // Unknown
  [AUTH_ERROR_CODES.UNKNOWN_ERROR]: 500,
};

/**
 * Base authentication error class
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
 * Specific error classes for common scenarios
 * These provide convenience constructors and can be used for type narrowing
 */

export class InvalidCredentialsError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.INVALID_CREDENTIALS, undefined, context);
    this.name = 'InvalidCredentialsError';
  }
}

export class SessionExpiredError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.SESSION_EXPIRED, undefined, context);
    this.name = 'SessionExpiredError';
  }
}

export class SessionMissingError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.SESSION_MISSING, undefined, context);
    this.name = 'SessionMissingError';
  }
}

export class UnauthorizedError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.UNAUTHORIZED, undefined, context);
    this.name = 'UnauthorizedError';
  }
}

export class InsufficientPermissionsError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS, undefined, context);
    this.name = 'InsufficientPermissionsError';
  }
}

export class EmailNotConfirmedError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED, undefined, context);
    this.name = 'EmailNotConfirmedError';
  }
}

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

export class EmailAlreadyExistsError extends AuthenticationError {
  constructor(context?: Record<string, unknown>) {
    super(AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS, undefined, context);
    this.name = 'EmailAlreadyExistsError';
  }
}

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
