/**
 * Email sending logic for notifications
 * Handles the actual sending loop with rate limiting and retry
 */

import { SendEmailCommand } from '@aws-sdk/client-ses';
import { SES_CONFIG } from '@/lib/aws/ses-client';
import { SESRateLimiter } from '@/lib/aws/ses-rate-limiter';
import { generateNewEpisodeHTML, generateNewEpisodeText, type EpisodeEmailData } from '@/lib/email/templates/new-episode';
import { db, sentEpisodes } from '@/lib/db';
import { errorToString } from '@/lib/utils/error-utils';
import { sendEmailWithRetry } from './retry';
import type { BatchUserData, EmailNotificationResult, SentEmailRecord } from './types';
import type { InferSelectModel } from 'drizzle-orm';
import { subscriptions } from '@/lib/db/schema';

type Subscription = InferSelectModel<typeof subscriptions>;

/**
 * Creates an SES SendEmailCommand from email data
 * @param emailData - Episode email data
 * @param userEmail - Recipient email address
 * @param podcastTitle - Podcast title for subject line
 * @returns SendEmailCommand ready to be sent
 */
export function createEmailCommand(
  emailData: EpisodeEmailData,
  userEmail: string,
  podcastTitle: string
): SendEmailCommand {
  const htmlContent = generateNewEpisodeHTML(emailData);
  const textContent = generateNewEpisodeText(emailData);

  return new SendEmailCommand({
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
        Data: `🎙️ New ${podcastTitle} Episode: ${emailData.episodeTitle}`,
      },
    },
    Source: `${SES_CONFIG.FROM_NAME} <${SES_CONFIG.FROM_EMAIL}>`,
  });
}

/**
 * Sends emails to all eligible subscribers
 * @param subscribers - Array of subscriptions
 * @param userDataMap - Map of user data
 * @param emailData - Episode email data
 * @param episodeId - Episode ID for tracking
 * @param rateLimiter - Rate limiter instance
 * @param logPrefix - Log prefix for consistent logging
 * @param result - Result object to update
 * @returns Array of successfully sent email records
 */
export async function sendToSubscribers(
  subscribers: Subscription[],
  userDataMap: Map<string, BatchUserData>,
  emailData: EpisodeEmailData,
  episodeId: string,
  rateLimiter: SESRateLimiter,
  logPrefix: string,
  result: EmailNotificationResult
): Promise<SentEmailRecord[]> {
  const emailsSentRecords: SentEmailRecord[] = [];

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
        const error = `Rate limit exceeded: ${errorToString(rateLimitError)}`;
        console.error(`${logPrefix} ${error}`);
        result.errors.push(error);
        result.emailsFailed++;
        break; // Stop processing if we hit daily limit
      }

      // Create and send email command
      const sendEmailCommand = createEmailCommand(emailData, userEmail, emailData.podcastTitle);
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
        const errorMsg = errorToString(sendResult.error);
        result.errors.push(`Failed to send to ${userEmail}: ${errorMsg}`);
        result.emailsFailed++;
      }

    } catch (error) {
      const errorMsg = `Failed to send email to user ${userId}: ${errorToString(error)}`;
      console.error(`${logPrefix} ${errorMsg}`, error);
      result.errors.push(errorMsg);
      result.emailsFailed++;
    }
  }

  return emailsSentRecords;
}

/**
 * Records sent emails in batch to database
 * @param emailsSentRecords - Array of sent email records
 * @param logPrefix - Log prefix for consistent logging
 */
export async function recordSentEmails(
  emailsSentRecords: SentEmailRecord[],
  logPrefix: string
): Promise<void> {
  if (emailsSentRecords.length === 0) {
    return;
  }

  try {
    console.log(`${logPrefix} Recording ${emailsSentRecords.length} sent emails in batch`);
    await db.insert(sentEpisodes).values(emailsSentRecords);
    console.log(`${logPrefix} Successfully recorded all sent emails`);
  } catch (error) {
    console.error(`${logPrefix} Failed to batch record sent emails:`, error);
    // Don't fail the entire operation if recording fails
  }
}
