import { episodesApi } from '../db/api';

/**
 * Service for updating episode metadata and status
 */
export class EpisodeUpdater {
  /**
   * Update episode with newly generated title and summary
   */
  async updateEpisodeWithSummary(
    episodeId: string,
    title: string,
    summary: string
  ): Promise<void> {
    await episodesApi.updateEpisode(episodeId, {
      title,
      description: summary,
      status: 'summary_completed' // Intermediate status
    });
  }

  /**
   * Mark episode as processed without an image
   */
  async markEpisodeAsProcessed(episodeId: string): Promise<void> {
    await episodesApi.updateEpisode(episodeId, {
      status: 'processed' // Final status
    });
  }

  /**
   * Mark episode as published with timestamp
   */
  async markEpisodeAsPublished(episodeId: string): Promise<void> {
    await episodesApi.updateEpisode(episodeId, {
      status: 'published',
      published_at: new Date()
    });
  }

  /**
   * Mark episode as failed with error message
   */
  async markEpisodeAsFailed(episodeId: string, error: unknown): Promise<void> {
    try {
      await episodesApi.updateEpisode(episodeId, {
        status: 'failed',
        description: `Processing failed: ${error instanceof Error ? error.message : String(error)}`
      });
    } catch (updateError) {
      console.error(`[EPISODE_UPDATER] Failed to update episode status after error:`, updateError);
    }
  }

  /**
   * Track image generation errors in episode metadata
   */
  async trackImageGenerationError(episodeId: string, error: unknown): Promise<void> {
    try {
      // Get existing metadata (if any)
      const episode = await episodesApi.getEpisodeById(episodeId);
      let metadata: Record<string, unknown> = {};
      
      // Parse existing metadata if available
      if (episode?.metadata) {
        try {
          metadata = JSON.parse(episode.metadata);
        } catch (parseError) {
          console.warn(`[EPISODE_UPDATER] Could not parse existing metadata: ${parseError}`);
        }
      }
      
      // Add error information to metadata
      metadata.image_generation_error = error instanceof Error ? error.message : String(error);
      metadata.image_generation_timestamp = new Date().toISOString();
      
      // Update episode with metadata and status
      await episodesApi.updateEpisode(episodeId, {
        status: 'processed', // Still mark as processed, just without image
        metadata: JSON.stringify(metadata)
      });
    } catch (updateError) {
      console.error(`[EPISODE_UPDATER] Failed to update episode metadata after image error:`, updateError);
    }
  }

  /**
   * Update episode with cover image URL
   */
  async updateEpisodeWithImage(
    episodeId: string,
    imageUrl: string,
    originalDescription?: string
  ): Promise<void> {
    // Get the episode to save its original description
    const episode = await episodesApi.getEpisodeById(episodeId);
    
    if (!episode) {
      throw new Error('Episode not found');
    }
    
    // Parse existing metadata if available
    let metadata: Record<string, unknown> = {};
    if (episode.metadata) {
      try {
        metadata = JSON.parse(episode.metadata);
      } catch (parseError) {
        console.warn(`[EPISODE_UPDATER] Could not parse existing metadata: ${parseError}`);
      }
    }
    
    // Save the original description for later use in case of errors
    if (originalDescription || episode.description) {
      metadata.original_description = originalDescription || episode.description;
    }
    
    // Update episode with image URL and metadata, and mark as published
    await episodesApi.updateEpisode(episodeId, {
      cover_image: imageUrl,
      status: 'published',
      published_at: new Date(),
      metadata: JSON.stringify(metadata)
    });
  }

  /**
   * Parse episode metadata
   */
  parseEpisodeMetadata(metadataStr?: string | null): Record<string, unknown> | null {
    if (!metadataStr) return null;
    
    try {
      return JSON.parse(metadataStr);
    } catch (error) {
      console.error('[EPISODE_UPDATER] Error parsing episode metadata:', error);
      return null;
    }
  }
}

/**
 * Create an episode updater service
 */
export function createEpisodeUpdater(): EpisodeUpdater {
  return new EpisodeUpdater();
} 