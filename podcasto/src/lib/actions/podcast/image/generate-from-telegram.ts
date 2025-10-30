'use server';

/**
 * Generate podcast cover image from Telegram channel profile photo.
 * Scrapes the channel's public page and processes the image.
 */

import { requireAdmin, SessionService } from '@/lib/auth/server';
import { getTelegramChannelImage } from '@/lib/services/telegram-scraper';
import { db } from '@/lib/db';
import { podcasts, podcastConfigs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { enhanceImageWithAI } from './shared';
import type { ImageActionResult, ImageGenerationOptions } from './types';

/**
 * Generate podcast cover image from Telegram channel profile photo.
 * This will scrape the channel's public page and process the image.
 *
 * @param podcastId - The ID of the podcast (null if in creation mode)
 * @param options - Generation options (style, variations, telegramChannel)
 * @returns Result containing base64 image data (not uploaded to S3 until form save)
 */
export async function generatePodcastImageFromTelegram(
  podcastId: string | null,
  options?: ImageGenerationOptions & { telegramChannel?: string; podcastTitle?: string }
): Promise<ImageActionResult> {
  try {
    // Require admin authentication
    await requireAdmin();
    const user = await SessionService.getUser();

    console.log(`[IMAGE_TELEGRAM] Generating image for podcast ${podcastId || 'new'}`);

    let telegramChannel: string | undefined;
    let podcastTitle: string | undefined;

    // If podcast exists, fetch from DB
    if (podcastId) {
      const [podcast] = await db
        .select()
        .from(podcasts)
        .where(eq(podcasts.id, podcastId))
        .limit(1);

      if (!podcast) {
        return {
          success: false,
          error: 'Podcast not found'
        };
      }

      const [config] = await db
        .select()
        .from(podcastConfigs)
        .where(eq(podcastConfigs.podcast_id, podcastId))
        .limit(1);

      telegramChannel = config?.telegram_channel || undefined;
      podcastTitle = podcast.title;
    } else {
      // Creation mode - use values from options
      telegramChannel = options?.telegramChannel;
      podcastTitle = options?.podcastTitle || 'My Podcast';
    }

    if (!telegramChannel) {
      return {
        success: false,
        error: 'No Telegram channel configured for this podcast'
      };
    }

    // Fetch image from Telegram
    console.log(`[IMAGE_TELEGRAM] Fetching image from Telegram channel: ${telegramChannel}`);
    const telegramResult = await getTelegramChannelImage(telegramChannel);

    if (!telegramResult.success || !telegramResult.imageBuffer) {
      return {
        success: false,
        error: telegramResult.error || 'Failed to fetch channel image'
      };
    }

    // Enhance and return base64 (no S3 upload until form save)
    return await enhanceImageWithAI(
      telegramResult.imageBuffer,
      podcastTitle,
      options,
      undefined, // No episode ID in podcast creation
      podcastId || undefined,
      user?.id
    );
  } catch (error) {
    console.error('[IMAGE_TELEGRAM] Error generating podcast image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Refresh podcast cover image by re-fetching from Telegram.
 * This is useful when the channel's profile photo has been updated.
 *
 * @param podcastId - The ID of the podcast
 * @returns Result containing base64 image data
 */
export async function refreshPodcastImage(
  podcastId: string
): Promise<ImageActionResult> {
  // Same as generatePodcastImageFromTelegram but with explicit "refresh" semantics
  return generatePodcastImageFromTelegram(podcastId);
}
