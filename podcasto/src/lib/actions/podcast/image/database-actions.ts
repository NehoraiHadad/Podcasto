'use server';

/**
 * Database operations for podcast images.
 * Handles updating and deleting image references in the database.
 */

import { requireAdmin } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { podcasts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePodcast } from '@/lib/actions/shared/server';
import type { ImageActionResult } from './types';

/**
 * Delete podcast cover image from database.
 * Note: Does not delete from S3 to avoid breaking cached references.
 * S3 objects can be cleaned up via a separate lifecycle policy.
 *
 * @param podcastId - The ID of the podcast
 * @returns Success status or error message
 */
export async function deletePodcastImage(
  podcastId: string
): Promise<ImageActionResult> {
  try {
    await requireAdmin();

    console.log(`[IMAGE_DB] Deleting image for podcast ${podcastId}`);

    // Update database to remove image URL
    await db
      .update(podcasts)
      .set({
        cover_image: null,
        updated_at: new Date()
      })
      .where(eq(podcasts.id, podcastId));

    // Revalidate pages
    await revalidatePodcast(podcastId);

    return {
      success: true
    };
  } catch (error) {
    console.error('[IMAGE_DB] Error deleting podcast image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Set podcast image URL directly in database.
 * This is useful for manually specifying an image URL.
 *
 * @param podcastId - The ID of the podcast
 * @param imageUrl - The URL to set as the cover image
 * @returns Success status and image URL or error message
 */
export async function setPodcastImageFromUrl(
  podcastId: string,
  imageUrl: string
): Promise<ImageActionResult> {
  try {
    await requireAdmin();

    console.log(`[IMAGE_DB] Setting image URL for podcast ${podcastId}: ${imageUrl}`);

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return {
        success: false,
        error: 'Invalid URL format'
      };
    }

    // Update database
    await db
      .update(podcasts)
      .set({
        cover_image: imageUrl,
        updated_at: new Date()
      })
      .where(eq(podcasts.id, podcastId));

    // Revalidate pages
    await revalidatePodcast(podcastId);

    return {
      success: true,
      imageUrl
    };
  } catch (error) {
    console.error('[IMAGE_DB] Error setting podcast image URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
