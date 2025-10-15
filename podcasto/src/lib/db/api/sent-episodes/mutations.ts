import { sentEpisodes } from '../../schema';
import * as dbUtils from '../../utils';
import type { SentEpisode, NewSentEpisode } from './types';

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
