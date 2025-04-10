import { db, episodes } from '@/lib/db';
import { eq, or } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';
import { PENDING_STATUS, COMPLETED_STATUS, SUMMARY_COMPLETED_STATUS } from './constants';

// Define the type using InferSelectModel
type Episode = InferSelectModel<typeof episodes>;

/**
 * Finds a single episode by its ID.
 * 
 * @param episodeId - The UUID of the episode to find.
 * @returns The episode object or undefined if not found.
 */
export async function findEpisodeById(episodeId: string): Promise<Episode | undefined> {
  try {
    const result = await db.select()
      .from(episodes)
      .where(eq(episodes.id, episodeId))
      .limit(1);
    return result[0];
  } catch (error) {
    console.error(`[EPISODE_FINDER] Error finding episode by ID ${episodeId}:`, error);
    // Depending on desired error handling, could return undefined or throw
    return undefined; 
  }
}

/**
 * Finds all episodes that are currently in a state requiring checking 
 * (pending or completed).
 * 
 * @returns An array of episode objects.
 */
export async function findAllEpisodesToCheck(): Promise<Episode[]> {
  try {
    const results = await db.select()
      .from(episodes)
      .where(
        or(
          eq(episodes.status, PENDING_STATUS),
          eq(episodes.status, COMPLETED_STATUS),
          eq(episodes.status, SUMMARY_COMPLETED_STATUS)
        )
      );
    return results;
  } catch (error) {
    console.error('[EPISODE_FINDER] Error finding all episodes to check:', error);
    // Return empty array on error to allow processing to continue gracefully
    return []; 
  }
} 