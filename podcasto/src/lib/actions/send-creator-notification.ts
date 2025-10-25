'use server';

import { SendEmailCommand } from '@aws-sdk/client-ses';
import { SES_CONFIG, sesClient } from '@/lib/aws/ses-client';
import { generateNoMessagesEmail } from '@/lib/email/templates/no-messages-notification';
import { db } from '@/lib/db';
import { podcasts, profiles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/utils/error-utils';
import { createLogger } from '@/lib/utils/logger';
import { getBaseUrl } from '@/lib/constants/deployment';

const logger = createLogger('SEND_NO_MESSAGES_NOTIFICATION');

export interface SendNoMessagesNotificationParams {
  podcastId: string;
  creatorUserId: string;
  channelName: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface NotificationData {
  messageId?: string;
  recipient?: string;
  manualTriggerUrl?: string;
  skipped?: boolean;
  reason?: string;
}

/**
 * Notifies a podcast creator that generation was skipped because no new messages were found.
 * Fetches creator preferences from Supabase, respects opt-outs, and logs failures without throwing.
 */
export async function sendNoMessagesNotification({
  podcastId,
  creatorUserId,
  channelName,
  dateRange,
}: SendNoMessagesNotificationParams): Promise<{
  success: boolean;
  data?: NotificationData;
  error?: string;
}> {
  try {
    const [creator] = await db
      .select({
        email: sql<string | null>`auth.users.email`,
        emailNotifications: profiles.email_notifications,
      })
      .from(profiles)
      .leftJoin(sql`auth.users`, sql`${profiles.id} = auth.users.id`)
      .where(eq(profiles.id, creatorUserId))
      .limit(1);

    if (!creator) {
      const error = `Creator profile not found for user ${creatorUserId}`;
      logger.error(error, undefined, { podcastId, creatorUserId });
      return { success: false, error };
    }

    if (creator.emailNotifications === false) {
      logger.info('Email notifications disabled for creator, skipping send', {
        podcastId,
        creatorUserId,
      });
      return createSuccessResponse({
        skipped: true,
        reason: 'notifications_disabled',
      });
    }

    if (!creator.email) {
      const error = `Email address missing for creator ${creatorUserId}`;
      logger.error(error, undefined, { podcastId, creatorUserId });
      return { success: false, error };
    }

    const [podcast] = await db
      .select({ title: podcasts.title })
      .from(podcasts)
      .where(eq(podcasts.id, podcastId))
      .limit(1);

    if (!podcast) {
      const error = `Podcast not found: ${podcastId}`;
      logger.error(error, undefined, { podcastId });
      return { success: false, error };
    }

    const normalizedSiteUrl = getBaseUrl().replace(/\/$/, '');
    const manualTriggerUrl = `${normalizedSiteUrl}/admin/podcasts/${podcastId}`;

    const { html, text } = generateNoMessagesEmail({
      channelName,
      dateRange,
      podcastName: podcast.title,
      manualTriggerUrl,
    });

    const subject = `No new messages found for ${podcast.title}`;

    const command = new SendEmailCommand({
      Source: `${SES_CONFIG.FROM_NAME} <${SES_CONFIG.FROM_EMAIL}>`,
      Destination: { ToAddresses: [creator.email] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' },
        },
      },
    });

    const response = await sesClient.send(command);

    logger.info('Email sent successfully', {
      podcastId,
      recipient: creator.email,
      messageId: response.MessageId,
    });

    return createSuccessResponse({
      messageId: response.MessageId,
      recipient: creator.email,
      manualTriggerUrl,
    });
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to send notification',
      'SEND_NO_MESSAGES_NOTIFICATION'
    );
  }
}
