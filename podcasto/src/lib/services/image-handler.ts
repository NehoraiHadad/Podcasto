import { episodesApi } from '../db/api';
import { S3StorageUtils } from './storage-utils';
import { EpisodeUpdater } from './episode-updater';
import { ImageGenerationService } from './image-generation';

/**
 * Handler for image operation tasks
 */
export class ImageHandler {
  private storageUtils: S3StorageUtils;
  private episodeUpdater: EpisodeUpdater;
  private imageService: ImageGenerationService;

  /**
   * Initialize the image handler
   */
  constructor(
    storageUtils: S3StorageUtils,
    episodeUpdater: EpisodeUpdater,
    imageService: ImageGenerationService
  ) {
    this.storageUtils = storageUtils;
    this.episodeUpdater = episodeUpdater;
    this.imageService = imageService;
  }

  /**
   * Generate image prompt
   */
  async generateImagePrompt(summary: string, title?: string): Promise<string> {
    return this.imageService.generateImagePrompt(summary, title);
  }

  /**
   * Generate image preview (doesn't save to S3)
   */
  async generateImagePreview(summary: string, title?: string): Promise<{ 
    success: boolean;
    imageData: Buffer | null;
    mimeType: string;
    error?: string;
    generatedFromPrompt?: string;
  }> {
    return this.imageService.generateImagePreview(summary, title);
  }

  /**
   * Save generated image to S3 and update episode record
   */
  async saveGeneratedImage(
    episodeId: string, 
    podcastId: string, 
    imageData: Buffer, 
    mimeType: string
  ): Promise<{
    success: boolean;
    imageUrl?: string;
    error?: string;
  }> {
    try {
      console.log(`[IMAGE_HANDLER] Saving generated image for episode ${episodeId}`);
      
      // Get the episode to save its original description
      const episode = await episodesApi.getEpisodeById(episodeId);
      
      if (!episode) {
        throw new Error('Episode not found');
      }
      
      // Upload image to S3
      const imageUrl = await this.storageUtils.uploadImageToS3(
        podcastId, 
        episodeId, 
        imageData, 
        mimeType
      );
      console.log(`[IMAGE_HANDLER] Uploaded image to S3: ${imageUrl}`);
      
      // Update episode with image URL
      await this.episodeUpdater.updateEpisodeWithImage(
        episodeId, 
        imageUrl, 
        episode.description || undefined
      );
      
      return {
        success: true,
        imageUrl
      };
    } catch (error) {
      console.error(`[IMAGE_HANDLER] Error saving generated image:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate and save episode image (complete process)
   */
  async generateEpisodeImage(
    episodeId: string, 
    podcastId: string, 
    summary: string
  ): Promise<boolean> {
    try {
      console.log(`[IMAGE_HANDLER] Generating image for episode ${episodeId}`);
      
      // Get episode info to include title 
      const episode = await episodesApi.getEpisodeById(episodeId);
      const title = episode?.title || undefined;
      
      // Generate image preview first
      const previewResult = await this.generateImagePreview(summary, title);
      
      // If generation was successful, save it
      if (previewResult.success && previewResult.imageData) {
        const saveResult = await this.saveGeneratedImage(
          episodeId,
          podcastId,
          previewResult.imageData,
          previewResult.mimeType
        );
        
        return saveResult.success;
      } else {
        console.warn(`[IMAGE_HANDLER] No image was generated for episode ${episodeId}: ${previewResult.error}`);
        
        // Mark as published even without image (episode is still complete)
        await this.episodeUpdater.markEpisodeAsPublished(episodeId);
        
        return false;
      }
    } catch (error) {
      console.error(`[IMAGE_HANDLER] Error generating image for episode ${episodeId}:`, error);
      
      // Update episode metadata with error info but don't mark as failed
      await this.episodeUpdater.trackImageGenerationError(episodeId, error);
      
      return false;
    }
  }
}

/**
 * Create an image handler
 */
export function createImageHandler(
  storageUtils: S3StorageUtils,
  episodeUpdater: EpisodeUpdater,
  imageService: ImageGenerationService
): ImageHandler {
  return new ImageHandler(storageUtils, episodeUpdater, imageService);
} 