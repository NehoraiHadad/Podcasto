import { parseISOUTC } from '@/lib/utils/date/server';
/**
 * Base utilities for scraping Telegram channel data from t.me/s/{channel}
 * These functions provide reusable primitives for Telegram scraping operations
 */

import {
  TelegramScraperOptions,
  DEFAULT_SCRAPER_OPTIONS,
} from './types';

/**
 * Clean and validate a Telegram channel username
 * @param channelUsername - Raw channel username (with or without @)
 * @returns Cleaned channel username or null if invalid
 */
export function cleanChannelUsername(channelUsername: string): string | null {
  const cleaned = channelUsername.replace(/^@/, '').trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Fetch the HTML content of a Telegram channel's public page
 * @param channelUsername - The channel username (with or without @)
 * @param options - Optional scraper configuration
 * @returns HTML string of the channel page
 * @throws Error if the channel is not accessible or fetch fails
 */
export async function fetchTelegramChannelPage(
  channelUsername: string,
  options?: TelegramScraperOptions
): Promise<string> {
  const cleanChannel = cleanChannelUsername(channelUsername);

  if (!cleanChannel) {
    const error = 'Invalid channel username: cannot be empty';
    console.error('[TELEGRAM_SCRAPER_BASE]', error);
    throw new Error(error);
  }

  const opts = { ...DEFAULT_SCRAPER_OPTIONS, ...options };
  const url = `https://t.me/s/${cleanChannel}`;

  console.log(`[TELEGRAM_SCRAPER_BASE] Fetching channel page: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': opts.userAgent,
        ...opts.headers,
      },
      signal: AbortSignal.timeout(opts.timeout),
    });

    if (!response.ok) {
      const error = `Channel not accessible: HTTP ${response.status} ${response.statusText}`;
      console.error(`[TELEGRAM_SCRAPER_BASE] ${error}`);
      throw new Error(error);
    }

    const html = await response.text();
    console.log(
      `[TELEGRAM_SCRAPER_BASE] Successfully fetched ${html.length} bytes from ${cleanChannel}`
    );

    return html;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        console.error(
          `[TELEGRAM_SCRAPER_BASE] Request timeout after ${opts.timeout}ms`
        );
        throw new Error(`Request timeout: channel page took too long to load`);
      }
      console.error('[TELEGRAM_SCRAPER_BASE] Fetch error:', error.message);
      throw error;
    }
    throw new Error('Unknown error fetching channel page');
  }
}

/**
 * Parse the channel image URL from Telegram channel HTML
 * @param html - HTML content from Telegram channel page
 * @returns Image URL or null if not found
 */
export function parseChannelImageFromHTML(html: string): string | null {
  console.log('[TELEGRAM_SCRAPER_BASE] Parsing channel image from HTML');

  // Primary: Extract og:image meta tag
  const ogImageMatch = html.match(
    /<meta property="og:image" content="([^"]+)"/
  );

  if (ogImageMatch && ogImageMatch[1]) {
    const imageUrl = ogImageMatch[1];
    console.log(
      `[TELEGRAM_SCRAPER_BASE] Found og:image: ${imageUrl.substring(0, 80)}...`
    );
    return imageUrl;
  }

  // Fallback: Extract background-image from tgme_page_photo_image class
  const photoMatch = html.match(
    /class="tgme_page_photo_image"[^>]+style="background-image:url\('([^']+)'\)"/
  );

  if (photoMatch && photoMatch[1]) {
    const imageUrl = photoMatch[1];
    console.log(
      `[TELEGRAM_SCRAPER_BASE] Found background-image: ${imageUrl.substring(0, 80)}...`
    );
    return imageUrl;
  }

  console.warn('[TELEGRAM_SCRAPER_BASE] No channel image found in HTML');
  return null;
}

/**
 * Parse the latest message date from Telegram channel HTML
 * Looks for the LAST message's timestamp in the page (most recent)
 * @param html - HTML content from Telegram channel page
 * @returns Date object or null if not found
 */
export function parseLatestMessageDateFromHTML(html: string): Date | null {
  console.log('[TELEGRAM_SCRAPER_BASE] Parsing latest message date from HTML');

  // Look for ALL time elements with datetime attribute
  // Example: <time class="time" datetime="2025-10-24T12:34:56+00:00">
  // Note: Telegram pages show messages chronologically (oldest first, newest last)
  // so we need to find the LAST match, not the first
  const matches = Array.from(html.matchAll(/<time[^>]+datetime="([^"]+)"/g));

  console.log(`[TELEGRAM_SCRAPER_BASE] Found ${matches.length} time elements in HTML`);

  if (matches.length === 0) {
    console.warn('[TELEGRAM_SCRAPER_BASE] No message date found in HTML');
    return null;
  }

  // Get the last match (most recent message)
  const lastMatch = matches[matches.length - 1];

  if (lastMatch && lastMatch[1]) {
    try {
      const dateString = lastMatch[1];
      const date = parseISOUTC(dateString);

      if (!isNaN(date.getTime())) {
        // Log diagnostic info if multiple messages found
        if (matches.length > 1) {
          const firstDateString = matches[0][1];
          console.log(
            `[TELEGRAM_SCRAPER_BASE] First message date: ${parseISOUTC(firstDateString).toISOString()}`
          );
        }

        console.log(
          `[TELEGRAM_SCRAPER_BASE] Latest message date: ${date.toISOString()}`
        );
        return date;
      }

      console.warn(
        `[TELEGRAM_SCRAPER_BASE] Invalid date format: ${dateString}`
      );
    } catch (error) {
      console.error(
        '[TELEGRAM_SCRAPER_BASE] Error parsing date:',
        error instanceof Error ? error.message : error
      );
    }
  }

  console.warn('[TELEGRAM_SCRAPER_BASE] Could not parse date from matched time element');
  return null;
}
