/**
 * Error types for categorizing different error scenarios
 */
export type ErrorType = 'validation' | 'auth' | 'database' | 'external' | 'unknown';

/**
 * Extract error message from various error types (Error, string, object)
 *
 * @param error - Error of any type
 * @returns User-friendly error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    if ('message' in error) {
      const message = (error as { message: unknown }).message;
      if (typeof message === 'string') return message;
    }
    if ('error' in error) {
      const errorProp = (error as { error: unknown }).error;
      if (typeof errorProp === 'string') return errorProp;
    }
  }

  return 'An unknown error occurred';
}

/**
 * Categorize error type based on error content and context
 *
 * @param error - Error to categorize
 * @returns Error type: validation, auth, database, external, or unknown
 */
export function getErrorType(error: unknown): ErrorType {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('must be')
  ) return 'validation';

  if (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('auth') ||
    message.includes('permission') ||
    message.includes('credentials')
  ) return 'auth';

  if (
    message.includes('database') ||
    message.includes('query') ||
    message.includes('relation') ||
    message.includes('constraint') ||
    message.includes('duplicate key')
  ) return 'database';

  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('econnrefused')
  ) return 'external';

  return 'unknown';
}

/**
 * Log error with structured context information
 *
 * @param context - Context string (e.g., '[CRON_JOB]')
 * @param error - Error to log
 * @param additionalInfo - Optional additional context information
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const message = getErrorMessage(error);
  const errorType = getErrorType(error);

  // Build log entry
  const logEntry: Record<string, unknown> = {
    message,
    errorType,
    timestamp: new Date().toISOString(),
  };

  // Include additional context if provided
  if (additionalInfo) {
    Object.assign(logEntry, additionalInfo);
  }

  // Include stack trace for Error objects in development
  if (error instanceof Error && process.env.NODE_ENV === 'development') {
    logEntry.stack = error.stack;
  }

  // Log to console with context
  console.error(`${context} Error:`, logEntry);
}

/**
 * Check if error indicates a retryable operation
 *
 * @param error - Error to check
 * @returns True if error is likely retryable (network, rate limit, timeout)
 */
export function isRetryableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('network') ||
    message.includes('socket hang up') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('service unavailable') ||
    message.includes('temporarily unavailable')
  ) return true;

  return false;
}
