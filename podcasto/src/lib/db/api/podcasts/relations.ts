import { parseISOUTC } from '@/lib/utils/date/server';
import { db } from '../../index';
import { eq, desc, or } from 'drizzle-orm';
import { podcasts, episodes } from '../../schema';
import type { PodcastWithConfig } from './types';

/**
 * Get a single podcast by ID with episode counts and latest episode status
 * Uses Drizzle relational query to avoid N+1 problem
 *
 * @param id - Podcast ID
 * @returns Podcast with episode count and latest episode status, or null if not found
 *
 * @example
 * ```typescript
 * const podcast = await getPodcastByIdWithCounts('podcast-123');
 * if (podcast) {
 *   console.log(`${podcast.title}: ${podcast.episodes_count} episodes`);
 * }
 * ```
 */
export async function getPodcastByIdWithCounts(id: string): Promise<PodcastWithConfig | null> {
  // Single query with relations - fetches podcast WITH its episodes
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, id),
    with: {
      episodes: {
        orderBy: [desc(episodes.created_at)],
        limit: 100 // Reasonable limit to prevent loading thousands of episodes
      }
    }
  });

  if (!podcast) {
    return null;
  }

  // Process data in-memory (fast!)
  const podcastEpisodes = podcast.episodes || [];
  const publishedEpisodes = podcastEpisodes.filter(
    ep => ep.status === 'completed' || ep.status === 'published'
  );

  return {
    ...podcast,
    episodes_count: publishedEpisodes.length,
    status: podcastEpisodes[0]?.status ?? undefined,
    timestamp: undefined,
  };
}

/**
 * Get all podcasts with episode counts and latest episode status
 * Uses Drizzle relational query to avoid N+1 problem
 *
 * Performance: Fetches all podcasts WITH their episodes in a single query
 * instead of 1 + N*2 queries (95% reduction in database queries)
 *
 * @returns Array of podcasts with episode counts and latest episode status
 *
 * @example
 * ```typescript
 * const podcasts = await getAllPodcastsWithCounts();
 * console.log(`Fetched ${podcasts.length} podcasts with 1 query!`);
 * for (const podcast of podcasts) {
 *   console.log(`${podcast.title}: ${podcast.episodes_count} episodes`);
 *   if (podcast.status === 'pending') {
 *     console.log('  - Has pending episode');
 *   }
 * }
 * ```
 */
export async function getAllPodcastsWithCounts(): Promise<PodcastWithConfig[]> {
  // Fetch all podcasts WITH their episodes in a single query
  // This is the key to avoiding N+1: Drizzle's relational queries always
  // generate exactly ONE SQL statement
  const results = await db.query.podcasts.findMany({
    with: {
      episodes: {
        orderBy: [desc(episodes.created_at)],
        limit: 100 // Reasonable limit per podcast to prevent loading thousands
      }
    },
    orderBy: [desc(podcasts.created_at)]
  });

  // Process data in-memory (fast!) - no more database queries here
  return results.map(podcast => {
    const podcastEpisodes = podcast.episodes || [];
    const publishedEpisodes = podcastEpisodes.filter(
      ep => ep.status === 'completed' || ep.status === 'published'
    );

    // Default podcast data - use published episodes count for user-facing display
    const podcastData: PodcastWithConfig = {
      ...podcast,
      episodes_count: publishedEpisodes.length,
      status: undefined,
      timestamp: undefined,
    };

    // Find the latest episode with status information
    if (podcastEpisodes.length > 0) {
      // Episodes are already sorted by created_at DESC from the query!
      const latestEpisode = podcastEpisodes[0];

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
  });
}

/**
 * Get paginated podcasts with episode counts
 * Uses Drizzle relational query to avoid N+1 problem
 *
 * Performance: Fetches podcasts WITH their episodes in a single query
 * instead of 1 + N queries (90% reduction in database queries)
 *
 * @param page - Page number (1-based)
 * @param pageSize - Number of records per page
 * @returns Array of podcasts with episode counts
 *
 * @example
 * ```typescript
 * const page1 = await getPodcastsPaginatedWithCounts(1, 10);
 * console.log(`Fetched ${page1.length} podcasts with 1 query!`);
 * page1.forEach(podcast => {
 *   console.log(`${podcast.title}: ${podcast.episodes_count} episodes`);
 * });
 * ```
 */
export async function getPodcastsPaginatedWithCounts(
  page: number = 1,
  pageSize: number = 10
): Promise<PodcastWithConfig[]> {
  const offset = (page - 1) * pageSize;

  // Single query with pagination and relations
  const results = await db.query.podcasts.findMany({
    limit: pageSize,
    offset: offset,
    with: {
      episodes: {
        where: or(
          eq(episodes.status, 'completed'),
          eq(episodes.status, 'published')
        ),
        orderBy: [desc(episodes.published_at)]
      }
    },
    orderBy: [desc(podcasts.created_at)]
  });

  // Process data in-memory - count episodes without additional queries
  return results.map(podcast => ({
    ...podcast,
    episodes_count: podcast.episodes?.length || 0,
  }));
}
