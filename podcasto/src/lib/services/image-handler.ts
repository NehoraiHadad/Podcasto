import { episodesApi } from '../db/api';
import type { IS3Service, IEpisodeUpdater, IImageGenerationService, IImageHandler } from './interfaces';

/**
 * Handler for image operation tasks
 * Orchestrates image generation, storage, and episode updates
 */
export class ImageHandler implements IImageHandler {
  private s3Service: IS3Service;
  private episodeUpdater: IEpisodeUpdater;
  private imageService: IImageGenerationService;

  /**
   * Initialize the image handler with dependency injection
   *
   * @param s3Service - The S3 service for storage operations
   * @param episodeUpdater - The episode updater service
   * @param imageService - The image generation service
   */
  constructor(
    s3Service: IS3Service,
    episodeUpdater: IEpisodeUpdater,
    imageService: IImageGenerationService
  ) {
    if (!s3Service) {
      throw new Error('S3Service is required for ImageHandler');
    }
    if (!episodeUpdater) {
      throw new Error('EpisodeUpdater is required for ImageHandler');
    }
    if (!imageService) {
      throw new Error('ImageGenerationService is required for ImageHandler');
    }
    this.s3Service = s3Service;
    this.episodeUpdater = episodeUpdater;
    this.imageService = imageService;
  }

  /**
   * Generate image prompt
   */
  async generateImagePrompt(
    summary: string,
    title?: string,
    episodeId?: string,
    podcastId?: string,
    userId?: string
  ): Promise<string> {
    return this.imageService.generateImagePrompt(summary, title, episodeId, podcastId, userId);
  }

  /**
   * Generate image preview (doesn't save to S3)
   */
  async generateImagePreview(
    summary: string,
    title?: string,
    episodeId?: string,
    podcastId?: string,
    userId?: string
  ): Promise<{
    success: boolean;
    imageData: Buffer | null;
    mimeType: string;
    error?: string;
    generatedFromPrompt?: string;
  }> {
    return this.imageService.generateImagePreview(summary, title, episodeId, podcastId, userId);
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
      const uploadResult = await this.s3Service.uploadImageToS3(
        podcastId,
        episodeId,
        imageData,
        mimeType
      );

      if (uploadResult.error || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload image to S3');
      }

      console.log(`[IMAGE_HANDLER] Uploaded image to S3: ${uploadResult.url}`);

      // Update episode with image URL
      await this.episodeUpdater.updateEpisodeWithImage(
        episodeId,
        uploadResult.url,
        episode.description || undefined
      );

      return {
        success: true,
        imageUrl: uploadResult.url
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
    summary: string,
    userId?: string
  ): Promise<boolean> {
    try {
      console.log(`[IMAGE_HANDLER] Generating image for episode ${episodeId}`);

      // Get episode info to include title
      const episode = await episodesApi.getEpisodeById(episodeId);
      const title = episode?.title || undefined;

      // Generate image preview first with episodeId and podcastId for cost tracking
      const previewResult = await this.generateImagePreview(summary, title, episodeId, podcastId, userId);

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
 * Factory function to create an image handler
 *
 * @param s3Service - The S3 service instance to inject
 * @param episodeUpdater - The episode updater service instance
 * @param imageService - The image generation service instance
 * @returns IImageHandler interface implementation
 */
export function createImageHandler(
  s3Service: IS3Service,
  episodeUpdater: IEpisodeUpdater,
  imageService: IImageGenerationService
): IImageHandler {
  if (!s3Service || !episodeUpdater || !imageService) {
    throw new Error('All dependencies are required for ImageHandler');
  }
  return new ImageHandler(s3Service, episodeUpdater, imageService);
} 