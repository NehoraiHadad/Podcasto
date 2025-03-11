import { db } from '../index';
import { sentEpisodes } from '../schema';
import { eq, and, desc, SQL } from 'drizzle-orm';
import * as dbUtils from '../utils';

// Types
export type SentEpisode = typeof sentEpisodes.$inferSelect;
export type NewSentEpisode = typeof sentEpisodes.$inferInsert;

/**
 * Returns all sent episodes
 */
export async function getAllSentEpisodes(): Promise<SentEpisode[]> {
  return await dbUtils.getAll<SentEpisode>(sentEpisodes);
}

/**
 * Returns a sent episode by ID
 */
export async function getSentEpisodeById(id: string): Promise<SentEpisode | null> {
  return await dbUtils.findById<SentEpisode>(sentEpisodes, sentEpisodes.id, id);
}

/**
 * Creates a new sent episode record
 */
export async function createSentEpisode(data: NewSentEpisode): Promise<SentEpisode> {
  return await dbUtils.create<SentEpisode, NewSentEpisode>(sentEpisodes, data);
}

/**
 * Deletes a sent episode record
 */
export async function deleteSentEpisode(id: string): Promise<boolean> {
  return await dbUtils.deleteById(sentEpisodes, sentEpisodes.id, id);
}

/**
 * Returns all episodes sent to a specific user
 */
export async function getUserSentEpisodes(userId: string): Promise<SentEpisode[]> {
  return await dbUtils.findBy<SentEpisode>(sentEpisodes, eq(sentEpisodes.user_id, userId));
}

/**
 * Returns all users who received a specific episode
 */
export async function getEpisodeSentUsers(episodeId: string): Promise<SentEpisode[]> {
  return await dbUtils.findBy<SentEpisode>(sentEpisodes, eq(sentEpisodes.episode_id, episodeId));
}

/**
 * Checks if an episode has been sent to a user
 */
export async function hasEpisodeBeenSentToUser(episodeId: string, userId: string): Promise<boolean> {
  const condition: SQL = and(
    eq(sentEpisodes.episode_id, episodeId),
    eq(sentEpisodes.user_id, userId)
  ) as SQL;
  
  return await dbUtils.exists(sentEpisodes, condition);
}

/**
 * Returns the most recently sent episodes for a user
 */
export async function getRecentSentEpisodes(userId: string, limit: number = 10): Promise<SentEpisode[]> {
  return await db.select()
    .from(sentEpisodes)
    .where(eq(sentEpisodes.user_id, userId))
    .orderBy(desc(sentEpisodes.sent_at))
    .limit(limit) as SentEpisode[];
}

/**
 * Returns the total count of sent episodes
 */
export async function getSentEpisodeCount(): Promise<number> {
  return await dbUtils.count(sentEpisodes);
} 