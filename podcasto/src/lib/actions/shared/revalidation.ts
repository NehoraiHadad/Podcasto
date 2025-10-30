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
export function revalidatePodcast(podcastId: string): void {
  revalidateTag(PODCASTS_FOR_DISPLAY_TAG);
  revalidatePath(`/podcasts/${podcastId}`);
  revalidatePath('/podcasts');
  revalidatePath('/admin/podcasts');
  revalidatePath(`/admin/podcasts/${podcastId}`);
}

/**
 * Revalidate all paths related to a specific episode
 */
export function revalidateEpisode(podcastId: string, episodeId: string): void {
  revalidatePath(`/podcasts/${podcastId}/episodes/${episodeId}`);
  revalidatePath(`/podcasts/${podcastId}`);
  revalidatePath('/admin/episodes');
  revalidatePath('/admin/podcasts');
}

/**
 * Revalidate subscription-related paths
 */
export function revalidateSubscriptions(userId?: string): void {
  revalidatePath('/profile');
  revalidatePath('/podcasts');
  if (userId) {
    revalidatePath(`/profile/${userId}`);
  }
}

/**
 * Revalidate admin dashboard paths
 */
export function revalidateAdmin(): void {
  revalidatePath('/admin');
  revalidatePath('/admin/podcasts');
  revalidatePath('/admin/episodes');
  revalidatePath('/admin/users');
}

/**
 * Revalidate all paths (use sparingly)
 */
export function revalidateAll(): void {
  revalidatePath('/', 'layout');
}
