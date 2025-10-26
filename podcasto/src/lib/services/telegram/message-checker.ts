import { nowUTC, parseISOUTC, subtractDays } from '@/lib/utils/date/server';
/**
 * Message pre-check service for Telegram channels
 * Determines if a channel has new messages within a date range without full scraping
 */

import {
  fetchTelegramChannelPage,
  parseLatestMessageDateFromHTML,
} from './telegram-scraper-base';
import type { MessageCheckResult, MessageCheckOptions } from './types';

/**
 * Check if a Telegram channel has new messages within a specified date range
 *
 * @param channelUsername - Telegram channel username (with or without @)
 * @param options - Either a number (days back from now) or a date range object
 * @returns MessageCheckResult with hasNewMessages flag and metadata
 *
 * @example
 * // Check for messages in the last 7 days
 * const result = await checkForNewMessages('channelname', 7);
 *
 * @example
 * // Check for messages in a specific date range
 * const result = await checkForNewMessages('channelname', {
 *   startDate: parseISOUTC('2025-10-20'),
 *   endDate: parseISOUTC('2025-10-24')
 * });
 */
export async function checkForNewMessages(
  channelUsername: string,
  options: MessageCheckOptions | number
): Promise<MessageCheckResult> {
  const checkedAt = nowUTC();

  try {
    // Step 1: Normalize input to date range
    const { startDate, endDate } = normalizeDateRange(options);

    console.log(
      `[MESSAGE_CHECKER] Checking ${channelUsername} from ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    // Step 2: Fetch channel HTML
    const html = await fetchTelegramChannelPage(channelUsername);

    // Step 3: Parse latest message date
    const latestMessageDate = parseLatestMessageDateFromHTML(html);

    if (!latestMessageDate) {
      console.log(
        `[MESSAGE_CHECKER] Result for ${channelUsername}: hasNewMessages=false (no messages found)`
      );
      return {
        hasNewMessages: false,
        channelUsername,
        checkedAt,
      };
    }

    // Step 4: Check if latest message is within date range
    const hasNewMessages =
      latestMessageDate >= startDate && latestMessageDate <= endDate;

    console.log(
      `[MESSAGE_CHECKER] Result for ${channelUsername}: hasNewMessages=${hasNewMessages} (latest: ${latestMessageDate.toISOString()})`
    );

    return {
      hasNewMessages,
      latestMessageDate,
      channelUsername,
      checkedAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    console.error(
      `[MESSAGE_CHECKER] Error checking ${channelUsername}:`,
      errorMessage
    );

    return {
      hasNewMessages: false,
      channelUsername,
      checkedAt,
      error: errorMessage,
    };
  }
}

/**
 * Normalize options into a date range object
 * Handles both number (days back) and object (explicit date range) inputs
 *
 * @param options - Either number of days back or explicit date range
 * @returns Normalized date range with startDate and endDate
 * @throws Error if date range is invalid
 */
function normalizeDateRange(
  options: MessageCheckOptions | number
): MessageCheckOptions {
  // Handle number input (days back from now)
  if (typeof options === 'number') {
    const now = nowUTC();
    const daysBack = Math.abs(options); // Ensure positive
    const startDate = subtractDays(now, daysBack);

    return {
      startDate,
      endDate: now,
    };
  }

  // Handle object input (explicit date range)
  const { startDate, endDate } = options;

  // Validate date range
  if (startDate >= endDate) {
    throw new Error(
      `Invalid date range: startDate (${startDate.toISOString()}) must be before endDate (${endDate.toISOString()})`
    );
  }

  return { startDate, endDate };
}
