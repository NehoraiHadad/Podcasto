/**
 * Email Notification Service - Main Orchestrator
 * Clean orchestration layer that delegates to specialized modules
 * Supports both single and bulk email sending via feature flag
 */

import { SESRateLimiter } from '@/lib/aws/ses-rate-limiter';
import { logError, errorToString } from '@/lib/utils/error-utils';
import { fetchEpisodeAndPodcast, fetchSubscribers, fetchUserBatchData, prepareEmailData } from './data-fetcher';
import { sendToSubscribers, recordSentEmails } from './email-sender';
import { sendBulkEmailsToSubscribers, recordBulkSentEmails } from './bulk-sender';
import { convertToSESTemplateData } from '@/lib/email/templates/ses-templates';
import { logNotificationStart, logProgress, logFinalStats } from './logger';
import type { EmailNotificationResult } from './types';

/**
 * Feature flag to enable bulk email sending
 * Set USE_BULK_EMAIL_SENDING=true to use SendBulkTemplatedEmail API
 * Default: false (uses single SendEmail API)
 */
const USE_BULK_SENDING = process.env.USE_BULK_EMAIL_SENDING === 'true';

/**
 * Sends new episode notification to all subscribed users
 * @param episodeId - ID of the newly published episode
 * @returns Result with statistics about sent emails
 */
export async function sendNewEpisodeNotification(
  episodeId: string
): Promise<EmailNotificationResult> {
  const result: EmailNotificationResult = {
    success: false,
    totalSubscribers: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: [],
    retriedEmails: 0,
  };

  try {
    // Initialize rate limiter
    const rateLimiter = SESRateLimiter.createFromEnvironment();
    logNotificationStart(episodeId, rateLimiter);

    // 1. Fetch and validate episode and podcast
    const fetchResult = await fetchEpisodeAndPodcast(episodeId, `[EMAIL_NOTIFICATION:${episodeId}]`);
    if (!fetchResult.success) {
      result.errors.push(fetchResult.error);
      return result;
    }

    // At this point, TypeScript knows we have the success case
    const { episode, podcast } = fetchResult;

    // 2. Fetch subscribers
    const subscribers = await fetchSubscribers(episode.podcast_id!, `[EMAIL_NOTIFICATION:${episodeId}]`);
    result.totalSubscribers = subscribers.length;

    if (subscribers.length === 0) {
      logProgress(episodeId, 'No subscribers found for this podcast');
      result.success = true;
      return result;
    }

    // 3. Prepare email data
    const emailData = prepareEmailData(episode, podcast);

    // 4. Batch fetch user data
    const userIds = subscribers.map(s => s.user_id).filter(Boolean) as string[];
    if (userIds.length === 0) {
      logProgress(episodeId, 'No valid user IDs found in subscriptions');
      result.success = true;
      return result;
    }

    const userDataMap = await fetchUserBatchData(episodeId, userIds, `[EMAIL_NOTIFICATION:${episodeId}]`);

    // 5. Send emails - choose between bulk or single sending
    let emailsSentRecords;

    if (USE_BULK_SENDING) {
      console.log(`[EMAIL_NOTIFICATION:${episodeId}] Using BULK email sending (SendBulkTemplatedEmail)`);

      // Build episode URL
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcasto.app';
      const episodeUrl = `${siteUrl}/podcasts/${podcast.id}/episodes/${episodeId}`;

      // Convert email data to SES template format
      const sesTemplateData = convertToSESTemplateData(
        episodeId,
        episode.title,
        podcast.title,
        podcast.id,
        episodeUrl,
        {
          episodeDescription: episode.description || undefined,
          coverImage: episode.cover_image || podcast.cover_image || undefined,
          duration: episode.duration || undefined,
          publishedAt: episode.published_at ? new Date(episode.published_at) : undefined,
        }
      );

      emailsSentRecords = await sendBulkEmailsToSubscribers(
        subscribers,
        userDataMap,
        sesTemplateData,
        episodeId,
        rateLimiter,
        `[EMAIL_NOTIFICATION:${episodeId}]`,
        result
      );

      // Record sent emails in batch
      await recordBulkSentEmails(emailsSentRecords, `[EMAIL_NOTIFICATION:${episodeId}]`);
    } else {
      console.log(`[EMAIL_NOTIFICATION:${episodeId}] Using SINGLE email sending (SendEmail)`);

      emailsSentRecords = await sendToSubscribers(
        subscribers,
        userDataMap,
        emailData,
        episodeId,
        rateLimiter,
        `[EMAIL_NOTIFICATION:${episodeId}]`,
        result
      );

      // 6. Record sent emails in batch
      await recordSentEmails(emailsSentRecords, `[EMAIL_NOTIFICATION:${episodeId}]`);
    }

    // 7. Mark as successful if at least one email was sent
    result.success = result.emailsSent > 0 || result.totalSubscribers === 0;

    // 8. Log final statistics
    logFinalStats(episodeId, result, rateLimiter);

    return result;

  } catch (error) {
    const errorMsg = `Unexpected error in notification process: ${errorToString(error)}`;
    logError('sendNewEpisodeNotification', error);
    result.errors.push(errorMsg);
    return result;
  }
}

// Re-export types for convenience
export type { EmailNotificationResult } from './types';
