'use server';

import { deleteEpisode } from './core-actions';
import { logError } from '@/lib/utils/error-utils';

interface BulkDeleteResult {
  success: boolean;
  deleted: string[];
  failed: { id: string; error: string }[];
}

interface BulkDeleteInput {
  episodeIds: string[];
}

/**
 * Deletes multiple episodes in bulk
 * @param input Object containing array of episode IDs to delete
 * @returns Result object with success status, deleted IDs, and failed operations
 */
export async function deleteEpisodesBulk({ episodeIds }: BulkDeleteInput): Promise<BulkDeleteResult> {
  const result: BulkDeleteResult = {
    success: false,
    deleted: [],
    failed: []
  };

  try {
    // Validate input
    if (!episodeIds || !Array.isArray(episodeIds) || episodeIds.length === 0) {
      throw new Error('episodeIds must be a non-empty array');
    }

    // Validate UUID format for each ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidIds = episodeIds.filter(id => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      throw new Error(`Invalid UUID format for IDs: ${invalidIds.join(', ')}`);
    }

    // Remove duplicates
    const uniqueIds = [...new Set(episodeIds)];

    // Auth validation is handled by deleteEpisode() which calls requireAdmin()

    console.log(`[BULK_DELETE] Starting bulk delete for ${uniqueIds.length} episodes`);

    // Process each episode deletion
    for (const episodeId of uniqueIds) {
      try {
        await deleteEpisode(episodeId);
        result.deleted.push(episodeId);
        console.log(`[BULK_DELETE] Successfully deleted episode: ${episodeId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.failed.push({ id: episodeId, error: errorMessage });
        console.error(`[BULK_DELETE] Failed to delete episode ${episodeId}:`, error);
      }
    }

    // Determine overall success
    result.success = result.failed.length === 0;

    console.log(`[BULK_DELETE] Completed: ${result.deleted.length} deleted, ${result.failed.length} failed`);

    return result;

  } catch (error) {
    logError('deleteEpisodesBulk', error);
    
    // Return error result
    return {
      success: false,
      deleted: [],
      failed: [{ id: 'bulk-operation', error: error instanceof Error ? error.message : 'Unknown error' }]
    };
  }
}