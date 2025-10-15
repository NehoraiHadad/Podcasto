import { db } from '../index';
import { episodes, sentEpisodes } from '../schema';
import { eq, and, desc, SQL, inArray } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as dbUtils from '../utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Episode model - represents an episode record from the database
 */
export type Episode = InferSelectModel<typeof episodes>;

/**
 * New episode data for insertion
 */
export type NewEpisode = InferInsertModel<typeof episodes>;

// ============================================================================
// Read Operations (Queries)
// ============================================================================

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

/**
 * Check if an episode has been sent to a specific user
 *
 * @param episodeId - Episode ID
 * @param userId - User ID
 * @returns true if episode was sent to user, false otherwise
 *
 * @example
 * ```typescript
 * const wasSent = await isEpisodeSentToUser('episode-123', 'user-456');
 * if (!wasSent) {
 *   await sendEpisodeEmail(episodeId, userId);
 * }
 * ```
 */
export async function isEpisodeSentToUser(episodeId: string, userId: string): Promise<boolean> {
  return await dbUtils.exists(
    sentEpisodes,
    and(
      eq(sentEpisodes.episode_id, episodeId),
      eq(sentEpisodes.user_id, userId)
    ) as SQL<unknown>
  );
}

// ============================================================================
// Write Operations (Mutations)
// ============================================================================

/**
 * Create a new episode
 *
 * @param data - Episode data to insert
 * @returns The created episode
 *
 * @example
 * ```typescript
 * const episode = await createEpisode({
 *   podcast_id: 'podcast-123',
 *   title: 'Episode 1',
 *   status: 'pending'
 * });
 * ```
 */
export async function createEpisode(data: NewEpisode): Promise<Episode> {
  return await dbUtils.create<Episode, NewEpisode>(episodes, data);
}

/**
 * Update an existing episode
 *
 * @param id - Episode ID
 * @param data - Partial episode data to update
 * @returns The updated episode if found, null otherwise
 *
 * @example
 * ```typescript
 * const updated = await updateEpisode('episode-123', {
 *   status: 'completed',
 *   audio_url: 'https://...'
 * });
 * ```
 */
export async function updateEpisode(id: string, data: Partial<NewEpisode>): Promise<Episode | null> {
  return await dbUtils.updateById<Episode, NewEpisode>(episodes, episodes.id, id, data);
}

/**
 * Delete an episode
 *
 * @param id - Episode ID
 * @returns true if episode was deleted, false if not found
 *
 * @example
 * ```typescript
 * const success = await deleteEpisode('episode-123');
 * ```
 */
export async function deleteEpisode(id: string): Promise<boolean> {
  return await dbUtils.deleteById(episodes, episodes.id, id);
}

/**
 * Mark an episode as sent to a user
 *
 * @param episodeId - Episode ID
 * @param userId - User ID
 * @returns The created sent episode record
 *
 * @example
 * ```typescript
 * await markEpisodeAsSent('episode-123', 'user-456');
 * ```
 */
export async function markEpisodeAsSent(episodeId: string, userId: string): Promise<typeof sentEpisodes.$inferSelect> {
  return await dbUtils.create(sentEpisodes, {
    episode_id: episodeId,
    user_id: userId
  });
}
