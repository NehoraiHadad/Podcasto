'use server';

import { requireAdmin } from '../../auth-actions';
import {
  validateBulkGenerationInput,
  fetchAndValidatePodcastConfig
} from './validation';
import { calculateEpisodeDatesForPodcast } from './date-calculation';
import type { BulkGenerationPreview } from './types';

/**
 * Preview the episodes that would be created without actually creating them
 */
export async function previewBulkEpisodes(
  podcastId: string,
  startDate: Date,
  endDate: Date
): Promise<BulkGenerationPreview> {
  // Ensure the user is an admin
  await requireAdmin();

  try {
    // Validate input
    const inputValidation = validateBulkGenerationInput(podcastId, startDate, endDate);
    if (!inputValidation.valid) {
      return { success: false, error: inputValidation.error };
    }

    // Get and validate config
    const configResult = await fetchAndValidatePodcastConfig(podcastId);
    if (!configResult.success) {
      return { success: false, error: configResult.error };
    }

    // Calculate episode dates
    const calculationResult = await calculateEpisodeDatesForPodcast(
      startDate,
      endDate,
      configResult.config.episode_frequency
    );

    if (!calculationResult.success) {
      return {
        success: false,
        error: calculationResult.error
      };
    }

    return {
      success: true,
      episodeDates: calculationResult.episodeDates,
      totalEpisodes: calculationResult.totalEpisodes,
      estimatedTime: calculationResult.estimatedTime,
      batchConfiguration: calculationResult.batchConfiguration
    };
  } catch (error) {
    console.error('Error in previewBulkEpisodes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
