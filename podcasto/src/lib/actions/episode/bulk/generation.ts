'use server';

import { requireAdmin } from '../../auth-actions';
import { generatePodcastEpisode } from '../../podcast/generate';
import { getDelayBetweenRequests } from '@/lib/utils/rate-limit-config';
import { revalidatePath } from 'next/cache';
import {
  validateBulkGenerationInput,
  fetchAndValidatePodcastConfig,
  createBulkErrorResult
} from './validation';
import { calculateEpisodeDatesForPodcast } from './date-calculation';
import type { BulkGenerationResult, EpisodeGenerationResult } from './types';

/**
 * Generate multiple episodes for a podcast based on a date range
 * Episodes are created according to the podcast's episode_frequency setting
 * Rate limiting: Dynamic delay between episodes to respect API limits
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
    const inputValidation = validateBulkGenerationInput(podcastId, startDate, endDate);
    if (!inputValidation.valid) {
      return createBulkErrorResult(inputValidation.error!);
    }

    // Get and validate config
    const configResult = await fetchAndValidatePodcastConfig(podcastId);
    if (!configResult.success) {
      return createBulkErrorResult(configResult.error);
    }

    // Calculate episode dates
    const calculationResult = await calculateEpisodeDatesForPodcast(
      startDate,
      endDate,
      configResult.config.episode_frequency
    );

    if (!calculationResult.success || !calculationResult.episodeDates) {
      return createBulkErrorResult(calculationResult.error || 'Failed to calculate episode dates');
    }

    const episodeDates = calculationResult.episodeDates;
    console.log(`[BULK_GEN] Will create ${episodeDates.length} episodes`);

    // Generate episodes with dynamic rate limiting
    const results: EpisodeGenerationResult[] = [];
    const delayBetweenRequests = getDelayBetweenRequests();

    console.log(`[BULK_GEN] Using delay of ${delayBetweenRequests}ms between requests`);

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
        console.log(`[BULK_GEN] Waiting ${delayBetweenRequests / 1000} seconds before next episode...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
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
    return createBulkErrorResult(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}
