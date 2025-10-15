import { db } from '../index';
import { sentEpisodes } from '../schema';
import { eq, and, desc, SQL } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as dbUtils from '../utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Sent episode model - represents a sent_episodes record from the database
 */
export type SentEpisode = InferSelectModel<typeof sentEpisodes>;

/**
 * New sent episode data for insertion
 */
export type NewSentEpisode = InferInsertModel<typeof sentEpisodes>;

// ============================================================================
// Read Operations (Queries)
// ============================================================================

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

/**
 * Check if an episode has been sent to a user
 *
 * @param episodeId - Episode ID
 * @param userId - User ID
 * @returns true if episode was sent to user, false otherwise
 *
 * @example
 * ```typescript
 * const wasSent = await hasEpisodeBeenSentToUser('episode-123', 'user-456');
 * if (!wasSent) {
 *   await sendEmailNotification(episodeId, userId);
 * }
 * ```
 */
export async function hasEpisodeBeenSentToUser(episodeId: string, userId: string): Promise<boolean> {
  const condition: SQL = and(
    eq(sentEpisodes.episode_id, episodeId),
    eq(sentEpisodes.user_id, userId)
  ) as SQL;

  return await dbUtils.exists(sentEpisodes, condition);
}

// ============================================================================
// Write Operations (Mutations)
// ============================================================================

/**
 * Create a new sent episode record
 *
 * @param data - Sent episode data to insert
 * @returns The created sent episode record
 *
 * @example
 * ```typescript
 * const sent = await createSentEpisode({
 *   episode_id: 'episode-123',
 *   user_id: 'user-456'
 * });
 * ```
 */
export async function createSentEpisode(data: NewSentEpisode): Promise<SentEpisode> {
  return await dbUtils.create<SentEpisode, NewSentEpisode>(sentEpisodes, data);
}

/**
 * Delete a sent episode record
 *
 * @param id - Sent episode ID
 * @returns true if record was deleted, false if not found
 *
 * @example
 * ```typescript
 * const success = await deleteSentEpisode('sent-123');
 * ```
 */
export async function deleteSentEpisode(id: string): Promise<boolean> {
  return await dbUtils.deleteById(sentEpisodes, sentEpisodes.id, id);
}
