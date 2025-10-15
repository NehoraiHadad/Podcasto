import { episodes } from '../../schema';
import * as dbUtils from '../../utils';
import type { Episode, NewEpisode } from './types';

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
