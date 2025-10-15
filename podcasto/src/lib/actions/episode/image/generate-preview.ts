'use server';

import { episodesApi } from '@/lib/db/api';
import { requireAdmin } from '@/lib/auth';
import { errorToString, logError } from '@/lib/utils/error-utils';
import { createPostProcessingWithConfig, extractEpisodeDescription } from '@/lib/utils/post-processing-utils';

/**
 * Generate a preview image for an episode based on its description without saving it
 * This is a server action that requires admin permissions
 */
export async function generateEpisodeImagePreview(
  episodeId: string
): Promise<{ 
  success: boolean; 
  imageDataUrl?: string; 
  error?: string;
  episodeDescription?: string;
  generatedFromPrompt?: string;
}> {
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
    
    // Extract usable description for image generation
    const description = await extractEpisodeDescription(episode);
    
    // Still no usable description
    if (!description) {
      throw new Error('Episode has no description for image generation');
    }
    
    // Create post-processing service with AI config only (no S3 needed for preview)
    const postProcessingService = await createPostProcessingWithConfig(true, false);
    
    // Get the episode title
    const title = episode.title || undefined;
    
    // Type guard to ensure we have the correct service type
    if (!('generateEpisodeImagePreview' in postProcessingService)) {
      throw new Error('Service does not support image preview generation');
    }
    
    // TypeScript now knows this service has generateEpisodeImagePreview method
    const imageService = postProcessingService as Extract<typeof postProcessingService, { generateEpisodeImagePreview: unknown }>;
    
    // Generate the image preview
    const previewResult = await imageService.generateEpisodeImagePreview(
      description,
      title
    );
    
    if (previewResult.success && previewResult.imageData) {
      // Convert image data to a base64 data URL for preview
      const base64Data = previewResult.imageData.toString('base64');
      const dataUrl = `data:${previewResult.mimeType};base64,${base64Data}`;
      
      return { 
        success: true,
        imageDataUrl: dataUrl,
        episodeDescription: description,
        generatedFromPrompt: previewResult.generatedFromPrompt
      };
    } else {
      return { 
        success: false,
        error: previewResult.error || 'Failed to generate image preview',
        episodeDescription: description,
        generatedFromPrompt: previewResult.generatedFromPrompt
      };
    }
  } catch (error) {
    logError('generateEpisodeImagePreview', error);
    return { 
      success: false,
      error: errorToString(error)
    };
  }
} 