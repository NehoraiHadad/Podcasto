import type { PodcastWithConfig } from './types';

/**
 * Check if a podcast has published episodes
 *
 * @param podcast - Podcast with episode count
 * @returns true if the podcast has at least one published episode
 *
 * @example
 * ```typescript
 * const podcast = await getPodcastWithConfig('123-456');
 * if (hasPublishedEpisodes(podcast)) {
 *   console.log('Podcast is ready to display');
 * }
 * ```
 */
export function hasPublishedEpisodes(podcast: PodcastWithConfig): boolean {
  return (podcast.episodes_count ?? 0) > 0;
}

/**
 * Get a display label for podcast status
 *
 * @param podcast - Podcast with optional status field
 * @returns Human-readable status label
 *
 * @example
 * ```typescript
 * const label = getPodcastStatusLabel(podcast);
 * console.log(label); // "Processing Episode" or "Active" or "No Episodes"
 * ```
 */
export function getPodcastStatusLabel(podcast: PodcastWithConfig): string {
  if (podcast.status === 'pending') {
    return 'Processing Episode';
  }

  if (podcast.status === 'processing') {
    return 'Generating Audio';
  }

  if (podcast.status === 'failed') {
    return 'Episode Failed';
  }

  if (hasPublishedEpisodes(podcast)) {
    return 'Active';
  }

  return 'No Episodes';
}

/**
 * Check if a podcast is actively processing
 *
 * @param podcast - Podcast with optional status field
 * @returns true if podcast has a pending or processing episode
 *
 * @example
 * ```typescript
 * if (isPodcastProcessing(podcast)) {
 *   console.log('Please wait, episode is being generated...');
 * }
 * ```
 */
export function isPodcastProcessing(podcast: PodcastWithConfig): boolean {
  return podcast.status === 'pending' || podcast.status === 'processing';
}
