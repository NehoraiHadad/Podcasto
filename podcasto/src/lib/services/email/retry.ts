/**
 * Email retry logic with exponential backoff
 * Reuses error-utils for consistent error handling across the app
 */

import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from '@/lib/aws/ses-client';
import { errorToString } from '@/lib/utils/error-utils';
import type { RetryConfig, RetryResult } from './types';

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000
};

/**
 * Determines if an error is retryable
 * @param error - Error to check
 * @returns True if error should be retried
 */
export function isRetryableError(error: Error): boolean {
  const retryableErrors = [
    'Throttling',
    'ServiceUnavailable',
    'RequestTimeout',
    'TooManyRequests',
    'InternalFailure'
  ];

  return retryableErrors.some(errType =>
    error.message.includes(errType) || error.name.includes(errType)
  );
}

/**
 * Sends an email with exponential backoff retry logic
 * @param command - SES SendEmailCommand
 * @param userEmail - Email address for logging
 * @param logPrefix - Log prefix for consistent logging
 * @param retryConfig - Retry configuration
 * @returns Retry result with success status and attempts count
 */
export async function sendEmailWithRetry(
  command: SendEmailCommand,
  userEmail: string,
  logPrefix: string,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<RetryResult> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      await sesClient.send(command);

      if (attempt > 1) {
        console.log(`${logPrefix} Successfully sent email to ${userEmail} on attempt ${attempt}`);
      } else {
        console.log(`${logPrefix} Successfully sent email to ${userEmail}`);
      }

      return { success: true, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRetryable = isRetryableError(lastError);

      if (!isRetryable || attempt === retryConfig.maxAttempts) {
        console.error(`${logPrefix} Failed to send email to ${userEmail} after ${attempt} attempt(s):`, errorToString(lastError));
        return { success: false, attempts: attempt, error: lastError };
      }

      // Calculate exponential backoff delay
      const delay = Math.min(
        retryConfig.baseDelayMs * Math.pow(2, attempt - 1),
        retryConfig.maxDelayMs
      );

      console.warn(`${logPrefix} Attempt ${attempt} failed for ${userEmail}, retrying in ${delay}ms:`, errorToString(lastError));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { success: false, attempts: retryConfig.maxAttempts, error: lastError };
}
