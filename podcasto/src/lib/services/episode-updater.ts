import { episodesApi } from '../db/api';
import { creditService } from '../services/credits';
import { isUserAdmin } from '../db/api/user-roles';
import type { IEpisodeUpdater } from './interfaces';

/**
 * Service for updating episode metadata and status
 */
export class EpisodeUpdater implements IEpisodeUpdater {
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
   * IMPORTANT: Automatically refunds credits if episode was charged
   */
  async markEpisodeAsFailed(episodeId: string, error: unknown): Promise<void> {
    try {
      // First, get the episode to check if it belongs to a user and if credits were deducted
      const episode = await episodesApi.getEpisodeById(episodeId);

      if (!episode) {
        console.error(`[EPISODE_UPDATER] Cannot mark episode as failed - episode not found: ${episodeId}`);
        return;
      }

      // Update episode status to failed
      await episodesApi.updateEpisode(episodeId, {
        status: 'failed',
        description: `Processing failed: ${error instanceof Error ? error.message : String(error)}`
      });

      console.log(`[EPISODE_UPDATER] Episode ${episodeId} marked as failed`);

      // Check if this episode has a user owner and credits should be refunded
      if (episode.created_by && episode.podcast_id) {
        // Check if user is admin (admins never pay credits, so no refund needed)
        const isAdmin = await isUserAdmin(episode.created_by);

        if (isAdmin) {
          console.log(`[EPISODE_UPDATER] Episode ${episodeId} belongs to admin user - no refund needed`);
          return;
        }

        // Check if credits were actually deducted (look for credit_transaction_id in metadata)
        let metadata: Record<string, unknown> = {};
        if (episode.metadata) {
          try {
            metadata = JSON.parse(episode.metadata);
          } catch (parseError) {
            console.warn(`[EPISODE_UPDATER] Could not parse episode metadata for ${episodeId}:`, parseError);
          }
        }

        // If there's a credit transaction ID, credits were deducted - refund them
        if (metadata.credit_transaction_id) {
          console.log(`[EPISODE_UPDATER] Refunding credits for failed episode ${episodeId} (user: ${episode.created_by})`);

          const refundResult = await creditService.refundCreditsForEpisode(
            episode.created_by,
            episodeId,
            episode.podcast_id,
            `Episode processing failed: ${error instanceof Error ? error.message : String(error)}`
          );

          if (refundResult.success) {
            console.log(`[EPISODE_UPDATER] Successfully refunded credits for episode ${episodeId}, new balance: ${refundResult.newBalance}`);
          } else {
            console.error(`[EPISODE_UPDATER] CRITICAL: Failed to refund credits for episode ${episodeId}:`, refundResult.error);
            // This is critical - credits were deducted but episode failed and refund failed
            // May require admin intervention
          }
        } else {
          console.log(`[EPISODE_UPDATER] Episode ${episodeId} has no credit transaction - no refund needed`);
        }
      }
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
 * Factory function to create an EpisodeUpdater instance
 * @returns IEpisodeUpdater interface implementation
 */
export function createEpisodeUpdater(): IEpisodeUpdater {
  return new EpisodeUpdater();
}

/** @deprecated Use createEpisodeUpdater() factory function instead */
export const episodeUpdater = createEpisodeUpdater(); 