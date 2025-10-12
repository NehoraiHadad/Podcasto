/**
 * Email Notification Service - Main Orchestrator
 * Clean orchestration layer using AWS SES SendBulkTemplatedEmail
 */

import { SESRateLimiter } from '@/lib/aws/ses-rate-limiter';
import { logError, errorToString } from '@/lib/utils/error-utils';
import { fetchEpisodeAndPodcast, fetchSubscribers, fetchUserBatchData } from './data-fetcher';
import { sendBulkEmailsToSubscribers, recordBulkSentEmails } from './email-sender';
import { convertToSESTemplateData } from '@/lib/email/templates/ses-templates';
import { logNotificationStart, logProgress, logFinalStats } from './logger';
import type { EmailNotificationResult } from './types';

/**
 * Sends new episode notification to all subscribed users
 * Uses AWS SES SendBulkTemplatedEmail for efficient batch sending
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

    const { episode, podcast } = fetchResult;

    // 2. Fetch subscribers
    const subscribers = await fetchSubscribers(episode.podcast_id!, `[EMAIL_NOTIFICATION:${episodeId}]`);
    result.totalSubscribers = subscribers.length;

    if (subscribers.length === 0) {
      logProgress(episodeId, 'No subscribers found for this podcast');
      result.success = true;
      return result;
    }

    // 3. Batch fetch user data
    const userIds = subscribers.map(s => s.user_id).filter(Boolean) as string[];
    if (userIds.length === 0) {
      logProgress(episodeId, 'No valid user IDs found in subscriptions');
      result.success = true;
      return result;
    }

    const userDataMap = await fetchUserBatchData(episodeId, userIds, `[EMAIL_NOTIFICATION:${episodeId}]`);

    // 4. Prepare email data for bulk sending
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcasto.app';
    const episodeUrl = `${siteUrl}/podcasts/${podcast.id}/episodes/${episodeId}`;

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

    console.log(`[EMAIL_NOTIFICATION:${episodeId}] Sending bulk emails to ${subscribers.length} subscribers`);

    // 5. Send emails using bulk API
    const emailsSentRecords = await sendBulkEmailsToSubscribers(
      subscribers,
      userDataMap,
      sesTemplateData,
      episodeId,
      rateLimiter,
      `[EMAIL_NOTIFICATION:${episodeId}]`,
      result
    );

    // 6. Record sent emails in batch
    await recordBulkSentEmails(emailsSentRecords, `[EMAIL_NOTIFICATION:${episodeId}]`);

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
