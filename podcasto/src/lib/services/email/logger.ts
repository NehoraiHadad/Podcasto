/**
 * Logging utilities for email notification service
 */

import type { SESRateLimiter } from '@/lib/aws/ses-rate-limiter';
import type { EmailNotificationResult } from './types';

/**
 * Logs the start of notification process
 * @param episodeId - Episode ID
 * @param rateLimiter - Rate limiter instance
 */
export function logNotificationStart(
  episodeId: string,
  rateLimiter: SESRateLimiter
): void {
  const logPrefix = `[EMAIL_NOTIFICATION:${episodeId}]`;
  const stats = rateLimiter.getStats();

  console.log(`${logPrefix} Starting notification process`);
  console.log(`${logPrefix} Rate limiter initialized:`, stats);
}

/**
 * Logs progress during notification process
 * @param episodeId - Episode ID
 * @param message - Progress message
 * @param data - Optional data to log
 */
export function logProgress(
  episodeId: string,
  message: string,
  data?: unknown
): void {
  const logPrefix = `[EMAIL_NOTIFICATION:${episodeId}]`;

  if (data !== undefined) {
    console.log(`${logPrefix} ${message}`, data);
  } else {
    console.log(`${logPrefix} ${message}`);
  }
}

/**
 * Logs comprehensive final statistics
 * @param episodeId - Episode ID
 * @param result - Notification result
 * @param rateLimiter - Rate limiter instance
 */
export function logFinalStats(
  episodeId: string,
  result: EmailNotificationResult,
  rateLimiter: SESRateLimiter
): void {
  const logPrefix = `[EMAIL_NOTIFICATION:${episodeId}]`;
  const finalStats = rateLimiter.getStats();
  const successRate = result.totalSubscribers > 0
    ? ((result.emailsSent / result.totalSubscribers) * 100).toFixed(1)
    : '0';

  console.log(`${logPrefix} ===== Notification Process Completed =====`);
  console.log(`${logPrefix} Total Subscribers: ${result.totalSubscribers}`);
  console.log(`${logPrefix} Emails Sent: ${result.emailsSent}`);
  console.log(`${logPrefix} Emails Failed: ${result.emailsFailed}`);
  console.log(`${logPrefix} Emails Retried: ${result.retriedEmails}`);
  console.log(`${logPrefix} Success Rate: ${successRate}%`);
  console.log(`${logPrefix} Rate Limiter Stats:`, finalStats);

  if (result.errors.length > 0) {
    console.error(`${logPrefix} Errors encountered (${result.errors.length}):`, result.errors.slice(0, 5));
    if (result.errors.length > 5) {
      console.error(`${logPrefix} ... and ${result.errors.length - 5} more errors`);
    }
  }
}
