'use server';

/**
 * Shared handler for Telegram channel message pre-checking
 * Handles channel accessibility detection, status updates, and decision logic
 */

import { checkForNewMessages } from '@/lib/services/telegram';
import { ChannelAccessStatus } from '@/lib/services/telegram/types';
import type { MessageCheckOptions } from '@/lib/services/telegram/types';
import { db } from '@/lib/db';
import { podcastConfigs } from '@/lib/db/schema/podcast-configs';
import { eq } from 'drizzle-orm';

/**
 * Result of message pre-check handling
 */
export interface MessageCheckHandlerResult {
  /** Whether to proceed with episode generation */
  shouldProceed: boolean;
  /** Whether to stop and return error to user */
  shouldStop: boolean;
  /** Error message if shouldStop is true */
  errorMessage?: string;
  /** Channel access status detected */
  accessStatus: ChannelAccessStatus;
  /** Whether new messages were found (if accessible) */
  hasNewMessages: boolean;
  /** Latest message date (if found) */
  latestMessageDate?: Date;
}

/**
 * Handle Telegram channel message pre-check with intelligent routing
 *
 * Logic:
 * - NO_PREVIEW: Continue to Lambda (it has authenticated access)
 * - ACCESSIBLE + messages: Continue to Lambda
 * - ACCESSIBLE + no messages: Stop with error
 * - NOT_FOUND/ERROR: Continue to Lambda (it might have better access)
 *
 * @param podcastId - ID of the podcast
 * @param channelUsername - Telegram channel username
 * @param messageCheckOptions - Date range or days back to check
 * @param currentStoredStatus - Current channel_access_status from database
 * @returns MessageCheckHandlerResult with routing decision
 */
export async function handleMessagePreCheck(
  podcastId: string,
  channelUsername: string,
  messageCheckOptions: MessageCheckOptions | number,
  currentStoredStatus?: string | null
): Promise<MessageCheckHandlerResult> {
  console.log(`[MESSAGE_CHECK_HANDLER] Starting pre-check for channel: ${channelUsername}`);

  // Perform message check
  const messageCheck = await checkForNewMessages(channelUsername, messageCheckOptions);

  console.log(`[MESSAGE_CHECK_HANDLER] Check result:`, {
    hasNewMessages: messageCheck.hasNewMessages,
    accessStatus: messageCheck.accessStatus,
    latestMessageDate: messageCheck.latestMessageDate?.toISOString(),
  });

  // Update channel access status in database if changed
  if (currentStoredStatus !== messageCheck.accessStatus) {
    try {
      // Map ChannelAccessStatus enum to database type
      const dbStatus = messageCheck.accessStatus === ChannelAccessStatus.ACCESSIBLE
        ? 'accessible' as const
        : messageCheck.accessStatus === ChannelAccessStatus.NO_PREVIEW
        ? 'no_preview' as const
        : 'unknown' as const;

      await db.update(podcastConfigs)
        .set({
          channel_access_status: dbStatus,
          channel_access_checked_at: messageCheck.checkedAt,
        })
        .where(eq(podcastConfigs.podcast_id, podcastId));

      console.log(`[MESSAGE_CHECK_HANDLER] Updated database: ${currentStoredStatus} → ${messageCheck.accessStatus}`);
    } catch (dbError) {
      console.error(`[MESSAGE_CHECK_HANDLER] Error updating database:`, dbError);
      // Non-blocking - continue with logic
    }
  }

  // Route based on access status
  switch (messageCheck.accessStatus) {
    case ChannelAccessStatus.NO_PREVIEW:
      console.log(`[MESSAGE_CHECK_HANDLER] NO_PREVIEW detected - proceeding to Lambda (has authenticated access)`);
      return {
        shouldProceed: true,
        shouldStop: false,
        accessStatus: messageCheck.accessStatus,
        hasNewMessages: false, // Unknown until Lambda checks
      };

    case ChannelAccessStatus.ACCESSIBLE:
      if (messageCheck.hasNewMessages) {
        console.log(`[MESSAGE_CHECK_HANDLER] Messages found - proceeding to generation`);
        return {
          shouldProceed: true,
          shouldStop: false,
          accessStatus: messageCheck.accessStatus,
          hasNewMessages: true,
          latestMessageDate: messageCheck.latestMessageDate,
        };
      } else {
        console.log(`[MESSAGE_CHECK_HANDLER] No messages in date range - stopping`);
        return {
          shouldProceed: false,
          shouldStop: true,
          errorMessage: `No new messages found in ${channelUsername} for the specified time range. ${
            messageCheck.latestMessageDate
              ? `Latest message: ${messageCheck.latestMessageDate.toISOString()}`
              : 'No recent messages detected'
          }`,
          accessStatus: messageCheck.accessStatus,
          hasNewMessages: false,
          latestMessageDate: messageCheck.latestMessageDate,
        };
      }

    case ChannelAccessStatus.NOT_FOUND:
      console.warn(`[MESSAGE_CHECK_HANDLER] Channel not found via web - Lambda will try authenticated access`);
      return {
        shouldProceed: true,
        shouldStop: false,
        accessStatus: messageCheck.accessStatus,
        hasNewMessages: false, // Unknown until Lambda checks
      };

    case ChannelAccessStatus.ERROR:
      console.warn(`[MESSAGE_CHECK_HANDLER] Check error: ${messageCheck.error || 'Unknown'} - Lambda will try anyway`);
      return {
        shouldProceed: true,
        shouldStop: false,
        accessStatus: messageCheck.accessStatus,
        hasNewMessages: false, // Unknown until Lambda checks
      };

    default:
      // Shouldn't happen, but handle gracefully
      console.warn(`[MESSAGE_CHECK_HANDLER] Unexpected status: ${messageCheck.accessStatus} - proceeding to Lambda`);
      return {
        shouldProceed: true,
        shouldStop: false,
        accessStatus: messageCheck.accessStatus,
        hasNewMessages: false,
      };
  }
}
