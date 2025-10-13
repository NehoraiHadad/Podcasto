/**
 * Batch Builder for SES Bulk Email
 * Constructs batches and destinations for AWS SES SendBulkTemplatedEmail
 */

import type { BulkEmailDestination } from '@aws-sdk/client-ses';
import type { SESTemplateData } from '@/lib/email/templates/ses-templates';
import type { BatchUserData, SentEmailRecord } from './types';
import type { InferSelectModel } from 'drizzle-orm';
import { subscriptions } from '@/lib/db/schema';

type Subscription = InferSelectModel<typeof subscriptions>;

/**
 * Maximum recipients per SES bulk email API call
 */
export const MAX_RECIPIENTS_PER_BATCH = 50;

/**
 * Recipient info for bulk sending
 */
export interface RecipientInfo {
  subscription: Subscription;
  userData: BatchUserData;
  episodeUrl: string;
}

/**
 * Result of sending a single bulk batch
 */
export interface BulkBatchResult {
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
export function batchRecipients(recipients: RecipientInfo[]): RecipientInfo[][] {
  const batches: RecipientInfo[][] = [];
  for (let i = 0; i < recipients.length; i += MAX_RECIPIENTS_PER_BATCH) {
    batches.push(recipients.slice(i, i + MAX_RECIPIENTS_PER_BATCH));
  }
  return batches;
}

/**
 * Builds BulkEmailDestination array for SES API
 * @param batch - Batch of recipients
 * @param _defaultTemplateData - Default template data (reserved for future use)
 * @returns Array of BulkEmailDestination objects
 */
export function buildBulkDestinations(
  batch: RecipientInfo[],
  _defaultTemplateData: SESTemplateData
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
