/**
 * Post-Processing Service Interfaces
 * Type-safe contracts for individual post-processing services
 */

import type { ImagePreviewResult } from './post-processing-types.interface';

/**
 * Transcript Service Interface
 * Handles transcript retrieval and preprocessing
 */
export interface ITranscriptService {
  /**
   * Get transcript for an episode with retry logic
   * Uses exponential backoff to handle transient S3 errors
   * @param podcastId - Podcast identifier
   * @param episodeId - Episode identifier
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Preprocessed transcript text
   * @throws Error if transcript cannot be retrieved after all retries
   */
  getTranscriptWithRetry(
    podcastId: string,
    episodeId: string,
    maxRetries?: number
  ): Promise<string>;

  /**
   * Preprocess transcript for better AI analysis
   * Removes redundant whitespace and limits length
   * @param transcript - Raw transcript text
   * @param maxLength - Maximum length in characters (default: 15000)
   * @returns Preprocessed transcript text
   */
  preprocessTranscript(transcript: string, maxLength?: number): string;
}

/**
 * Image Generation Service Interface
 * Generates podcast cover images from descriptions
 */
export interface IImageGenerationService {
  /**
   * Generate a detailed image prompt using AI model
   * @param summary - Episode summary
   * @param title - Optional episode title
   * @returns Enhanced image generation prompt
   * @throws Error if prompt generation fails
   */
  generateImagePrompt(summary: string, title?: string): Promise<string>;

  /**
   * Generate image for an episode but don't upload (for preview)
   * @param summary - Episode summary
   * @param title - Optional episode title
   * @returns Image preview result with buffer and metadata
   */
  generateImagePreview(summary: string, title?: string): Promise<ImagePreviewResult>;
}
