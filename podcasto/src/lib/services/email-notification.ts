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

        // Send email via SES
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

        await sesClient.send(sendEmailCommand);
        console.log(`${logPrefix} Successfully sent email to ${userEmail}`);

        // Track this email for batch recording
        emailsSentRecords.push({
          user_id: userId,
          episode_id: episodeId,
        });

        result.emailsSent++;

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

    // Log final rate limiter stats
    const finalStats = rateLimiter.getStats();
    console.log(`${logPrefix} Notification process completed. Sent: ${result.emailsSent}, Failed: ${result.emailsFailed}`);
    console.log(`${logPrefix} Rate limiter stats:`, finalStats);

    return result;

  } catch (error) {
    const errorMsg = `Unexpected error in notification process: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`${logPrefix} ${errorMsg}`, error);
    result.errors.push(errorMsg);
    return result;
  }
}
