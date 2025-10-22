'use server';

/**
 * Generate podcast cover image from uploaded file.
 * Accepts base64-encoded image data from file upload.
 */

import { requireAdmin, getUser } from '@/lib/auth';
import { enhanceImageWithAI } from './shared';
import type { ImageActionResult, ImageGenerationOptions } from './types';

/**
 * Generate podcast cover image from uploaded file.
 * Processes the uploaded image and optionally enhances it with AI.
 *
 * @param podcastId - The ID of the podcast (null if in creation mode)
 * @param base64Image - The image data as base64 string
 * @param mimeType - The MIME type of the image
 * @param podcastTitle - The title of the podcast
 * @param options - Generation options (style, variations)
 * @returns Result containing base64 image data (not uploaded to S3 until form save)
 */
export async function generatePodcastImageFromFile(
  podcastId: string | null,
  base64Image: string,
  mimeType: string,
  podcastTitle: string,
  options?: ImageGenerationOptions
): Promise<ImageActionResult> {
  try {
    await requireAdmin();
    const user = await getUser();

    console.log(`[IMAGE_FILE] Generating image from uploaded file for podcast ${podcastId || 'new'}`);

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');

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
    console.error('[IMAGE_FILE] Error generating from file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
