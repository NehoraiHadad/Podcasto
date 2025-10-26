import { podcastConfigsApi } from '@/lib/db/api';
import type { BulkGenerationResult } from './types';

/**
 * Validates bulk generation input parameters
 */
export function validateBulkGenerationInput(
  podcastId: string | undefined,
  startDate: Date | undefined,
  endDate: Date | undefined
): { valid: boolean; error?: string } {
  if (!podcastId || !startDate || !endDate) {
    return { valid: false, error: 'Missing required parameters' };
  }

  if (startDate >= endDate) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  return { valid: true };
}

/**
 * Fetches podcast config and validates episode frequency
 * Returns config or error result
 */
export async function fetchAndValidatePodcastConfig(
  podcastId: string
): Promise<
  | { success: true; config: { episode_frequency: number; [key: string]: unknown } }
  | { success: false; error: string }
> {const podcastConfig = await podcastConfigsApi.getPodcastConfigByPodcastId(podcastId);

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

  return {
    success: true,
    config: podcastConfig as { episode_frequency: number; [key: string]: unknown }
  };
}

/**
 * Creates error result for bulk generation operations
 */
export function createBulkErrorResult(error: string): BulkGenerationResult {
  return {
    success: false,
    totalRequested: 0,
    successCount: 0,
    failureCount: 0,
    results: [],
    error
  };
}
