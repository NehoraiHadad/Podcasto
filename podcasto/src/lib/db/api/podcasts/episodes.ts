import 'server-only';

import { db } from '../../index';
import { episodes } from '../../schema';
import { eq, and, desc } from 'drizzle-orm';
import * as dbUtils from '../../utils';
import { UrlService } from '@/lib/utils/url-service';

/**
 * Helper function to transform episode URLs to proxy URLs
 */
function transformEpisodeUrl(episode: typeof episodes.$inferSelect): typeof episodes.$inferSelect {
  return {
    ...episode,
    cover_image: UrlService.episodeImage(episode.id),
    audio_url: UrlService.episodeAudio(episode.id),
  };
}

/**
 * Helper function to transform multiple episodes
 */
function transformEpisodeUrls(episodesList: typeof episodes.$inferSelect[]): typeof episodes.$inferSelect[] {
  return episodesList.map(transformEpisodeUrl);
}

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
  const episodesList = await dbUtils.findBy(episodes, eq(episodes.podcast_id, podcastId)) as typeof episodes.$inferSelect[];
  return transformEpisodeUrls(episodesList) as typeof episodes.$inferSelect[];
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
  const publishedEpisodes = (await db
    .select()
    .from(episodes)
    .where(
      and(eq(episodes.podcast_id, podcastId), eq(episodes.status, 'published'))
    )
    .orderBy(desc(episodes.published_at))) as typeof episodes.$inferSelect[];

  return transformEpisodeUrls(publishedEpisodes) as typeof episodes.$inferSelect[];
}
