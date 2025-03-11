import { db } from '../index';
import { episodes, sentEpisodes } from '../schema';
import { eq, and, desc, SQL } from 'drizzle-orm';
import * as dbUtils from '../utils';

// Types
export type Episode = typeof episodes.$inferSelect;
export type NewEpisode = typeof episodes.$inferInsert;

/**
 * Returns all episodes
 */
export async function getAllEpisodes(): Promise<Episode[]> {
  return await dbUtils.getAll<Episode>(episodes);
}

/**
 * Returns an episode by ID
 */
export async function getEpisodeById(id: string): Promise<Episode | null> {
  return await dbUtils.findById<Episode>(episodes, episodes.id, id);
}

/**
 * Returns paginated episodes, sorted by published date (newest first)
 */
export async function getEpisodesPaginated(page: number = 1, pageSize: number = 10): Promise<Episode[]> {
  return await db.select()
    .from(episodes)
    .orderBy(desc(episodes.published_at))
    .limit(pageSize)
    .offset((page - 1) * pageSize) as Episode[];
}

/**
 * Creates a new episode
 */
export async function createEpisode(data: NewEpisode): Promise<Episode> {
  return await dbUtils.create<Episode, NewEpisode>(episodes, data);
}

/**
 * Updates an existing episode
 */
export async function updateEpisode(id: string, data: Partial<NewEpisode>): Promise<Episode | null> {
  return await dbUtils.updateById<Episode, NewEpisode>(episodes, episodes.id, id, data);
}

/**
 * Deletes an episode
 */
export async function deleteEpisode(id: string): Promise<boolean> {
  return await dbUtils.deleteById(episodes, episodes.id, id);
}

/**
 * Returns all episodes for a specific podcast
 */
export async function getEpisodesByPodcastId(podcastId: string): Promise<Episode[]> {
  return await dbUtils.findBy<Episode>(episodes, eq(episodes.podcast_id, podcastId));
}

/**
 * Checks if an episode has been sent to a specific user
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

/**
 * Marks an episode as sent to a user
 */
export async function markEpisodeAsSent(episodeId: string, userId: string): Promise<typeof sentEpisodes.$inferSelect> {
  return await dbUtils.create(sentEpisodes, {
    episode_id: episodeId,
    user_id: userId
  });
}

/**
 * Returns the total count of episodes
 */
export async function getEpisodeCount(): Promise<number> {
  return await dbUtils.count(episodes);
} 