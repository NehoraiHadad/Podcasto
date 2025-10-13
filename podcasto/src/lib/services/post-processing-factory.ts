import { AIService, AIServiceConfig } from '../ai';
import { createS3Service } from './s3-service';
import type { S3ServiceConfig } from './s3-service-types';
import { PostProcessingService, Episode } from './post-processing';
import { EpisodeUpdater } from './episode-updater';
import { episodesApi } from '../db/api';

/**
 * Create a post-processing service with the specified configuration
 */
export function createPostProcessingService(config: {
  s3: Partial<S3ServiceConfig>;
  ai: AIServiceConfig;
}): PostProcessingService {
  if (!config.s3) throw new Error('s3 config is required');
  if (!config.ai) throw new Error('ai config is required');
  if (!config.ai.apiKey) throw new Error('aiService is required');

  const s3Service = createS3Service(config.s3);
  const aiService = new AIService(config.ai);

  return new PostProcessingService({ s3Service, aiService });
}

/**
 * Create a limited post-processing service for image generation only (no S3)
 */
export function createImageOnlyService(config: {
  ai: AIServiceConfig;
}): Pick<PostProcessingService, 'generateEpisodeImagePreview' | 'generateImagePrompt'> {
  if (!config.ai) throw new Error('ai config is required');
  if (!config.ai.apiKey) throw new Error('aiService is required');

  const aiService = new AIService(config.ai);

  return {
    async generateImagePrompt(summary: string, title?: string): Promise<string> {
      const { ImageGenerationService } = await import('./image-generation');
      const imageService = new ImageGenerationService(aiService);
      return imageService.generateImagePrompt(summary, title);
    },

    async generateEpisodeImagePreview(
      summary: string,
      title?: string
    ): Promise<{
      success: boolean;
      imageData: Buffer | null;
      mimeType: string;
      generatedFromPrompt?: string;
      error?: string;
    }> {
      try {
        const { ImageGenerationService } = await import('./image-generation');
        const imageService = new ImageGenerationService(aiService);
        const result = await imageService.generateImagePreview(summary, title);
        return {
          success: !!result.imageData,
          imageData: result.imageData,
          mimeType: result.mimeType,
          generatedFromPrompt: result.generatedFromPrompt,
        };
      } catch (error) {
        return {
          success: false,
          imageData: null,
          mimeType: 'image/jpeg',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}

/**
 * Create a limited post-processing service for S3 operations only (no AI)
 */
export function createS3OnlyService(config: {
  s3: Partial<S3ServiceConfig>;
}): Pick<PostProcessingService, 'saveGeneratedImage'> {
  if (!config.s3) throw new Error('s3 config is required');

  const s3Service = createS3Service(config.s3);
  const episodeUpdater = new EpisodeUpdater();

  return {
    async saveGeneratedImage(
      podcastId: string,
      episodeId: string,
      imageData: Buffer,
      mimeType: string,
      _episode: Episode,
      _generatedFromPrompt?: string
    ): Promise<{
      success: boolean;
      imageUrl?: string;
      error?: string;
    }> {
      try {
        console.log(`[S3_SERVICE] Saving generated image for episode ${episodeId}`);

        const episode = await episodesApi.getEpisodeById(episodeId);
        if (!episode) throw new Error('Episode not found');

        const uploadResult = await s3Service.uploadImageToS3(
          podcastId,
          episodeId,
          imageData,
          mimeType
        );

        if (uploadResult.error || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Failed to upload image to S3');
        }

        console.log(`[S3_SERVICE] Uploaded image to S3: ${uploadResult.url}`);

        await episodeUpdater.updateEpisodeWithImage(
          episodeId,
          uploadResult.url,
          episode.description || undefined
        );

        return { success: true, imageUrl: uploadResult.url };
      } catch (error) {
        console.error(`[S3_SERVICE] Error saving generated image:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}
