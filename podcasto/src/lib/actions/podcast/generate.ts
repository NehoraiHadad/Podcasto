'use server';

/**
 * Main orchestrator for podcast episode generation.
 * Coordinates validation, episode creation, and Lambda invocation.
 */

import { revalidatePath } from 'next/cache';
import {
  checkEnvironmentConfiguration,
  validateDateRange,
  fetchPodcastConfig,
  createPendingEpisode,
  invokeLambdaFunction
} from './generation';

// Re-export types for backward compatibility
export type { DateRange, GenerationResult } from './generation/types';

import type { DateRange, GenerationResult } from './generation/types';

/**
 * Triggers immediate podcast generation for a specific podcast.
 * Orchestrates the full generation flow from validation to Lambda invocation.
 *
 * @param podcastId - The ID of the podcast to generate
 * @param dateRange - Optional date range for content collection
 * @returns GenerationResult with success status and episode details
 */
export async function generatePodcastEpisode(
  podcastId: string,
  dateRange?: DateRange
): Promise<GenerationResult> {
  try {
    // Validate the podcast ID
    if (!podcastId) {
      return { success: false, error: 'Podcast ID is required' };
    }

    // Validate date range if provided
    if (dateRange) {
      const validationResult = validateDateRange(dateRange);
      if (!validationResult.success) {
        return validationResult;
      }
    }

    // Log the generation request
    console.log(`[PODCAST_GEN] Starting generation for podcast ID: ${podcastId}`);
    if (dateRange) {
      console.log(`[PODCAST_GEN] Using custom date range: ${dateRange.startDate.toISOString()} to ${dateRange.endDate.toISOString()}`);
    }

    // Check environment configuration
    const envCheck = checkEnvironmentConfiguration();
    if (!envCheck.success) {
      return envCheck;
    }

    // Get podcast config for generation parameters
    const configResult = await fetchPodcastConfig(podcastId);
    if (!configResult.success || !configResult.config) {
      return { success: false, error: configResult.error || 'Failed to get podcast config' };
    }

    // Create a new episode record
    const timestamp = new Date().toISOString();
    const episodeResult = await createPendingEpisode(podcastId, timestamp, dateRange);
    if (!episodeResult.success) {
      return episodeResult;
    }

    // Invoke Telegram Lambda to collect data and trigger processing via SQS
    const lambdaResult = await invokeLambdaFunction({
      podcastId,
      episodeId: episodeResult.episodeId!,
      podcastConfig: configResult.config,
      timestamp,
      dateRange
    });

    if (!lambdaResult.success) {
      return lambdaResult;
    }

    // Revalidate the podcasts page to show the updated status
    revalidatePath('/admin/podcasts');

    return {
      success: true,
      message: 'Podcast generation has been triggered',
      timestamp,
      episodeId: episodeResult.episodeId
    };
  } catch (error) {
    console.error('Error in generatePodcastEpisode:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger podcast generation'
    };
  }
}
