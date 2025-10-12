/**
 * Email Notification Service
 * Handles sending email notifications for new episodes to subscribed users
 */

import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient, SES_CONFIG } from '@/lib/aws/ses-client';
import { SESRateLimiter } from '@/lib/aws/ses-rate-limiter';
import { generateNewEpisodeHTML, generateNewEpisodeText, type EpisodeEmailData } from '@/lib/email/templates/new-episode';
import { episodesApi, podcastsApi, subscriptionsApi } from '@/lib/db/api';
import { db, sentEpisodes } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface EmailNotificationResult {
  success: boolean;
  totalSubscribers: number;
  emailsSent: number;
  emailsFailed: number;
  errors: string[];
  retriedEmails?: number;
}

/**
 * Retry configuration for email sending
 */
interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000
};

/**
 * Sends an email with exponential backoff retry logic
 * @param command - SES SendEmailCommand
 * @param userEmail - Email address for logging
 * @param logPrefix - Log prefix for consistent logging
 * @param retryConfig - Retry configuration
 * @returns Success boolean
 */
async function sendEmailWithRetry(
  command: SendEmailCommand,
  userEmail: string,
  logPrefix: string,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ success: boolean; attempts: number; error?: Error }> {
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
        console.error(`${logPrefix} Failed to send email to ${userEmail} after ${attempt} attempt(s):`, lastError.message);
        return { success: false, attempts: attempt, error: lastError };
      }

      // Calculate exponential backoff delay
      const delay = Math.min(
        retryConfig.baseDelayMs * Math.pow(2, attempt - 1),
        retryConfig.maxDelayMs
      );

      console.warn(`${logPrefix} Attempt ${attempt} failed for ${userEmail}, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { success: false, attempts: retryConfig.maxAttempts, error: lastError };
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: Error): boolean {
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
 * Sends new episode notification to all subscribed users
 * @param episodeId - ID of the newly published episode
 * @returns Result with statistics about sent emails
 */
export async function sendNewEpisodeNotification(
  episodeId: string
): Promise<EmailNotificationResult> {
  const logPrefix = `[EMAIL_NOTIFICATION:${episodeId}]`;

  const result: EmailNotificationResult = {
    success: false,
    totalSubscribers: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: [],
    retriedEmails: 0,
  };

  try {
    console.log(`${logPrefix} Starting notification process`);

    // Initialize rate limiter based on environment
    const rateLimiter = SESRateLimiter.createFromEnvironment();
    const stats = rateLimiter.getStats();
    console.log(`${logPrefix} Rate limiter initialized:`, stats);

    // 1. Get episode and podcast details
    const episode = await episodesApi.getEpisodeById(episodeId);
    if (!episode) {
      const error = 'Episode not found';
      console.error(`${logPrefix} ${error}`);
      result.errors.push(error);
      return result;
    }

    if (!episode.podcast_id) {
      const error = 'Episode has no podcast_id';
      console.error(`${logPrefix} ${error}`);
      result.errors.push(error);
      return result;
    }

    const podcast = await podcastsApi.getPodcastById(episode.podcast_id);
    if (!podcast) {
      const error = 'Podcast not found';
      console.error(`${logPrefix} ${error}`);
      result.errors.push(error);
      return result;
    }

    console.log(`${logPrefix} Found episode "${episode.title}" from podcast "${podcast.title}"`);

    // 2. Get all subscribers for this podcast
    const subscribers = await subscriptionsApi.getPodcastSubscriptions(episode.podcast_id);
    result.totalSubscribers = subscribers.length;

    if (subscribers.length === 0) {
      console.log(`${logPrefix} No subscribers found for this podcast`);
      result.success = true;
      return result;
    }

    console.log(`${logPrefix} Found ${subscribers.length} subscribers`);

    // 3. Prepare email data
    const emailData: EpisodeEmailData = {
      episodeId: episode.id,
      episodeTitle: episode.title,
      episodeDescription: episode.description || undefined,
      podcastTitle: podcast.title,
      podcastId: podcast.id,
      coverImage: episode.cover_image || podcast.cover_image || undefined,
      duration: episode.duration || undefined,
      publishedAt: episode.published_at ? new Date(episode.published_at) : undefined,
    };

    // 4. Batch fetch all user data in a single optimized query
    // This replaces 3-4 queries per subscriber with just 1 query total
    const userIds = subscribers.map(s => s.user_id).filter(Boolean) as string[];

    if (userIds.length === 0) {
      console.log(`${logPrefix} No valid user IDs found in subscriptions`);
      result.success = true;
      return result;
    }

    console.log(`${logPrefix} Fetching data for ${userIds.length} users in batch query`);

    interface BatchUserData {
      user_id: string;
      email: string;
      email_notifications: boolean | null;
      already_sent: boolean;
      [key: string]: unknown;
    }

    const batchResult = await db.execute<BatchUserData>(sql`
      SELECT
        u.id as user_id,
        u.email,
        COALESCE(p.email_notifications, true) as email_notifications,
        CASE WHEN se.id IS NOT NULL THEN true ELSE false END as already_sent
      FROM auth.users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN sent_episodes se ON se.user_id = u.id AND se.episode_id = ${episodeId}
      WHERE u.id = ANY(${userIds}::uuid[])
    `);

    console.log(`${logPrefix} Batch query returned ${batchResult.length} user records`);

    // Create a map for fast lookup
    const userDataMap = new Map<string, BatchUserData>();
    for (const userData of batchResult) {
      userDataMap.set(userData.user_id, userData);
    }

    // 5. Process each subscriber using the batched data
    const emailsSentRecords: { user_id: string; episode_id: string }[] = [];

    for (const subscription of subscribers) {
      const userId = subscription.user_id;
      if (!userId) {
        console.warn(`${logPrefix} Subscription ${subscription.id} has no user_id`);
        continue;
      }

      const userData = userDataMap.get(userId);

      if (!userData) {
        const error = `No user data found for user ${userId}`;
        console.error(`${logPrefix} ${error}`);
        result.errors.push(error);
        result.emailsFailed++;
        continue;
      }

      // Skip if already sent
      if (userData.already_sent) {
        console.log(`${logPrefix} Episode already sent to user ${userId}, skipping`);
        continue;
      }

      // Skip if email notifications disabled
      if (!userData.email_notifications) {
        console.log(`${logPrefix} User ${userId} has email notifications disabled, skipping`);
        continue;
      }

      // Skip if no email
      if (!userData.email) {
        const error = `No email found for user ${userId}`;
        console.error(`${logPrefix} ${error}`);
        result.errors.push(error);
        result.emailsFailed++;
        continue;
      }

      try {
        const userEmail = userData.email;

        // Wait for rate limit before sending
        try {
          await rateLimiter.waitForRateLimit();
        } catch (rateLimitError) {
          const error = `Rate limit exceeded: ${rateLimitError instanceof Error ? rateLimitError.message : 'Unknown error'}`;
          console.error(`${logPrefix} ${error}`);
          result.errors.push(error);
          result.emailsFailed++;
          break; // Stop processing if we hit daily limit
        }

        // Generate email content
        const htmlContent = generateNewEpisodeHTML(emailData);
        const textContent = generateNewEpisodeText(emailData);

        // Send email via SES with retry logic
        const sendEmailCommand = new SendEmailCommand({
          Destination: {
            ToAddresses: [userEmail],
          },
          Message: {
            Body: {
              Html: {
                Charset: 'UTF-8',
                Data: htmlContent,
              },
              Text: {
                Charset: 'UTF-8',
                Data: textContent,
              },
            },
            Subject: {
              Charset: 'UTF-8',
              Data: `🎙️ New ${podcast.title} Episode: ${episode.title}`,
            },
          },
          Source: `${SES_CONFIG.FROM_NAME} <${SES_CONFIG.FROM_EMAIL}>`,
        });

        const sendResult = await sendEmailWithRetry(sendEmailCommand, userEmail, logPrefix);

        if (sendResult.success) {
          // Track this email for batch recording
          emailsSentRecords.push({
            user_id: userId,
            episode_id: episodeId,
          });

          result.emailsSent++;

          // Track retries
          if (sendResult.attempts > 1) {
            result.retriedEmails!++;
            console.log(`${logPrefix} Email to ${userEmail} succeeded after ${sendResult.attempts} attempts`);
          }
        } else {
          const errorMsg = sendResult.error?.message || 'Unknown error';
          result.errors.push(`Failed to send to ${userEmail}: ${errorMsg}`);
          result.emailsFailed++;
        }

      } catch (error) {
        const errorMsg = `Failed to send email to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`${logPrefix} ${errorMsg}`, error);
        result.errors.push(errorMsg);
        result.emailsFailed++;
      }
    }

    // 6. Batch insert all sent_episodes records in one query
    if (emailsSentRecords.length > 0) {
      try {
        console.log(`${logPrefix} Recording ${emailsSentRecords.length} sent emails in batch`);
        await db.insert(sentEpisodes).values(emailsSentRecords);
        console.log(`${logPrefix} Successfully recorded all sent emails`);
      } catch (error) {
        console.error(`${logPrefix} Failed to batch record sent emails:`, error);
        // Don't fail the entire operation if recording fails
      }
    }

    // 7. Mark as successful if at least one email was sent
    result.success = result.emailsSent > 0 || result.totalSubscribers === 0;

    // Log comprehensive final statistics
    const finalStats = rateLimiter.getStats();
    console.log(`${logPrefix} ===== Notification Process Completed =====`);
    console.log(`${logPrefix} Total Subscribers: ${result.totalSubscribers}`);
    console.log(`${logPrefix} Emails Sent: ${result.emailsSent}`);
    console.log(`${logPrefix} Emails Failed: ${result.emailsFailed}`);
    console.log(`${logPrefix} Emails Retried: ${result.retriedEmails}`);
    console.log(`${logPrefix} Success Rate: ${result.totalSubscribers > 0 ? ((result.emailsSent / result.totalSubscribers) * 100).toFixed(1) : 0}%`);
    console.log(`${logPrefix} Rate Limiter Stats:`, finalStats);

    if (result.errors.length > 0) {
      console.error(`${logPrefix} Errors encountered (${result.errors.length}):`, result.errors.slice(0, 5));
      if (result.errors.length > 5) {
        console.error(`${logPrefix} ... and ${result.errors.length - 5} more errors`);
      }
    }

    return result;

  } catch (error) {
    const errorMsg = `Unexpected error in notification process: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`${logPrefix} ${errorMsg}`, error);
    result.errors.push(errorMsg);
    return result;
  }
}
