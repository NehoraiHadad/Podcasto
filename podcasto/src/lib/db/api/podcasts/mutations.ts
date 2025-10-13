import { podcasts } from '../../schema';
import * as dbUtils from '../../utils';
import type { Podcast, NewPodcast } from './types';

/**
 * Create a new podcast
 *
 * @param data - Podcast data to insert
 * @returns The created podcast
 * @throws {Error} If database insertion fails
 *
 * @example
 * ```typescript
 * const newPodcast = await createPodcast({
 *   title: 'Tech Talk',
 *   description: 'Daily tech news',
 *   cover_image: 'https://...'
 * });
 * ```
 */
export async function createPodcast(data: NewPodcast): Promise<Podcast> {
  return await dbUtils.create<Podcast, NewPodcast>(podcasts, data);
}

/**
 * Update an existing podcast
 *
 * @param id - Podcast ID (UUID)
 * @param data - Partial podcast data to update
 * @returns The updated podcast or null if not found
 *
 * @example
 * ```typescript
 * const updated = await updatePodcast('123-456', {
 *   title: 'New Title',
 *   description: 'Updated description'
 * });
 * if (updated) {
 *   console.log('Podcast updated successfully');
 * }
 * ```
 */
export async function updatePodcast(
  id: string,
  data: Partial<NewPodcast>
): Promise<Podcast | null> {
  return await dbUtils.updateById<Podcast, NewPodcast>(
    podcasts,
    podcasts.id,
    id,
    data
  );
}

/**
 * Delete a podcast by ID
 *
 * @param id - Podcast ID (UUID)
 * @returns true if deleted, false if not found
 *
 * @example
 * ```typescript
 * const deleted = await deletePodcast('123-456');
 * if (deleted) {
 *   console.log('Podcast deleted successfully');
 * }
 * ```
 */
export async function deletePodcast(id: string): Promise<boolean> {
  return await dbUtils.deleteById(podcasts, podcasts.id, id);
}
