'use server';

/**
 * Generate podcast cover image from URL.
 * Downloads image from provided URL and processes it.
 */

import { requireAdmin, SessionService } from '@/lib/auth/server';
import { enhanceImageWithAI } from './shared';
import type { ImageActionResult, ImageGenerationOptions } from './types';

/**
 * Generate podcast cover image from URL.
 * Downloads the image from the provided URL and processes it.
 *
 * @param podcastId - The ID of the podcast (null if in creation mode)
 * @param imageUrl - The URL of the image to download
 * @param podcastTitle - The title of the podcast
 * @param options - Generation options (style, variations)
 * @returns Result containing base64 image data (not uploaded to S3 until form save)
 */
export async function generatePodcastImageFromUrl(
  podcastId: string | null,
  imageUrl: string,
  podcastTitle: string,
  options?: ImageGenerationOptions
): Promise<ImageActionResult> {
  try {
    await requireAdmin();
    const user = await SessionService.getUser();

    console.log(`[IMAGE_URL] Generating image from URL for podcast ${podcastId || 'new'}: ${imageUrl}`);

    // Validate URL
    try {
      new URL(imageUrl);
    } catch {
      return {
        success: false,
        error: 'Invalid URL format'
      };
    }

    // Download image from URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download image: ${response.statusText}`
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return {
        success: false,
        error: 'URL does not point to an image'
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Enhance and return base64 (no S3 upload until form save)
    return await enhanceImageWithAI(
      imageBuffer,
      podcastTitle,
      options,
      undefined, // No episode ID in podcast creation
      podcastId || undefined,
      user?.id
    );
  } catch (error) {
    console.error('[IMAGE_URL] Error generating from URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
