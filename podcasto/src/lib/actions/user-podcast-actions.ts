'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { podcastsApi, podcastConfigsApi } from '@/lib/db/api';
import type { ActionResult } from './shared/types';
import { errorResult } from './shared/error-handler';

/**
 * User Podcast Actions
 * Server actions for users to manage their own podcasts
 */

interface UpdatePodcastData {
  title?: string;
  description?: string;
  coverImage?: string;
  episodeFrequency?: number;
  autoGenerationEnabled?: boolean;
}

/**
 * Update a user's podcast (ownership validated)
 */
export async function updateUserPodcastAction(
  podcastId: string,
  data: UpdatePodcastData
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth();

    // Verify podcast ownership
    const podcast = await podcastsApi.getPodcastById(podcastId);
    if (!podcast) {
      return {
        success: false,
        error: 'Podcast not found'
      };
    }

    if (podcast.created_by !== user.id) {
      return {
        success: false,
        error: 'You can only update your own podcasts'
      };
    }

    // Update podcast metadata
    if (data.title || data.description !== undefined || data.coverImage !== undefined) {
      await podcastsApi.updatePodcast(podcastId, {
        title: data.title,
        description: data.description,
        cover_image: data.coverImage,
        updated_at: new Date()
      });
    }

    // Update auto-generation setting
    if (data.autoGenerationEnabled !== undefined) {
      const updateData: {
        auto_generation_enabled: boolean;
        next_scheduled_generation?: Date | null;
      } = {
        auto_generation_enabled: data.autoGenerationEnabled
      };

      // If enabling auto-generation, calculate next scheduled time
      if (data.autoGenerationEnabled && data.episodeFrequency) {
        const nextScheduled = new Date();
        nextScheduled.setDate(nextScheduled.getDate() + data.episodeFrequency);
        updateData.next_scheduled_generation = nextScheduled;
      } else if (!data.autoGenerationEnabled) {
        updateData.next_scheduled_generation = null;
      }

      await podcastsApi.updatePodcast(podcastId, updateData);
    }

    // Update episode frequency in config
    if (data.episodeFrequency) {
      await podcastConfigsApi.updatePodcastConfig(podcastId, {
        episode_frequency: data.episodeFrequency
      });
    }

    // Revalidate pages
    revalidatePath('/podcasts/my');
    revalidatePath(`/podcasts/${podcastId}/settings`);

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('[updateUserPodcastAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to update podcast');
  }
}

/**
 * Delete a user's podcast (ownership validated)
 */
export async function deleteUserPodcastAction(
  podcastId: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth();

    // Verify podcast ownership
    const podcast = await podcastsApi.getPodcastById(podcastId);
    if (!podcast) {
      return {
        success: false,
        error: 'Podcast not found'
      };
    }

    if (podcast.created_by !== user.id) {
      return {
        success: false,
        error: 'You can only delete your own podcasts'
      };
    }

    // Delete the podcast (cascade will handle episodes and config)
    await podcastsApi.deletePodcast(podcastId);

    // Revalidate pages
    revalidatePath('/podcasts/my');

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('[deleteUserPodcastAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to delete podcast');
  }
}

/**
 * Pause a user's podcast (ownership validated)
 */
export async function pauseUserPodcastAction(
  podcastId: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth();

    // Verify podcast ownership
    const podcast = await podcastsApi.getPodcastById(podcastId);
    if (!podcast) {
      return {
        success: false,
        error: 'Podcast not found'
      };
    }

    if (podcast.created_by !== user.id) {
      return {
        success: false,
        error: 'You can only pause your own podcasts'
      };
    }

    // Pause the podcast
    await podcastsApi.updatePodcast(podcastId, {
      is_paused: true,
      updated_at: new Date()
    });

    // Revalidate pages
    revalidatePath('/podcasts/my');
    revalidatePath(`/podcasts/${podcastId}/settings`);

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('[pauseUserPodcastAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to pause podcast');
  }
}

/**
 * Resume a user's podcast (ownership validated)
 */
export async function resumeUserPodcastAction(
  podcastId: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth();

    // Verify podcast ownership
    const podcast = await podcastsApi.getPodcastById(podcastId);
    if (!podcast) {
      return {
        success: false,
        error: 'Podcast not found'
      };
    }

    if (podcast.created_by !== user.id) {
      return {
        success: false,
        error: 'You can only resume your own podcasts'
      };
    }

    // Resume the podcast
    await podcastsApi.updatePodcast(podcastId, {
      is_paused: false,
      updated_at: new Date()
    });

    // Revalidate pages
    revalidatePath('/podcasts/my');
    revalidatePath(`/podcasts/${podcastId}/settings`);

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('[resumeUserPodcastAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to resume podcast');
  }
}
