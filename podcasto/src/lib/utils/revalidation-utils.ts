'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalidate multiple paths at once
 */
export async function revalidatePaths(paths: string[]): Promise<void> {
  for (const path of paths) {
    revalidatePath(path);
  }
}

/**
 * Revalidate all podcast-related pages
 * Commonly used pattern across 80+ locations
 */
export async function revalidatePodcastPages(): Promise<void> {
  await revalidatePaths(['/admin/podcasts', '/podcasts']);
}

/**
 * Revalidate paths related to an episode
 */
export async function revalidateEpisodePaths(
  episodeId: string,
  podcastId?: string | null
): Promise<void> {
  const paths = ['/admin/episodes', `/admin/episodes/${episodeId}`];

  if (podcastId) {
    paths.push(`/admin/podcasts/${podcastId}`, `/podcasts/${podcastId}`);
  }

  await revalidatePaths(paths);
}

/**
 * Revalidate paths related to a specific podcast
 */
export async function revalidatePodcastPaths(podcastId: string): Promise<void> {
  await revalidatePaths([
    '/admin/podcasts',
    `/admin/podcasts/${podcastId}`,
    '/podcasts',
    `/podcasts/${podcastId}`,
  ]);
}

/**
 * Revalidate admin pages
 */
export async function revalidateAdminPages(): Promise<void> {
  await revalidatePaths(['/admin', '/admin/podcasts', '/admin/episodes']);
} 