import 'server-only';

import { nowUTC } from '@/lib/utils/date/server';
import { podcastGroups, podcastLanguages, podcasts } from '../../schema';
import { eq, and } from 'drizzle-orm';
import * as dbUtils from '../../utils';
import { db } from '../../index';
import type {
  PodcastGroup,
  NewPodcastGroup,
  PodcastLanguage,
  NewPodcastLanguage,
  AddLanguageVariantData
} from './types';

/**
 * Create a new podcast group
 *
 * @param data - Podcast group data
 * @returns The created podcast group
 */
export async function createPodcastGroup(data: NewPodcastGroup): Promise<PodcastGroup> {
  return await dbUtils.create<PodcastGroup, NewPodcastGroup>(podcastGroups, data);
}

/**
 * Update a podcast group
 *
 * @param id - Podcast group ID
 * @param data - Partial podcast group data to update
 * @returns The updated podcast group or null if not found
 */
export async function updatePodcastGroup(
  id: string,
  data: Partial<NewPodcastGroup>
): Promise<PodcastGroup | null> {
  const updateData = {
    ...data,
    updated_at: nowUTC()
  };

  return await dbUtils.updateById<PodcastGroup, typeof updateData>(
    podcastGroups,
    podcastGroups.id,
    id,
    updateData
  );
}

/**
 * Delete a podcast group (will cascade to podcast_languages)
 *
 * @param id - Podcast group ID
 * @returns true if deleted, false if not found
 */
export async function deletePodcastGroup(id: string): Promise<boolean> {
  return await dbUtils.deleteById(podcastGroups, podcastGroups.id, id);
}

/**
 * Add a language variant to a podcast group
 *
 * @param data - Language variant data
 * @returns The created podcast language variant
 */
export async function addLanguageVariant(data: AddLanguageVariantData): Promise<PodcastLanguage> {
  const languageData: NewPodcastLanguage = {
    podcast_group_id: data.podcast_group_id,
    language_code: data.language_code,
    title: data.title,
    description: data.description,
    cover_image: data.cover_image,
    is_primary: data.is_primary ?? false,
    podcast_id: data.podcast_id
  };

  return await dbUtils.create<PodcastLanguage, NewPodcastLanguage>(
    podcastLanguages,
    languageData
  );
}

/**
 * Update a language variant
 *
 * @param id - Podcast language ID
 * @param data - Partial language variant data to update
 * @returns The updated podcast language or null if not found
 */
export async function updateLanguageVariant(
  id: string,
  data: Partial<NewPodcastLanguage>
): Promise<PodcastLanguage | null> {
  const updateData = {
    ...data,
    updated_at: nowUTC()
  };

  return await dbUtils.updateById<PodcastLanguage, typeof updateData>(
    podcastLanguages,
    podcastLanguages.id,
    id,
    updateData
  );
}

/**
 * Remove a language variant from a podcast group
 *
 * @param id - Podcast language ID
 * @returns true if deleted, false if not found
 */
export async function removeLanguageVariant(id: string): Promise<boolean> {
  return await dbUtils.deleteById(podcastLanguages, podcastLanguages.id, id);
}

/**
 * Set a language as primary for a podcast group
 * Unsets any other primary language in the group
 *
 * @param groupId - Podcast group ID
 * @param languageCode - Language code to set as primary
 * @returns true if successful, false if language not found
 */
export async function setPrimaryLanguage(
  groupId: string,
  languageCode: string
): Promise<boolean> {
  return await db.transaction(async (tx) => {
    // Unset all primary flags in the group
    await tx
      .update(podcastLanguages)
      .set({ is_primary: false, updated_at: nowUTC() })
      .where(eq(podcastLanguages.podcast_group_id, groupId));

    // Set the specified language as primary
    const result = await tx
      .update(podcastLanguages)
      .set({ is_primary: true, updated_at: nowUTC() })
      .where(
        and(
          eq(podcastLanguages.podcast_group_id, groupId),
          eq(podcastLanguages.language_code, languageCode)
        )
      )
      .returning();

    return result.length > 0;
  });
}

/**
 * Link an existing podcast to a podcast group
 *
 * @param podcastId - Podcast ID
 * @param groupId - Podcast group ID
 * @param languageCode - Language code for this podcast
 * @returns The updated podcast or null if not found
 */
export async function linkPodcastToGroup(
  podcastId: string,
  groupId: string,
  languageCode: string
): Promise<boolean> {
  const result = await db
    .update(podcasts)
    .set({
      podcast_group_id: groupId,
      language_code: languageCode,
      migration_status: 'migrated',
      updated_at: nowUTC()
    })
    .where(eq(podcasts.id, podcastId))
    .returning();

  return result.length > 0;
}

/**
 * Unlink a podcast from its podcast group
 *
 * @param podcastId - Podcast ID
 * @returns true if successful, false if not found
 */
export async function unlinkPodcastFromGroup(podcastId: string): Promise<boolean> {
  const result = await db
    .update(podcasts)
    .set({
      podcast_group_id: null,
      // NOTE: language_code is preserved (NOT NULL field)
      migration_status: 'legacy',
      updated_at: nowUTC()
    })
    .where(eq(podcasts.id, podcastId))
    .returning();

  return result.length > 0;
}
