'use server';

import { podcastsApi } from '@/lib/db/api';
import { ActionResponse } from './schemas';
import { requireAdmin } from './auth';
import { handleActionError, revalidatePodcastPaths } from './utils';

/**
 * Deletes a podcast by ID
 */
export async function deletePodcast(id: string): Promise<ActionResponse> {
  try {
    // Check if the user has admin permissions
    await requireAdmin();
    
    // Delete the podcast
    const success = await podcastsApi.deletePodcast(id);
    
    if (!success) {
      return {
        success: false,
        error: 'Failed to delete podcast',
      };
    }
    
    // Revalidate cached paths
    revalidatePodcastPaths();
    
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
} 