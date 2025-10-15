import { sentEpisodes } from '../../schema';
import { eq, and, SQL } from 'drizzle-orm';
import * as dbUtils from '../../utils';

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
