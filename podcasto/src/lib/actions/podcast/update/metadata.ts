'use server';

/**
 * Podcast metadata update operations.
 * Handles basic podcast information updates (title, description, images).
 */

import { podcastsApi } from '@/lib/db/api';
import type { PodcastUpdateData } from '../schemas';

/**
 * Updates the basic podcast metadata fields.
 * Only updates title, description, cover image, and image style.
 *
 * @param data - Podcast update data containing metadata fields
 * @returns Updated podcast record or null if update fails
 */
export async function updatePodcastMetadata({
  id,
  title,
  description,
  cover_image,
  image_style
}: PodcastUpdateData) {
  return await podcastsApi.updatePodcast(id, {
    title,
    description,
    cover_image,
    image_style,
    updated_at: new Date()
  });
}
