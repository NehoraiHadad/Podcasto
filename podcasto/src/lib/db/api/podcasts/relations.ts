import * as dbUtils from '../../utils';
import { podcasts } from '../../schema';
import { getPodcastEpisodes, getPublishedPodcastEpisodes } from './episodes';
import type { Podcast, PodcastWithConfig } from './types';

/**
 * Get all podcasts with episode counts and latest episode status
 * This is a more expensive operation as it fetches episodes for each podcast
 *
 * @returns Array of podcasts with episode counts and latest episode status
 *
 * @example
 * ```typescript
 * const podcasts = await getAllPodcastsWithCounts();
 * for (const podcast of podcasts) {
 *   console.log(`${podcast.title}: ${podcast.episodes_count} episodes`);
 *   if (podcast.status === 'pending') {
 *     console.log('  - Has pending episode');
 *   }
 * }
 * ```
 */
export async function getAllPodcastsWithCounts(): Promise<PodcastWithConfig[]> {
  const results = await dbUtils.getAll<Podcast>(podcasts);

  return await Promise.all(
    results.map(async (podcast) => {
      const podcastEpisodes = await getPodcastEpisodes(podcast.id);
      const publishedEpisodes = await getPublishedPodcastEpisodes(podcast.id);

      // Default podcast data - use published episodes count for user-facing display
      const podcastData: PodcastWithConfig = {
        ...podcast,
        episodes_count: publishedEpisodes.length,
        status: undefined,
        timestamp: undefined,
      };

      // Find the latest episode with status information
      if (podcastEpisodes.length > 0) {
        // Sort episodes by creation date, newest first
        const sortedEpisodes = [...podcastEpisodes].sort((a, b) => {
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        });

        // Get the newest episode, regardless of status
        const latestEpisode = sortedEpisodes[0];

        // Only include status information if the episode's status is 'pending'
        // or if the episode was created recently (within last 24 hours)
        if (latestEpisode.status) {
          const isRecent =
            latestEpisode.created_at &&
            Date.now() - new Date(latestEpisode.created_at).getTime() <
              24 * 60 * 60 * 1000;

          if (latestEpisode.status === 'pending' || isRecent) {
            podcastData.status = latestEpisode.status;

            // Get timestamp from metadata if available
            if (latestEpisode.metadata) {
              try {
                const metadata = JSON.parse(latestEpisode.metadata);
                podcastData.timestamp = metadata.generation_timestamp;
              } catch (err) {
                console.error('Error parsing episode metadata:', err);
              }
            }
          }
        }
      }

      return podcastData;
    })
  );
}

/**
 * Get paginated podcasts with episode counts
 *
 * @param page - Page number (1-based)
 * @param pageSize - Number of records per page
 * @returns Array of podcasts with episode counts
 *
 * @example
 * ```typescript
 * const page1 = await getPodcastsPaginatedWithCounts(1, 10);
 * page1.forEach(podcast => {
 *   console.log(`${podcast.title}: ${podcast.episodes_count} episodes`);
 * });
 * ```
 */
export async function getPodcastsPaginatedWithCounts(
  page: number = 1,
  pageSize: number = 10
): Promise<PodcastWithConfig[]> {
  const results = await dbUtils.getPaginated<Podcast>(podcasts, page, pageSize);

  return await Promise.all(
    results.map(async (podcast) => {
      const publishedEpisodes = await getPublishedPodcastEpisodes(podcast.id);
      return {
        ...podcast,
        episodes_count: publishedEpisodes.length,
      };
    })
  );
}
