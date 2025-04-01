/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * Default retry configuration values
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 2000, // 2 seconds
  maxDelay: 20000, // 20 seconds
  backoffFactor: 2
};

/**
 * Error interface for common error properties
 */
export interface ApiError {
  code?: number;
  status?: number;
  message?: string;
  details?: string;
  response?: {
    status?: number;
    data?: unknown;
    headers?: Record<string, string>;
  };
  statusCode?: number;
  reason?: string;
  errorMessage?: string;
}

/**
 * Checks if an error is a rate limit error (HTTP 429)
 */
export function isRateLimitError(error: ApiError): boolean {
  if (error?.code === 429 || error?.status === 429 || error?.statusCode === 429) {
    return true;
  }
  
  const messageText = error?.message || error?.errorMessage || error?.reason || '';
  if (typeof messageText === 'string' && 
      (messageText.includes('resource exhausted') || 
       messageText.includes('rate limit') || 
       messageText.includes('quota exceeded'))) {
    return true;
  }
  
  if (typeof error?.details === 'string' && 
      (error.details.includes('resource exhausted') || 
       error.details.includes('rate limit') || 
       error.details.includes('quota exceeded'))) {
    return true;
  }
  
  return false;
}

/**
 * Checks if an error is a temporary server error that should be retried
 */
export function isRetryableError(error: ApiError): boolean {
  // Rate limit errors are retryable
  if (isRateLimitError(error)) {
    return true;
  }
  
  // Server errors (5xx) are often temporary
  const statusCode = error?.code || error?.status || error?.statusCode;
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return true;
  }
  
  // Check error messages for indications of temporary issues
  const messageText = error?.message || error?.errorMessage || error?.reason || '';
  if (typeof messageText === 'string' && 
      (messageText.includes('server error') || 
       messageText.includes('timeout') || 
       messageText.includes('temporarily unavailable') ||
       messageText.includes('try again later'))) {
    return true;
  }
  
  return false;
}

/**
 * Executes a function with retry logic using exponential backoff
 * @param fn Function to execute
 * @param config Retry configuration
 * @param errorPredicate Function to determine if an error should trigger a retry
 * @returns Promise with the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>, 
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  errorPredicate: (error: ApiError) => boolean = isRetryableError
): Promise<T> {
  let retryCount = 0;
  let delay = config.initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      const apiError = error as ApiError;
      
      // Log detailed error information
      console.error(`API error encountered:`, {
        code: apiError.code || apiError.status || apiError.statusCode,
        message: apiError.message || apiError.errorMessage || apiError.reason,
        details: apiError.details,
        hasResponse: !!apiError.response
      });
      
      // Check if we should retry based on the error
      const shouldRetry = errorPredicate(apiError) && retryCount < config.maxRetries;
      
      if (!shouldRetry) {
        console.error(`Not retrying: ${retryCount >= config.maxRetries ? 'Max retries exceeded' : 'Error not retryable'}`);
        throw error;
      }
      
      // Calculate delay with jitter to avoid thundering herd problem
      delay = Math.min(
        delay * config.backoffFactor * (0.8 + Math.random() * 0.4),
        config.maxDelay
      );
      
      if (isRateLimitError(apiError)) {
        console.log(`Rate limit exceeded. Retrying in ${delay}ms. Attempt ${retryCount + 1}/${config.maxRetries}`);
      } else {
        console.log(`Retryable error encountered. Retrying in ${delay}ms. Attempt ${retryCount + 1}/${config.maxRetries}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }
  }
} 