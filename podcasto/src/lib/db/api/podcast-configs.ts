import { podcastConfigs } from '../schema';
import { eq } from 'drizzle-orm';
import * as dbUtils from '../utils';

// Types
export type PodcastConfig = typeof podcastConfigs.$inferSelect;
export type NewPodcastConfig = typeof podcastConfigs.$inferInsert;

/**
 * Returns all podcast configs
 */
export async function getAllPodcastConfigs(): Promise<PodcastConfig[]> {
  return await dbUtils.getAll<PodcastConfig>(podcastConfigs);
}

/**
 * Returns a podcast config by ID
 */
export async function getPodcastConfigById(id: string): Promise<PodcastConfig | null> {
  return await dbUtils.findById<PodcastConfig>(podcastConfigs, podcastConfigs.id, id);
}

/**
 * Returns a podcast config by podcast ID
 */
export async function getPodcastConfigByPodcastId(podcastId: string): Promise<PodcastConfig | null> {
  const results = await dbUtils.findBy<PodcastConfig>(podcastConfigs, eq(podcastConfigs.podcast_id, podcastId));
  return results.length > 0 ? results[0] : null;
}

/**
 * Creates a new podcast config
 */
export async function createPodcastConfig(data: NewPodcastConfig): Promise<PodcastConfig> {
  return await dbUtils.create<PodcastConfig, NewPodcastConfig>(podcastConfigs, data);
}

/**
 * Updates a podcast config
 */
export async function updatePodcastConfig(id: string, data: Partial<NewPodcastConfig>): Promise<PodcastConfig | null> {
  return await dbUtils.updateById<PodcastConfig, NewPodcastConfig>(podcastConfigs, podcastConfigs.id, id, data);
}

/**
 * Updates a podcast config by podcast ID
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
 * Deletes a podcast config
 */
export async function deletePodcastConfig(id: string): Promise<boolean> {
  return await dbUtils.deleteById(podcastConfigs, podcastConfigs.id, id);
}

/**
 * Checks if a podcast config exists for a podcast
 */
export async function podcastConfigExists(podcastId: string): Promise<boolean> {
  return await dbUtils.exists(podcastConfigs, eq(podcastConfigs.podcast_id, podcastId));
}

/**
 * Returns the total count of podcast configs
 */
export async function getPodcastConfigCount(): Promise<number> {
  return await dbUtils.count(podcastConfigs);
} 