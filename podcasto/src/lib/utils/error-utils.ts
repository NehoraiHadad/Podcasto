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
 * Log an error with detailed information
 */
export function logError(context: string, error: unknown): void {
  console.error(`=== Error in ${context} ===`);
  console.error(error);
  
  if (error instanceof Error) {
    console.error('Error details:', formatErrorDetails(error));
  }
} 