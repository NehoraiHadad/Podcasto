'use server';

/**
 * Shared revalidation utilities for cache management.
 * Centralizes path revalidation logic to ensure consistency.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { PODCASTS_FOR_DISPLAY_TAG } from '@/lib/db/api/podcast-groups';

/**
 * Revalidate all paths related to a specific podcast
 */
export async function revalidatePodcast(podcastId: string): Promise<void> {
  revalidateTag(PODCASTS_FOR_DISPLAY_TAG);
  revalidatePath(`/podcasts/${podcastId}`);
  revalidatePath('/podcasts');
  revalidatePath('/admin/podcasts');
  revalidatePath(`/admin/podcasts/${podcastId}`);
}

/**
 * Revalidate all paths related to a specific episode
 */
export async function revalidateEpisode(
  podcastId: string,
  episodeId: string
): Promise<void> {
  revalidatePath(`/podcasts/${podcastId}/episodes/${episodeId}`);
  revalidatePath(`/podcasts/${podcastId}`);
  revalidatePath('/admin/episodes');
  revalidatePath('/admin/podcasts');
}

/**
 * Revalidate subscription-related paths
 */
export async function revalidateSubscriptions(userId?: string): Promise<void> {
  revalidatePath('/profile');
  revalidatePath('/podcasts');
  if (userId) {
    revalidatePath(`/profile/${userId}`);
  }
}

/**
 * Revalidate admin dashboard paths
 */
export async function revalidateAdmin(): Promise<void> {
  revalidatePath('/admin');
  revalidatePath('/admin/podcasts');
  revalidatePath('/admin/episodes');
  revalidatePath('/admin/users');
}

/**
 * Revalidate all paths (use sparingly)
 */
export async function revalidateAll(): Promise<void> {
  revalidatePath('/', 'layout');
}
