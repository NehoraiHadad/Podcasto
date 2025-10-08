'use server';

import { db } from '@/lib/db';
import { podcasts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './schemas';

/**
 * Toggle the pause state of a podcast
 * When paused, the cron job will skip this podcast for automatic episode generation
 *
 * @param podcastId - The ID of the podcast to toggle
 * @returns ActionResponse with the new pause state
 */
export async function togglePodcastPause(
  podcastId: string
): Promise<ActionResponse & { isPaused?: boolean }> {
  try {
    // Validate podcast ID
    if (!podcastId) {
      return { success: false, error: 'Podcast ID is required' };
    }

    // Get current podcast state
    const [podcast] = await db
      .select()
      .from(podcasts)
      .where(eq(podcasts.id, podcastId))
      .limit(1);

    if (!podcast) {
      return { success: false, error: 'Podcast not found' };
    }

    // Toggle pause state
    const newPausedState = !podcast.is_paused;

    console.log(`[PODCAST_PAUSE] Toggling pause for podcast ${podcastId}: ${podcast.is_paused} → ${newPausedState}`);

    // Update database
    await db
      .update(podcasts)
      .set({
        is_paused: newPausedState,
        updated_at: new Date()
      })
      .where(eq(podcasts.id, podcastId));

    console.log(`[PODCAST_PAUSE] Successfully ${newPausedState ? 'paused' : 'resumed'} podcast ${podcastId}`);

    // Revalidate relevant pages
    revalidatePath('/admin/podcasts');
    revalidatePath(`/admin/podcasts/${podcastId}`);

    return {
      success: true,
      isPaused: newPausedState
    };
  } catch (error) {
    console.error('[PODCAST_PAUSE] Error toggling podcast pause:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update podcast status'
    };
  }
}
