/**
 * Retry Utilities for Email Service
 * Implements exponential backoff retry logic for transient failures
 */

import type { RetryConfig, RetryResult } from './types';

/**
 * Default retry configuration for email operations
 * Timing: Attempt 1 (immediate), Attempt 2 (wait 1s), Attempt 3 (wait 2s)
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Executes an async operation with retry logic and exponential backoff
 * Only retries on transient errors (network, throttling). Permanent errors fail immediately.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  logPrefix = '[RETRY]'
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`${logPrefix} Operation succeeded on attempt ${attempt}/${config.maxAttempts}`);
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const retryable = isRetryableError(error);

      if (attempt === config.maxAttempts || !retryable) {
        console.error(
          `${logPrefix} ${attempt === config.maxAttempts ? 'All attempts exhausted' : 'Non-retryable error'}: ${lastError.message}`
        );
        break;
      }

      // Exponential backoff: baseDelay * 2^(attempt-1), capped at maxDelayMs
      const delay = Math.min(config.baseDelayMs * Math.pow(2, attempt - 1), config.maxDelayMs);
      console.warn(`${logPrefix} Attempt ${attempt}/${config.maxAttempts} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Checks if an error is retryable (network, throttling, temporary issues)
 * Retryable: ECONNRESET, throttling, timeout, service unavailable, rate exceeded
 * Non-retryable: ValidationError, MessageRejected, AccessDeniedException
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const text = `${error.message} ${error.name}`.toLowerCase();

  const retryablePatterns = [
    'throttling',
    'timeout',
    'timed out',
    'network',
    'econnreset',
    'enotfound',
    'econnrefused',
    'etimedout',
    'service unavailable',
    'temporarily unavailable',
    'too many requests',
    'rate exceeded',
    'requestthrottled',
    'slowdown',
  ];

  return retryablePatterns.some((pattern) => text.includes(pattern));
}

/**
 * Executes an operation with retry and returns detailed result with metadata
 */
export async function withRetryResult<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  logPrefix = '[RETRY]'
): Promise<RetryResult & { data?: T }> {
  let attempts = 0;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    attempts = attempt;

    try {
      const data = await operation();
      return { success: true, attempts, data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === config.maxAttempts || !isRetryableError(error)) {
        break;
      }

      const delay = Math.min(config.baseDelayMs * Math.pow(2, attempt - 1), config.maxDelayMs);
      console.warn(`${logPrefix} Attempt ${attempt}/${config.maxAttempts} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { success: false, attempts, error: lastError };
}
