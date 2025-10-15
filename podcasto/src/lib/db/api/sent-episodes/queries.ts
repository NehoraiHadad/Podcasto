import { db } from '../../index';
import { sentEpisodes } from '../../schema';
import { eq, desc } from 'drizzle-orm';
import * as dbUtils from '../../utils';
import type { SentEpisode } from './types';

/**
 * Get all sent episode records
 *
 * @returns Array of all sent episodes
 *
 * @example
 * ```typescript
 * const allSent = await getAllSentEpisodes();
 * console.log(`Total sent: ${allSent.length}`);
 * ```
 */
export async function getAllSentEpisodes(): Promise<SentEpisode[]> {
  return await dbUtils.getAll<SentEpisode>(sentEpisodes);
}

/**
 * Get sent episode by ID
 *
 * @param id - Sent episode ID (UUID)
 * @returns The sent episode record if found, null otherwise
 *
 * @example
 * ```typescript
 * const sent = await getSentEpisodeById('sent-123');
 * if (sent) {
 *   console.log(sent.sent_at);
 * }
 * ```
 */
export async function getSentEpisodeById(id: string): Promise<SentEpisode | null> {
  return await dbUtils.findById<SentEpisode>(sentEpisodes, sentEpisodes.id, id);
}

/**
 * Get all episodes sent to a specific user
 *
 * @param userId - User ID
 * @returns Array of sent episodes for the user
 *
 * @example
 * ```typescript
 * const userSent = await getUserSentEpisodes('user-123');
 * console.log(`User received ${userSent.length} episodes`);
 * ```
 */
export async function getUserSentEpisodes(userId: string): Promise<SentEpisode[]> {
  return await dbUtils.findBy<SentEpisode>(sentEpisodes, eq(sentEpisodes.user_id, userId));
}

/**
 * Get all users who received a specific episode
 *
 * @param episodeId - Episode ID
 * @returns Array of sent episode records for the episode
 *
 * @example
 * ```typescript
 * const recipients = await getEpisodeSentUsers('episode-123');
 * console.log(`Episode sent to ${recipients.length} users`);
 * ```
 */
export async function getEpisodeSentUsers(episodeId: string): Promise<SentEpisode[]> {
  return await dbUtils.findBy<SentEpisode>(sentEpisodes, eq(sentEpisodes.episode_id, episodeId));
}

/**
 * Get the most recently sent episodes for a user
 *
 * @param userId - User ID
 * @param limit - Maximum number of records to return (default: 10)
 * @returns Array of recent sent episodes
 *
 * @example
 * ```typescript
 * const recent = await getRecentSentEpisodes('user-123', 5);
 * ```
 */
export async function getRecentSentEpisodes(userId: string, limit: number = 10): Promise<SentEpisode[]> {
  return await db.select()
    .from(sentEpisodes)
    .where(eq(sentEpisodes.user_id, userId))
    .orderBy(desc(sentEpisodes.sent_at))
    .limit(limit) as SentEpisode[];
}

/**
 * Get total count of sent episode records
 *
 * @returns The total number of sent episodes
 *
 * @example
 * ```typescript
 * const total = await getSentEpisodeCount();
 * console.log(`Total sent: ${total}`);
 * ```
 */
export async function getSentEpisodeCount(): Promise<number> {
  return await dbUtils.count(sentEpisodes);
}
