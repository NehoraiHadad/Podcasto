import 'server-only';

import { db } from '../../index';
import { episodes } from '../../schema';
import { eq, desc, inArray } from 'drizzle-orm';
import * as dbUtils from '../../utils';
import type { Episode } from './types';

/**
 * Get all episodes
 *
 * @returns Array of all episodes
 *
 * @example
 * ```typescript
 * const allEpisodes = await getAllEpisodes();
 * console.log(`Total episodes: ${allEpisodes.length}`);
 * ```
 */
export async function getAllEpisodes(): Promise<Episode[]> {
  return await dbUtils.getAll<Episode>(episodes);
}

/**
 * Get episode by ID
 *
 * @param id - Episode ID (UUID)
 * @returns The episode if found, null otherwise
 *
 * @example
 * ```typescript
 * const episode = await getEpisodeById('episode-123');
 * if (episode) {
 *   console.log(episode.title);
 * }
 * ```
 */
export async function getEpisodeById(id: string): Promise<Episode | null> {
  return await dbUtils.findById<Episode>(episodes, episodes.id, id);
}

/**
 * Get paginated episodes, sorted by published date (newest first)
 *
 * @param page - Page number (1-based)
 * @param pageSize - Number of records per page
 * @returns Array of paginated episodes
 *
 * @example
 * ```typescript
 * const page1 = await getEpisodesPaginated(1, 10);
 * const page2 = await getEpisodesPaginated(2, 10);
 * ```
 */
export async function getEpisodesPaginated(page: number = 1, pageSize: number = 10): Promise<Episode[]> {
  return await db.select()
    .from(episodes)
    .orderBy(desc(episodes.published_at))
    .limit(pageSize)
    .offset((page - 1) * pageSize) as Episode[];
}

/**
 * Get all episodes for a specific podcast
 *
 * @param podcastId - Podcast ID
 * @returns Array of episodes for the podcast
 *
 * @example
 * ```typescript
 * const podcastEpisodes = await getEpisodesByPodcastId('podcast-123');
 * ```
 */
export async function getEpisodesByPodcastId(podcastId: string): Promise<Episode[]> {
  return await dbUtils.findBy<Episode>(episodes, eq(episodes.podcast_id, podcastId));
}

/**
 * Get episodes by status
 *
 * @param statuses - Array of status values to filter by
 * @returns Array of episodes matching the given statuses
 *
 * @example
 * ```typescript
 * const publishedEpisodes = await getEpisodesByStatus(['completed', 'published']);
 * ```
 */
export async function getEpisodesByStatus(statuses: string[]): Promise<Episode[]> {
  return await db.select()
    .from(episodes)
    .where(inArray(episodes.status, statuses))
    .orderBy(desc(episodes.created_at)) as Episode[];
}

/**
 * Get total count of episodes
 *
 * @returns The total number of episodes
 *
 * @example
 * ```typescript
 * const total = await getEpisodeCount();
 * console.log(`Total episodes: ${total}`);
 * ```
 */
export async function getEpisodeCount(): Promise<number> {
  return await dbUtils.count(episodes);
}
