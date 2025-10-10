'use server';

import { requireAdmin } from '../auth-actions';
import { podcastConfigsApi } from '@/lib/db/api';
import { generatePodcastEpisode } from '../podcast/generate';
import {
  calculateEpisodeDates,
  estimateGenerationTime,
  type EpisodeDateRange
} from '@/lib/utils/episode-date-calculator';
import { revalidatePath } from 'next/cache';

/**
 * Result for a single episode generation attempt
 */
interface EpisodeGenerationResult {
  episodeNumber: number;
  dateRange: {
    start: string;
    end: string;
  };
  success: boolean;
  episodeId?: string;
  error?: string;
}

/**
 * Result of bulk episode generation
 */
export interface BulkGenerationResult {
  success: boolean;
  totalRequested: number;
  successCount: number;
  failureCount: number;
  results: EpisodeGenerationResult[];
  error?: string;
  estimatedTime?: string;
}

/**
 * Preview the episodes that would be created without actually creating them
 */
export async function previewBulkEpisodes(
  podcastId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean;
  episodeDates?: EpisodeDateRange[];
  totalEpisodes?: number;
  estimatedTime?: string;
  error?: string;
}> {
  // Ensure the user is an admin
  await requireAdmin();

  try {
    // Validate input
    if (!podcastId || !startDate || !endDate) {
      return {
        success: false,
        error: 'Missing required parameters'
      };
    }

    // Get podcast configuration
    const podcastConfig = await podcastConfigsApi.getPodcastConfigByPodcastId(podcastId);

    if (!podcastConfig) {
      return {
        success: false,
        error: 'Podcast configuration not found'
      };
    }

    if (!podcastConfig.episode_frequency) {
      return {
        success: false,
        error: 'Podcast does not have episode frequency configured'
      };
    }

    // Calculate episode dates
    const calculation = calculateEpisodeDates({
      startDate,
      endDate,
      episodeFrequency: podcastConfig.episode_frequency
    });

    if (!calculation.success || !calculation.episodeDates) {
      return {
        success: false,
        error: calculation.error || 'Failed to calculate episode dates'
      };
    }

    // Estimate generation time
    const timeEstimate = estimateGenerationTime(calculation.episodeDates.length);

    return {
      success: true,
      episodeDates: calculation.episodeDates,
      totalEpisodes: calculation.totalEpisodes,
      estimatedTime: timeEstimate.formattedTime
    };
  } catch (error) {
    console.error('Error in previewBulkEpisodes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate multiple episodes for a podcast based on a date range
 * Episodes are created according to the podcast's episode_frequency setting
 * Rate limiting: 6 second delay between episodes to respect API limits
 */
export async function generateBulkEpisodes(
  podcastId: string,
  startDate: Date,
  endDate: Date
): Promise<BulkGenerationResult> {
  // Ensure the user is an admin
  await requireAdmin();

  try {
    console.log(`[BULK_GEN] Starting bulk generation for podcast: ${podcastId}`);
    console.log(`[BULK_GEN] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Validate input
    if (!podcastId || !startDate || !endDate) {
      return {
        success: false,
        totalRequested: 0,
        successCount: 0,
        failureCount: 0,
        results: [],
        error: 'Missing required parameters'
      };
    }

    // Get podcast configuration
    const podcastConfig = await podcastConfigsApi.getPodcastConfigByPodcastId(podcastId);

    if (!podcastConfig) {
      return {
        success: false,
        totalRequested: 0,
        successCount: 0,
        failureCount: 0,
        results: [],
        error: 'Podcast configuration not found'
      };
    }

    if (!podcastConfig.episode_frequency) {
      return {
        success: false,
        totalRequested: 0,
        successCount: 0,
        failureCount: 0,
        results: [],
        error: 'Podcast does not have episode frequency configured'
      };
    }

    // Calculate episode dates
    const calculation = calculateEpisodeDates({
      startDate,
      endDate,
      episodeFrequency: podcastConfig.episode_frequency
    });

    if (!calculation.success || !calculation.episodeDates) {
      return {
        success: false,
        totalRequested: 0,
        successCount: 0,
        failureCount: 0,
        results: [],
        error: calculation.error || 'Failed to calculate episode dates'
      };
    }

    const episodeDates = calculation.episodeDates;
    console.log(`[BULK_GEN] Will create ${episodeDates.length} episodes`);

    // Generate episodes with rate limiting
    const results: EpisodeGenerationResult[] = [];
    const DELAY_BETWEEN_REQUESTS = 6000; // 6 seconds in milliseconds

    for (let i = 0; i < episodeDates.length; i++) {
      const dateRange = episodeDates[i];

      console.log(
        `[BULK_GEN] Creating episode ${dateRange.episodeNumber}/${episodeDates.length}: ` +
        `${dateRange.startDate.toISOString()} to ${dateRange.endDate.toISOString()}`
      );

      try {
        // Call the existing generatePodcastEpisode function
        const generationResult = await generatePodcastEpisode(podcastId, {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });

        results.push({
          episodeNumber: dateRange.episodeNumber,
          dateRange: {
            start: dateRange.startDate.toISOString(),
            end: dateRange.endDate.toISOString()
          },
          success: generationResult.success,
          episodeId: generationResult.episodeId,
          error: generationResult.error
        });

        if (generationResult.success) {
          console.log(`[BULK_GEN] Episode ${dateRange.episodeNumber} created: ${generationResult.episodeId}`);
        } else {
          console.error(`[BULK_GEN] Episode ${dateRange.episodeNumber} failed: ${generationResult.error}`);
        }
      } catch (error) {
        console.error(`[BULK_GEN] Error creating episode ${dateRange.episodeNumber}:`, error);
        results.push({
          episodeNumber: dateRange.episodeNumber,
          dateRange: {
            start: dateRange.startDate.toISOString(),
            end: dateRange.endDate.toISOString()
          },
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Add delay between requests (except after the last one)
      if (i < episodeDates.length - 1) {
        console.log(`[BULK_GEN] Waiting ${DELAY_BETWEEN_REQUESTS / 1000} seconds before next episode...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }

    // Calculate success/failure counts
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`[BULK_GEN] Completed: ${successCount} succeeded, ${failureCount} failed`);

    // Revalidate admin pages
    revalidatePath('/admin/episodes');
    revalidatePath('/admin/podcasts');

    return {
      success: successCount > 0,
      totalRequested: episodeDates.length,
      successCount,
      failureCount,
      results
    };
  } catch (error) {
    console.error('[BULK_GEN] Unhandled error in generateBulkEpisodes:', error);
    return {
      success: false,
      totalRequested: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
