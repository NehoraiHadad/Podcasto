'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { ActionResponse } from './schemas';
import { PODCASTS_FOR_DISPLAY_TAG } from '@/lib/db/api/podcast-groups';

/**
 * Filter valid URLs from an array, removing empty strings
 * @param urls Array of URLs to filter
 * @returns Array of filtered non-empty URLs
 */
export async function filterUrls(urls?: string[]) {
  return urls?.filter(url => url && url.trim() !== '') || [];
}

/**
 * Revalidate all podcast-related paths to update UI cache
 * @param podcastId Optional specific podcast ID to revalidate
 */
export async function revalidatePodcastPaths(podcastId?: string) {
  revalidateTag(PODCASTS_FOR_DISPLAY_TAG);

  // Always revalidate common podcast paths
  revalidatePath('/admin/podcasts');
  revalidatePath('/podcasts');
  
  // If a specific podcast ID is provided, revalidate its detail page
  if (podcastId) {
    revalidatePath(`/admin/podcasts/${podcastId}`);
  }
}

/**
 * Handle common error patterns in server actions
 * @param error The error that occurred
 * @returns A standardized error response
 */
export async function handleActionError(error: unknown): Promise<ActionResponse> {
  console.error('Error in podcast server action:', error);
  
  if (error instanceof z.ZodError) {
    // Format all Zod validation errors
    const formattedErrors = error.errors.map(err => {
      return `${err.path.join('.')} - ${err.message}`;
    }).join('; ');
    
    console.error('Validation errors:', formattedErrors);
    
    return {
      success: false,
      error: 'Validation error: ' + formattedErrors,
    };
  }
  
  if (error instanceof Error) {
    console.error('Error details:', error.message, error.stack);
    
    return {
      success: false,
      error: `Error: ${error.message}`,
    };
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred',
  };
}

/**
 * Check if a podcast title conflicts with existing podcasts
 * @param allPodcasts Array of all podcasts
 * @param title Title to check
 * @param currentId Current podcast ID to exclude (for updates)
 * @returns Error message if conflicting, or null if no conflict
 */
export async function checkTitleConflict(
  allPodcasts: Array<{ id: string; title: string }>,
  title: string,
  currentId?: string
): Promise<string | null> {
  // Check if a podcast with the same title already exists (excluding the current podcast)
  const conflictingPodcast = allPodcasts.find(
    p => (!currentId || p.id !== currentId) && 
         p.title.toLowerCase() === title.toLowerCase()
  );
  
  if (conflictingPodcast) {
    return 'A podcast with this title already exists';
  }
  
  return null;
} 