import 'server-only';

import { sentEpisodes } from '../../schema';
import { eq, and, SQL } from 'drizzle-orm';
import * as dbUtils from '../../utils';

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
