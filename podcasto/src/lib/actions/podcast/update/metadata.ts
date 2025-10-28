'use server';

/**
 * Podcast metadata update operations.
 * Handles basic podcast information updates (title, description, images).
 */

import { podcastsApi } from '@/lib/db/api';
import type { PodcastUpdateData } from '../schemas';

/**
 * Updates the basic podcast metadata fields.
 * Updates title, description, cover image, image style, and language code.
 *
 * @param data - Podcast update data containing metadata fields
 * @returns Updated podcast record or null if update fails
 */
export async function updatePodcastMetadata({
  id,
  title,
  description,
  cover_image,
  image_style,
  languageCode
}: PodcastUpdateData) {
  return await podcastsApi.updatePodcast(id, {
    title,
    description,
    cover_image,
    image_style,
    language_code: languageCode,
    updated_at: new Date()
  });
}
