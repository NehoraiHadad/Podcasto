/**
 * Batch Sender for SES Bulk Email
 * Sends individual bulk batches using AWS SES SendBulkTemplatedEmailCommand
 */

import { SendBulkTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { sesClient, SES_CONFIG } from '@/lib/aws/ses-client';
import type { SESTemplateData } from '@/lib/email/templates/ses-templates';
import { errorToString } from '@/lib/utils/error-utils';
import type { RecipientInfo, BulkBatchResult } from './batch-builder';
import { buildBulkDestinations } from './batch-builder';

/**
 * SES Template name created via create-ses-template.sh script
 */
const SES_TEMPLATE_NAME = 'podcasto-new-episode-v1';

/**
 * Sends a single bulk email batch using SendBulkTemplatedEmailCommand
 * @param batch - Batch of recipients
 * @param defaultTemplateData - Default template data
 * @param episodeId - Episode ID for tracking
 * @param logPrefix - Log prefix
 * @returns Bulk batch result with success/failure counts
 */
export async function sendBulkBatch(
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
