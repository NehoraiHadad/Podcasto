/**
 * Post-Processing Service Interfaces
 * Type-safe contracts for individual post-processing services
 */

import type { TitleGenerationOptions, SummaryGenerationOptions } from '@/lib/ai/types';
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
 * Title Generation Service Interface
 * Generates engaging episode titles from transcript content
 */
export interface ITitleGenerationService {
  /**
   * Generate a title for an episode based on its transcript
   * @param transcript - Full transcript of the episode
   * @param options - Configuration options for title generation
   * @returns Generated title string
   * @throws Error if transcript is empty or generation fails
   */
  generateTitle(transcript: string, options: TitleGenerationOptions): Promise<string>;
}

/**
 * Summary Generation Service Interface
 * Generates concise episode summaries from transcript content
 */
export interface ISummaryGenerationService {
  /**
   * Generate a summary for an episode based on its transcript
   * @param transcript - Full transcript of the episode
   * @param options - Configuration options for summary generation
   * @returns Generated summary string
   * @throws Error if transcript is empty or generation fails
   */
  generateSummary(transcript: string, options: SummaryGenerationOptions): Promise<string>;
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
