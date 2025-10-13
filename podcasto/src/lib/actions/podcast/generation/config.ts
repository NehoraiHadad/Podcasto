'use server';

/**
 * Podcast configuration retrieval for generation operations.
 * Fetches and validates podcast config before episode generation.
 */

import { podcastConfigsApi } from '@/lib/db/api';
import type { ConfigFetchResult } from './types';

/**
 * Fetches and validates podcast configuration needed for generation.
 * Returns the full config object if found, or an error if missing.
 *
 * @param podcastId - The ID of the podcast to fetch config for
 * @returns ConfigFetchResult with config object or error message
 */
export async function fetchPodcastConfig(podcastId: string): Promise<ConfigFetchResult> {
  const podcastConfig = await podcastConfigsApi.getPodcastConfigByPodcastId(podcastId);

  if (!podcastConfig) {
    console.error(`[PODCAST_GEN] Podcast configuration not found for ID: ${podcastId}`);
    return {
      success: false,
      error: 'Podcast configuration not found'
    };
  }

  console.log(`[PODCAST_GEN] Found podcast config: ${JSON.stringify(podcastConfig, null, 2)}`);

  return {
    success: true,
    config: podcastConfig
  };
}
