import { podcastConfigs } from '../schema';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as dbUtils from '../utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Podcast configuration model - represents a podcast_configs record from the database
 */
export type PodcastConfig = InferSelectModel<typeof podcastConfigs>;

/**
 * New podcast configuration data for insertion
 */
export type NewPodcastConfig = InferInsertModel<typeof podcastConfigs>;

// ============================================================================
// Read Operations (Queries)
// ============================================================================

/**
 * Get all podcast configurations
 *
 * @returns Array of all podcast configs
 *
 * @example
 * ```typescript
 * const allConfigs = await getAllPodcastConfigs();
 * console.log(`Total configs: ${allConfigs.length}`);
 * ```
 */
export async function getAllPodcastConfigs(): Promise<PodcastConfig[]> {
  return await dbUtils.getAll<PodcastConfig>(podcastConfigs);
}

/**
 * Get podcast configuration by ID
 *
 * @param id - Podcast config ID (UUID)
 * @returns The podcast config if found, null otherwise
 *
 * @example
 * ```typescript
 * const config = await getPodcastConfigById('config-123');
 * if (config) {
 *   console.log(config.creativity_level);
 * }
 * ```
 */
export async function getPodcastConfigById(id: string): Promise<PodcastConfig | null> {
  return await dbUtils.findById<PodcastConfig>(podcastConfigs, podcastConfigs.id, id);
}

/**
 * Get podcast configuration by podcast ID
 *
 * @param podcastId - Podcast ID
 * @returns The podcast config if found, null otherwise
 *
 * @example
 * ```typescript
 * const config = await getPodcastConfigByPodcastId('podcast-123');
 * if (config) {
 *   console.log(`Creativity level: ${config.creativity_level}`);
 * }
 * ```
 */
export async function getPodcastConfigByPodcastId(podcastId: string): Promise<PodcastConfig | null> {
  const results = await dbUtils.findBy<PodcastConfig>(podcastConfigs, eq(podcastConfigs.podcast_id, podcastId));
  return results.length > 0 ? results[0] : null;
}

/**
 * Get total count of podcast configurations
 *
 * @returns The total number of podcast configs
 *
 * @example
 * ```typescript
 * const total = await getPodcastConfigCount();
 * console.log(`Total configs: ${total}`);
 * ```
 */
export async function getPodcastConfigCount(): Promise<number> {
  return await dbUtils.count(podcastConfigs);
}

/**
 * Check if a podcast configuration exists for a podcast
 *
 * @param podcastId - Podcast ID
 * @returns true if config exists, false otherwise
 *
 * @example
 * ```typescript
 * const hasConfig = await podcastConfigExists('podcast-123');
 * if (!hasConfig) {
 *   await createPodcastConfig({ podcast_id: podcastId, ... });
 * }
 * ```
 */
export async function podcastConfigExists(podcastId: string): Promise<boolean> {
  return await dbUtils.exists(podcastConfigs, eq(podcastConfigs.podcast_id, podcastId));
}

// ============================================================================
// Write Operations (Mutations)
// ============================================================================

/**
 * Create a new podcast configuration
 *
 * @param data - Podcast config data to insert
 * @returns The created podcast config
 *
 * @example
 * ```typescript
 * const config = await createPodcastConfig({
 *   podcast_id: 'podcast-123',
 *   creativity_level: 7,
 *   output_language: 'english'
 * });
 * ```
 */
export async function createPodcastConfig(data: NewPodcastConfig): Promise<PodcastConfig> {
  return await dbUtils.create<PodcastConfig, NewPodcastConfig>(podcastConfigs, data);
}

/**
 * Update a podcast configuration by ID
 *
 * @param id - Podcast config ID
 * @param data - Partial podcast config data to update
 * @returns The updated podcast config if found, null otherwise
 *
 * @example
 * ```typescript
 * const updated = await updatePodcastConfig('config-123', {
 *   creativity_level: 8
 * });
 * ```
 */
export async function updatePodcastConfig(id: string, data: Partial<NewPodcastConfig>): Promise<PodcastConfig | null> {
  return await dbUtils.updateById<PodcastConfig, NewPodcastConfig>(podcastConfigs, podcastConfigs.id, id, data);
}

/**
 * Update a podcast configuration by podcast ID
 *
 * @param podcastId - Podcast ID
 * @param data - Partial podcast config data to update
 * @returns The updated podcast config if found, null otherwise
 *
 * @example
 * ```typescript
 * const updated = await updatePodcastConfigByPodcastId('podcast-123', {
 *   creativity_level: 9
 * });
 * ```
 */
export async function updatePodcastConfigByPodcastId(
  podcastId: string,
  data: Partial<NewPodcastConfig>
): Promise<PodcastConfig | null> {
  const config = await getPodcastConfigByPodcastId(podcastId);
  if (!config) return null;

  return await updatePodcastConfig(config.id, data);
}

/**
 * Delete a podcast configuration
 *
 * @param id - Podcast config ID
 * @returns true if config was deleted, false if not found
 *
 * @example
 * ```typescript
 * const success = await deletePodcastConfig('config-123');
 * ```
 */
export async function deletePodcastConfig(id: string): Promise<boolean> {
  return await dbUtils.deleteById(podcastConfigs, podcastConfigs.id, id);
}
