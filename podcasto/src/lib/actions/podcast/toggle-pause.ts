'use server';

import { db } from '@/lib/db';
import { podcasts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ActionResponse } from './schemas';
import { createErrorResponse } from '@/lib/utils/error-utils';
import { createLogger } from '@/lib/utils/logger';
import { revalidatePodcast } from '@/lib/actions/shared/server';

const logger = createLogger('PODCAST_PAUSE');

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

    logger.info('Toggling pause state', {
      podcastId,
      oldState: podcast.is_paused,
      newState: newPausedState,
    });

    // Update database
    await db
      .update(podcasts)
      .set({
        is_paused: newPausedState,
        updated_at: new Date(),
      })
      .where(eq(podcasts.id, podcastId));

    logger.info(`Successfully ${newPausedState ? 'paused' : 'resumed'} podcast`, {
      podcastId,
    });

    // Revalidate relevant pages
    revalidatePodcast(podcastId);

    return {
      success: true,
      isPaused: newPausedState,
    };
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to update podcast status',
      'PODCAST_PAUSE'
    );
  }
}
