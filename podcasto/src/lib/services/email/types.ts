/**
 * Type definitions for email notification service
 */

/**
 * Result of email notification process
 */
export interface EmailNotificationResult {
  success: boolean;
  totalSubscribers: number;
  emailsSent: number;
  emailsFailed: number;
  errors: string[];
  retriedEmails?: number;
}

/**
 * Batch user data from database query
 */
export interface BatchUserData {
  user_id: string;
  email: string;
  email_notifications: boolean | null;
  unsubscribe_token?: string | null;
  already_sent: boolean;
  [key: string]: unknown;
}

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * Result of a retry attempt
 */
export interface RetryResult {
  success: boolean;
  attempts: number;
  error?: Error;
}

/**
 * Record for tracking sent emails
 */
export interface SentEmailRecord {
  user_id: string;
  episode_id: string;
}
