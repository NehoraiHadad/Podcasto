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
}

/**
 * Checks if an error is a rate limit error (HTTP 429)
 */
export function isRateLimitError(error: ApiError): boolean {
  if (error?.code === 429 || error?.status === 429) {
    return true;
  }
  
  if (typeof error?.message === 'string' && error.message.includes('resource exhausted')) {
    return true;
  }
  
  if (typeof error?.details === 'string' && error.details.includes('resource exhausted')) {
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
  errorPredicate: (error: ApiError) => boolean = isRateLimitError
): Promise<T> {
  let retryCount = 0;
  let delay = config.initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      // Check if we should retry based on the error
      if (!errorPredicate(error as ApiError) || retryCount >= config.maxRetries) {
        throw error;
      }
      
      // Calculate delay with jitter to avoid thundering herd problem
      delay = Math.min(
        delay * config.backoffFactor * (0.8 + Math.random() * 0.4),
        config.maxDelay
      );
      
      console.log(`Rate limit exceeded. Retrying in ${delay}ms. Attempt ${retryCount + 1}/${config.maxRetries}`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }
  }
} 