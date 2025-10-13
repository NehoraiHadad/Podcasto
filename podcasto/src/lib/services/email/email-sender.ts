/**
 * AWS SES Bulk Email Sender
 * Implements SendBulkTemplatedEmail for efficient batch email sending
 */

import { SendBulkTemplatedEmailCommand, type BulkEmailDestination } from '@aws-sdk/client-ses';
import { sesClient, SES_CONFIG } from '@/lib/aws/ses-client';
import { SESRateLimiter } from '@/lib/aws/ses-rate-limiter';
import { type SESTemplateData } from '@/lib/email/templates/ses-templates';
import { db, sentEpisodes } from '@/lib/db';
import { errorToString } from '@/lib/utils/error-utils';
import type { BatchUserData, EmailNotificationResult, SentEmailRecord } from './types';
import type { InferSelectModel } from 'drizzle-orm';
import { subscriptions } from '@/lib/db/schema';
import { getOrCreateUnsubscribeToken } from '@/lib/actions/unsubscribe-actions';

type Subscription = InferSelectModel<typeof subscriptions>;

/**
 * Maximum recipients per SES bulk email API call
 */
const MAX_RECIPIENTS_PER_BATCH = 50;

/**
 * SES Template name created via create-ses-template.sh script
 */
const SES_TEMPLATE_NAME = 'podcasto-new-episode-v1';

/**
 * Recipient info for bulk sending
 */
interface RecipientInfo {
  subscription: Subscription;
  userData: BatchUserData;
  episodeUrl: string;
}

/**
 * Result of sending a single bulk batch
 */
interface BulkBatchResult {
  successCount: number;
  failureCount: number;
  sentRecords: SentEmailRecord[];
  errors: string[];
}

/**
 * Divides subscribers into batches of up to 50 recipients
 * @param recipients - Array of recipient info
 * @returns Array of batches, each with up to 50 recipients
 */
function batchRecipients(recipients: RecipientInfo[]): RecipientInfo[][] {
  const batches: RecipientInfo[][] = [];
  for (let i = 0; i < recipients.length; i += MAX_RECIPIENTS_PER_BATCH) {
    batches.push(recipients.slice(i, i + MAX_RECIPIENTS_PER_BATCH));
  }
  return batches;
}

/**
 * Builds BulkEmailDestination array for SES API
 * @param batch - Batch of recipients
 * @param defaultTemplateData - Default template data (shared)
 * @returns Array of BulkEmailDestination objects
 */
function buildBulkDestinations(
  batch: RecipientInfo[],
  defaultTemplateData: SESTemplateData
): BulkEmailDestination[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcasto.org';

  return batch.map((recipient) => {
    // Build settings and unsubscribe URLs
    const settingsUrl = `${siteUrl}/settings/notifications`;
    const unsubscribeUrl = recipient.userData.unsubscribe_token
      ? `${siteUrl}/unsubscribe?token=${recipient.userData.unsubscribe_token}`
      : settingsUrl; // Fallback to settings if no token

    // Per-recipient personalization
    const replacementData: Partial<SESTemplateData> = {
      episodeUrl: recipient.episodeUrl,
      settingsUrl,
      unsubscribeUrl,
    };

    return {
      Destination: {
        ToAddresses: [recipient.userData.email],
      },
      ReplacementTemplateData: JSON.stringify(replacementData),
    };
  });
}

/**
 * Sends a single bulk email batch using SendBulkTemplatedEmailCommand
 * @param batch - Batch of recipients
 * @param defaultTemplateData - Default template data
 * @param episodeId - Episode ID for tracking
 * @param logPrefix - Log prefix
 * @returns Bulk batch result with success/failure counts
 */
async function sendBulkBatch(
  batch: RecipientInfo[],
  defaultTemplateData: SESTemplateData,
  episodeId: string,
  logPrefix: string
): Promise<BulkBatchResult> {
  const result: BulkBatchResult = {
    successCount: 0,
    failureCount: 0,
    sentRecords: [],
    errors: [],
  };

  try {
    const destinations = buildBulkDestinations(batch, defaultTemplateData);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcasto.org';

    const command = new SendBulkTemplatedEmailCommand({
      Source: `${SES_CONFIG.FROM_NAME} <${SES_CONFIG.FROM_EMAIL}>`,
      Template: SES_TEMPLATE_NAME, // Pre-created SES template name
      DefaultTemplateData: JSON.stringify({
        ...defaultTemplateData,
        settingsUrl: `${siteUrl}/settings/notifications`,
        unsubscribeUrl: `${siteUrl}/settings/notifications`, // Default fallback
      }),
      Destinations: destinations,
      ReplyToAddresses: [SES_CONFIG.FROM_EMAIL],
    });

    console.log(`${logPrefix} Sending bulk email to ${batch.length} recipients`);

    const response = await sesClient.send(command);

    // Process results per recipient
    if (response.Status) {
      for (let i = 0; i < response.Status.length; i++) {
        const status = response.Status[i];
        const recipient = batch[i];

        if (status.Status === 'Success') {
          result.successCount++;
          result.sentRecords.push({
            user_id: recipient.subscription.user_id!,
            episode_id: episodeId,
          });
          console.log(
            `${logPrefix} Successfully sent to ${recipient.userData.email} (MessageId: ${status.MessageId})`
          );
        } else {
          result.failureCount++;
          const errorMsg = `Failed to send to ${recipient.userData.email}: ${status.Error || 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`${logPrefix} ${errorMsg}`);
        }
      }
    }

    return result;
  } catch (error) {
    // Entire batch failed
    const errorMsg = `Bulk send failed for entire batch: ${errorToString(error)}`;
    console.error(`${logPrefix} ${errorMsg}`, error);

    // Mark all recipients in batch as failed
    result.failureCount = batch.length;
    result.errors.push(errorMsg);

    return result;
  }
}

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
