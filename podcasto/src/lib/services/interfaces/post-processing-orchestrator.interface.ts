/**
 * Post-Processing Orchestrator Interface
 * Type-safe contract for the main post-processing coordinator
 */

import type {
  Episode,
  PostProcessingResult,
  ImagePreviewResult,
  ImageSaveResult,
} from './post-processing-types.interface';

/**
 * Post-Processing Orchestrator Interface
 * Coordinates the complete post-processing workflow for episodes
 */
export interface IPostProcessingOrchestrator {
  /**
   * Process a completed episode with transcript
   * Generates title, summary, and cover image
   * @param podcastId - Podcast identifier
   * @param episodeId - Episode identifier
   * @param options - Processing options
   * @param userId - Optional user ID for cost tracking
   * @returns Processing result with updated episode data
   */
  processCompletedEpisode(
    podcastId: string,
    episodeId: string,
    options?: {
      forceReprocess?: boolean;
      skipTitleGeneration?: boolean;
      skipSummaryGeneration?: boolean;
      skipImageGeneration?: boolean;
    },
    userId?: string
  ): Promise<PostProcessingResult>;

  /**
   * Generate image prompt from summary
   * @param summary - Episode summary
   * @param title - Optional episode title
   * @returns Generated image prompt
   */
  generateImagePrompt(summary: string, title?: string): Promise<string>;

  /**
   * Generate episode image preview (doesn't save)
   * @param summary - Episode summary
   * @param title - Optional episode title
   * @param episodeId - Optional episode ID for cost tracking
   * @param podcastId - Optional podcast ID for cost tracking
   * @param userId - Optional user ID for cost tracking
   * @returns Image preview result
   */
  generateEpisodeImagePreview(
    summary: string,
    title?: string,
    episodeId?: string,
    podcastId?: string,
    userId?: string
  ): Promise<ImagePreviewResult>;

  /**
   * Save generated image to S3 and update episode
   * @param podcastId - Podcast identifier
   * @param episodeId - Episode identifier
   * @param imageData - Image buffer
   * @param mimeType - Image MIME type
   * @param episode - Episode object
   * @param generatedFromPrompt - Optional prompt used for generation
   * @returns Save result with image URL
   */
  saveGeneratedImage(
    podcastId: string,
    episodeId: string,
    imageData: Buffer,
    mimeType: string,
    episode: Episode,
    generatedFromPrompt?: string
  ): Promise<ImageSaveResult>;

  /**
   * Generate episode image and save (complete process)
   * @param podcastId - Podcast identifier
   * @param episodeId - Episode identifier
   * @param episodeOrDescription - Episode object or description string
   * @param force - Force regeneration even if image exists
   * @returns Success status
   */
  generateEpisodeImage(
    podcastId: string,
    episodeId: string,
    episodeOrDescription: Episode | string,
    force?: boolean
  ): Promise<boolean>;
}
