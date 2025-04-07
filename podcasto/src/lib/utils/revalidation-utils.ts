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
 * Revalidate paths related to an episode
 */
export async function revalidateEpisodePaths(episodeId: string, podcastId?: string | null): Promise<void> {
  // Always revalidate the episodes list and specific episode page
  const paths = [
    '/admin/episodes',
    `/admin/episodes/${episodeId}`,
  ];
  
  // If we have a podcast ID, revalidate the podcast page too
  if (podcastId) {
    paths.push(`/admin/podcasts/${podcastId}`);
  }
  
  await revalidatePaths(paths);
} 