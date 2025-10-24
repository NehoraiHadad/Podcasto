'use server';

import { SendEmailCommand } from '@aws-sdk/client-ses';
import { SES_CONFIG, sesClient } from '@/lib/aws/ses-client';
import { generateNoMessagesEmail } from '@/lib/email/templates/no-messages-notification';
import { db } from '@/lib/db';
import { podcasts, profiles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export interface SendNoMessagesNotificationParams {
  podcastId: string;
  creatorUserId: string;
  channelName: string;
  dateRange: {
    start: Date;
    end: Date;
  };
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
}: SendNoMessagesNotificationParams): Promise<{ success: boolean; data?: any; error?: string }> {
  const logPrefix = `[SEND_NO_MESSAGES_NOTIFICATION][Podcast:${podcastId}]`;

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
      console.error(`${logPrefix} ${error}`);
      return { success: false, error };
    }

    if (creator.emailNotifications === false) {
      console.log(`${logPrefix} Email notifications disabled for creator, skipping send`);
      return { success: true, data: { skipped: true, reason: 'notifications_disabled' } };
    }

    if (!creator.email) {
      const error = `Email address missing for creator ${creatorUserId}`;
      console.error(`${logPrefix} ${error}`);
      return { success: false, error };
    }

    const [podcast] = await db
      .select({ title: podcasts.title })
      .from(podcasts)
      .where(eq(podcasts.id, podcastId))
      .limit(1);

    if (!podcast) {
      const error = `Podcast not found: ${podcastId}`;
      console.error(`${logPrefix} ${error}`);
      return { success: false, error };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcasto.app';
    const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
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

    console.log(`${logPrefix} Email sent to ${creator.email}. MessageId=${response.MessageId}`);

    return {
      success: true,
      data: {
        messageId: response.MessageId,
        recipient: creator.email,
        manualTriggerUrl,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${logPrefix} Failed to send notification:`, error);
    return { success: false, error: message };
  }
}
