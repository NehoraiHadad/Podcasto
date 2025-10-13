import { db } from '../../index';
import { episodes } from '../../schema';
import { eq, and, desc } from 'drizzle-orm';
import * as dbUtils from '../../utils';

/**
 * Get all episodes for a podcast (including all statuses)
 *
 * @param podcastId - Podcast ID (UUID)
 * @returns Array of episodes for the podcast
 *
 * @example
 * ```typescript
 * const episodes = await getPodcastEpisodes('123-456');
 * console.log(`Total episodes: ${episodes.length}`);
 * ```
 */
export async function getPodcastEpisodes(
  podcastId: string
): Promise<typeof episodes.$inferSelect[]> {
  return await dbUtils.findBy(episodes, eq(episodes.podcast_id, podcastId));
}

/**
 * Get only published episodes for a podcast
 * Used for user-facing pages where only published content should be shown
 *
 * @param podcastId - Podcast ID (UUID)
 * @returns Array of published episodes, ordered by published date (newest first)
 *
 * @example
 * ```typescript
 * const publishedEpisodes = await getPublishedPodcastEpisodes('123-456');
 * // Only shows episodes with status='published'
 * ```
 */
export async function getPublishedPodcastEpisodes(
  podcastId: string
): Promise<typeof episodes.$inferSelect[]> {
  return (await db
    .select()
    .from(episodes)
    .where(
      and(eq(episodes.podcast_id, podcastId), eq(episodes.status, 'published'))
    )
    .orderBy(desc(episodes.published_at))) as typeof episodes.$inferSelect[];
}
