import 'server-only';

import { db } from '../../index';
import { podcasts } from '../../schema';
import { eq, isNull } from 'drizzle-orm';
import * as dbUtils from '../../utils';
import type { Podcast } from './types';

/**
 * Get podcast by ID (basic data only)
 *
 * @param id - Podcast ID (UUID)
 * @returns The podcast if found, null otherwise
 *
 * @example
 * ```typescript
 * const podcast = await getPodcastById('123-456');
 * if (podcast) {
 *   console.log(podcast.title);
 * }
 * ```
 */
export async function getPodcastById(id: string): Promise<Podcast | null> {
  return await dbUtils.findById<Podcast>(podcasts, podcasts.id, id);
}

/**
 * Get all podcasts (basic data only, without relations)
 *
 * @returns Array of all podcasts
 *
 * @example
 * ```typescript
 * const allPodcasts = await getAllPodcastsBasic();
 * console.log(`Total podcasts: ${allPodcasts.length}`);
 * ```
 */
export async function getAllPodcastsBasic(): Promise<Podcast[]> {
  return await dbUtils.getAll<Podcast>(podcasts);
}

/**
 * Get podcasts that are not associated with any podcast group
 *
 * @returns Array of podcasts eligible for migration
 *
 * @example
 * ```typescript
 * const eligiblePodcasts = await getPodcastsEligibleForMigration();
 * console.log(`Eligible podcasts: ${eligiblePodcasts.length}`);
 * ```
 */
export async function getPodcastsEligibleForMigration(): Promise<Podcast[]> {
  return await dbUtils.findBy<Podcast>(podcasts, isNull(podcasts.podcast_group_id));
}

/**
 * Get paginated podcasts (basic data only, without relations)
 *
 * @param page - Page number (1-based)
 * @param pageSize - Number of records per page
 * @returns Array of paginated podcasts
 *
 * @example
 * ```typescript
 * const page1 = await getPodcastsPaginatedBasic(1, 10);
 * const page2 = await getPodcastsPaginatedBasic(2, 10);
 * ```
 */
export async function getPodcastsPaginatedBasic(
  page: number = 1,
  pageSize: number = 10
): Promise<Podcast[]> {
  return await dbUtils.getPaginated<Podcast>(podcasts, page, pageSize);
}

/**
 * Get total count of podcasts
 *
 * @returns The total number of podcasts
 *
 * @example
 * ```typescript
 * const total = await getPodcastCount();
 * console.log(`Total podcasts: ${total}`);
 * ```
 */
export async function getPodcastCount(): Promise<number> {
  return await dbUtils.count(podcasts);
}

/**
 * Check if a podcast exists by title
 *
 * @param title - Podcast title to check
 * @returns true if podcast exists, false otherwise
 *
 * @example
 * ```typescript
 * const exists = await podcastExistsByTitle('Tech Talk');
 * if (exists) {
 *   console.log('Podcast already exists');
 * }
 * ```
 */
export async function podcastExistsByTitle(title: string): Promise<boolean> {
  return await dbUtils.exists(podcasts, eq(podcasts.title, title));
}

/**
 * Get podcast by ID with podcastConfigs relation
 * This is the standard query to use for edit forms and pages that need full podcast configuration
 *
 * @param id - Podcast ID (UUID)
 * @returns The podcast with podcastConfigs relation, or null if not found
 *
 * @example
 * ```typescript
 * const podcast = await getPodcastByIdWithConfig('123-456');
 * if (podcast) {
 *   const config = podcast.podcastConfigs?.[0];
 *   console.log(config?.podcast_format); // 'single-speaker' | 'multi-speaker'
 * }
 * ```
 */
export async function getPodcastByIdWithConfig(id: string) {
  return await db.query.podcasts.findFirst({
    where: eq(podcasts.id, id),
    with: {
      podcastConfigs: true,
    },
  });
}
