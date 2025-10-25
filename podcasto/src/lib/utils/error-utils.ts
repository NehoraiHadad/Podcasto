/**
 * Format error details for logging
 */
export function formatErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}

/**
 * Convert error to a string message
 */
export function errorToString(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Extracts a user-friendly error message from various error types
 * This is the standard function to replace: error instanceof Error ? error.message : 'Default message'
 *
 * @param error - The error object (can be Error, string, or unknown)
 * @param defaultMessage - Fallback message if error is not recognizable
 * @returns A user-friendly error message string
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
}

/**
 * Log an error with detailed information
 */
export function logError(context: string, error: unknown): void {
  console.error(`=== Error in ${context} ===`);
  console.error(error);

  if (error instanceof Error) {
    console.error('Error details:', formatErrorDetails(error));
  }
}

/**
 * Logs an error and returns a formatted error message
 * Useful for server actions that need both logging and user feedback
 */
export function logAndGetErrorMessage(
  error: unknown,
  context: string,
  defaultMessage: string
): string {
  const errorMessage = getErrorMessage(error, defaultMessage);
  logError(context, error);
  return errorMessage;
}

/**
 * Creates a standardized error response for server actions
 * Use this to replace: { success: false, error: error instanceof Error ? error.message : '...' }
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string,
  context?: string
) {
  const errorMessage = context
    ? logAndGetErrorMessage(error, context, defaultMessage)
    : getErrorMessage(error, defaultMessage);

  return {
    success: false as const,
    error: errorMessage,
  };
}

/**
 * Creates a standardized success response for server actions
 */
export function createSuccessResponse<T>(data: T) {
  return {
    success: true as const,
    data,
  };
} 