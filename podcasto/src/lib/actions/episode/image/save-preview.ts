'use server';

import { episodesApi } from '@/lib/db/api';
import { requireAdmin } from '@/lib/auth';
import { errorToString, logError } from '@/lib/utils/error-utils';
import { revalidateEpisodePaths } from '@/lib/utils/revalidation-utils';
import { createPostProcessingWithConfig, extractImageDataFromUrl } from '@/lib/utils/post-processing-utils';

/**
 * Save a generated image preview to S3 and update the episode
 * This is a server action that requires admin permissions
 */
export async function saveEpisodeImagePreview(
  episodeId: string,
  imageDataUrl: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
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
    
    // Extract binary data from data URL
    const imageData = await extractImageDataFromUrl(imageDataUrl);
    
    if (!imageData) {
      throw new Error('Invalid image data URL format');
    }
    
    const { mimeType, buffer } = imageData;
    
    // Create post-processing service with S3 config (AI not needed for saving)
    const postProcessingService = await createPostProcessingWithConfig(false, true);
    
    // Type guard to ensure we have the correct service type
    if (!('saveGeneratedImage' in postProcessingService)) {
      throw new Error('Service does not support image saving');
    }
    
    // TypeScript now knows this service has saveGeneratedImage method
    const storageService = postProcessingService as Extract<typeof postProcessingService, { saveGeneratedImage: unknown }>;
    
    // Save the image
    const saveResult = await storageService.saveGeneratedImage(
      episode.podcast_id,
      episodeId,
      buffer,
      mimeType,
      episode
    );
    
    if (saveResult.success) {
      // Revalidate paths
      revalidateEpisodePaths(episodeId, episode.podcast_id);
      
      return { 
        success: true,
        imageUrl: saveResult.imageUrl
      };
    } else {
      return { 
        success: false,
        error: saveResult.error || 'Failed to save image'
      };
    }
  } catch (error) {
    logError('saveEpisodeImagePreview', error);
    return { 
      success: false,
      error: errorToString(error)
    };
  }
} 