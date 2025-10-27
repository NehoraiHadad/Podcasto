'use server';

import { episodesApi } from '@/lib/db/api';
import { requireAdmin } from '@/lib/auth';
import { errorToString, logError } from '@/lib/utils/error-utils';
import { revalidateEpisodePaths } from '@/lib/utils/revalidation-utils';
import { createPostProcessingWithConfig } from '@/lib/utils/post-processing-utils';

/**
 * Manually generate an image for an episode based on its description
 * This is a server action that requires admin permissions
 */
export async function generateEpisodeImage(episodeId: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  // Ensure the user is an admin
  await requireAdmin();
  
  try {
    // Get the episode
    const episode = await episodesApi.getEpisodeById(episodeId);
    
    if (!episode) {
      throw new Error('Episode not found');
    }
    
    if (!episode.podcast_id) {
      throw new Error('Episode has no associated podcast');
    }
    
    if (!episode.description) {
      throw new Error('Episode has no description for image generation');
    }
    
    // Create full post-processing service with both S3 and AI config
    const postProcessingService = await createPostProcessingWithConfig(true, true);
    
    // Type-safe check: full service has generateEpisodeImage method
    if (!('generateEpisodeImage' in postProcessingService)) {
      throw new Error('Service does not support full episode image generation');
    }
    
    // TypeScript now knows this is the full service with all methods
    const fullService = postProcessingService as Extract<typeof postProcessingService, { generateEpisodeImage: unknown }>;
    
    // Generate the image with properly typed service
    const success = await (fullService.generateEpisodeImage as (
      podcastId: string,
      episodeId: string,
      description: string
    ) => Promise<boolean>)(
      episode.podcast_id,
      episodeId,
      episode.description
    );
    
    if (success) {
      // Refresh the episode data to get the updated cover_image URL
      const updatedEpisode = await episodesApi.getEpisodeById(episodeId);
      
      // Revalidate paths
      revalidateEpisodePaths(episodeId, episode.podcast_id);
      
      return { 
        success: true,
        imageUrl: updatedEpisode?.cover_image || undefined
      };
    } else {
      return { 
        success: false,
        error: 'Failed to generate image'
      };
    }
  } catch (error) {
    logError('generateEpisodeImage', error);
    return { 
      success: false,
      error: errorToString(error)
    };
  }
} 