/**
 * Email Service Interfaces
 * Type-safe contracts for email notification operations
 */

import type { InferSelectModel } from 'drizzle-orm';
import type { subscriptions } from '@/lib/db/schema';
import type { SESRateLimiter } from '@/lib/aws/ses-rate-limiter';
import type { SESTemplateData } from '@/lib/email/templates/ses-templates';
import type {
  BatchUserData,
  EmailNotificationResult,
  SentEmailRecord,
} from '../email/types';

type Subscription = InferSelectModel<typeof subscriptions>;

/**
 * Bulk Email Sender Interface
 * Orchestrates sending bulk emails to subscribers with rate limiting and validation
 */
export interface IEmailSender {
  /**
   * Sends new episode notification to subscribers using bulk email API
   * Handles validation, rate limiting, and retry logic
   * @param subscribers - Array of subscription records
   * @param userDataMap - Map of user IDs to user data
   * @param emailData - Episode email template data
   * @param episodeId - Episode identifier
   * @param rateLimiter - Rate limiter instance for SES
   * @param logPrefix - Prefix for log messages
   * @param result - Result object to update during processing
   * @returns Array of successfully sent email records
   * @throws May throw if rate limit is exceeded or critical error occurs
   */
  sendBulkEmailsToSubscribers(
    subscribers: Subscription[],
    userDataMap: Map<string, BatchUserData>,
    emailData: SESTemplateData,
    episodeId: string,
    rateLimiter: SESRateLimiter,
    logPrefix: string,
    result: EmailNotificationResult
  ): Promise<SentEmailRecord[]>;

  /**
   * Records sent emails in batch to database
   * Non-blocking operation - failures are logged but don't fail the process
   * @param emailsSentRecords - Array of sent email records
   * @param logPrefix - Prefix for log messages
   * @returns Promise that resolves when recording is complete or fails
   */
  recordBulkSentEmails(emailsSentRecords: SentEmailRecord[], logPrefix: string): Promise<void>;
}
