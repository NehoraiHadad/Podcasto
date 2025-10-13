/**
 * Episode Service Interfaces
 * Type-safe contracts for episode metadata and status management
 */

/**
 * Episode Updater Interface
 * Handles episode status transitions and metadata updates
 */
export interface IEpisodeUpdater {
  /**
   * Update episode with newly generated title and summary
   * Sets status to 'summary_completed' (intermediate status)
   * @param episodeId - Episode identifier
   * @param title - Generated episode title
   * @param summary - Generated episode summary
   * @returns Promise that resolves when update is complete
   * @throws Error if episode update fails
   */
  updateEpisodeWithSummary(episodeId: string, title: string, summary: string): Promise<void>;

  /**
   * Mark episode as processed without an image
   * Sets status to 'processed' (final status)
   * @param episodeId - Episode identifier
   * @returns Promise that resolves when update is complete
   * @throws Error if episode update fails
   */
  markEpisodeAsProcessed(episodeId: string): Promise<void>;

  /**
   * Mark episode as published with timestamp
   * Sets status to 'published' and adds published_at timestamp
   * @param episodeId - Episode identifier
   * @returns Promise that resolves when update is complete
   * @throws Error if episode update fails
   */
  markEpisodeAsPublished(episodeId: string): Promise<void>;

  /**
   * Mark episode as failed with error message
   * Sets status to 'failed' and stores error in description
   * Non-throwing: logs error if update itself fails
   * @param episodeId - Episode identifier
   * @param error - Error object or message
   * @returns Promise that resolves when update is complete or fails
   */
  markEpisodeAsFailed(episodeId: string, error: unknown): Promise<void>;

  /**
   * Track image generation errors in episode metadata
   * Updates metadata JSON with error details but keeps status as 'processed'
   * Non-throwing: logs error if update itself fails
   * @param episodeId - Episode identifier
   * @param error - Error object or message
   * @returns Promise that resolves when update is complete or fails
   */
  trackImageGenerationError(episodeId: string, error: unknown): Promise<void>;

  /**
   * Update episode with cover image URL
   * Sets status to 'published', adds published_at timestamp, and stores original description in metadata
   * @param episodeId - Episode identifier
   * @param imageUrl - S3 URL of the cover image
   * @param originalDescription - Optional original description to preserve
   * @returns Promise that resolves when update is complete
   * @throws Error if episode not found or update fails
   */
  updateEpisodeWithImage(
    episodeId: string,
    imageUrl: string,
    originalDescription?: string
  ): Promise<void>;

  /**
   * Parse episode metadata from JSON string
   * @param metadataStr - JSON string of episode metadata
   * @returns Parsed metadata object or null if parsing fails
   */
  parseEpisodeMetadata(metadataStr?: string | null): Record<string, unknown> | null;
}
