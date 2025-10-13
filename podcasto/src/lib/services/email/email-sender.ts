/**
 * Email Sender - Bulk Email Orchestration
 * Orchestrates sending bulk emails to subscribers with validation and rate limiting
 */

import type { SESRateLimiter } from '@/lib/aws/ses-rate-limiter';
import type { SESTemplateData } from '@/lib/email/templates/ses-templates';
import { db, sentEpisodes } from '@/lib/db';
import { errorToString } from '@/lib/utils/error-utils';
import type { BatchUserData, EmailNotificationResult, SentEmailRecord } from './types';
import type { InferSelectModel } from 'drizzle-orm';
import { subscriptions } from '@/lib/db/schema';
import { getOrCreateUnsubscribeToken } from '@/lib/actions/unsubscribe-actions';
import { batchRecipients, MAX_RECIPIENTS_PER_BATCH, type RecipientInfo } from './batch-builder';
import { sendBulkBatch } from './batch-sender';

type Subscription = InferSelectModel<typeof subscriptions>;

/**
 * Sends new episode notification to subscribers using bulk email API
 * @param subscribers - Array of subscriptions
 * @param userDataMap - Map of user data
 * @param emailData - Episode email data (as SESTemplateData)
 * @param episodeId - Episode ID
 * @param rateLimiter - Rate limiter instance
 * @param logPrefix - Log prefix
 * @param result - Result object to update
 * @returns Array of successfully sent email records
 */
export async function sendBulkEmailsToSubscribers(
  subscribers: Subscription[],
  userDataMap: Map<string, BatchUserData>,
  emailData: SESTemplateData,
  episodeId: string,
  rateLimiter: SESRateLimiter,
  logPrefix: string,
  result: EmailNotificationResult
): Promise<SentEmailRecord[]> {
  const allSentRecords: SentEmailRecord[] = [];

  // 1. Build list of eligible recipients
  const eligibleRecipients: RecipientInfo[] = [];

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

    // Generate unsubscribe token if missing
    if (!userData.unsubscribe_token) {
      console.log(`${logPrefix} Generating unsubscribe token for user ${userId}`);
      const tokenResult = await getOrCreateUnsubscribeToken(userId);
      if (tokenResult.success && tokenResult.token) {
        userData.unsubscribe_token = tokenResult.token;
      } else {
        console.warn(`${logPrefix} Failed to generate token for user ${userId}, will use settings URL as fallback`);
      }
    }

    // Add to eligible list
    eligibleRecipients.push({
      subscription,
      userData,
      episodeUrl: emailData.episodeUrl, // Each user gets same URL for now
    });
  }

  console.log(
    `${logPrefix} Found ${eligibleRecipients.length} eligible recipients out of ${subscribers.length} subscribers`
  );

  if (eligibleRecipients.length === 0) {
    return allSentRecords;
  }

  // 2. Divide into batches of 50
  const batches = batchRecipients(eligibleRecipients);
  console.log(`${logPrefix} Divided into ${batches.length} batch(es) of up to ${MAX_RECIPIENTS_PER_BATCH} recipients`);

  // 3. Send each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNumber = i + 1;

    console.log(`${logPrefix} Processing batch ${batchNumber}/${batches.length} (${batch.length} recipients)`);

    // Wait for rate limit before sending batch
    try {
      // With bulk sending, we wait per batch (not per email)
      // SES handles internal rate limiting
      await rateLimiter.waitForBatch(batch.length);
    } catch (rateLimitError) {
      const error = `Rate limit exceeded at batch ${batchNumber}: ${errorToString(rateLimitError)}`;
      console.error(`${logPrefix} ${error}`);
      result.errors.push(error);
      result.emailsFailed += batch.length;
      break; // Stop processing if we hit daily limit
    }

    // Send the batch
    const batchResult = await sendBulkBatch(batch, emailData, episodeId, `${logPrefix}[Batch ${batchNumber}]`);

    // Update overall result
    result.emailsSent += batchResult.successCount;
    result.emailsFailed += batchResult.failureCount;
    result.errors.push(...batchResult.errors);
    allSentRecords.push(...batchResult.sentRecords);
  }

  return allSentRecords;
}

/**
 * Records sent emails in batch to database
 * @param emailsSentRecords - Array of sent email records
 * @param logPrefix - Log prefix
 */
export async function recordBulkSentEmails(
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
