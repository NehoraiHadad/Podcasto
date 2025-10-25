'use server';

import { deleteEpisode } from './core-actions';
import { logError, getErrorMessage } from '@/lib/utils/error-utils';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BULK_DELETE');

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
export async function deleteEpisodesBulk({
  episodeIds,
}: BulkDeleteInput): Promise<BulkDeleteResult> {
  const result: BulkDeleteResult = {
    success: false,
    deleted: [],
    failed: [],
  };

  try {
    // Validate input
    if (!episodeIds || !Array.isArray(episodeIds) || episodeIds.length === 0) {
      throw new Error('episodeIds must be a non-empty array');
    }

    // Validate UUID format for each ID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidIds = episodeIds.filter((id) => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      throw new Error(`Invalid UUID format for IDs: ${invalidIds.join(', ')}`);
    }

    // Remove duplicates
    const uniqueIds = [...new Set(episodeIds)];

    // Auth validation is handled by deleteEpisode() which calls requireAdmin()

    logger.info('Starting bulk delete', { count: uniqueIds.length });

    // Process each episode deletion
    for (const episodeId of uniqueIds) {
      try {
        await deleteEpisode(episodeId);
        result.deleted.push(episodeId);
        logger.debug('Successfully deleted episode', { episodeId });
      } catch (error) {
        const errorMessage = getErrorMessage(error, 'Unknown error');
        result.failed.push({ id: episodeId, error: errorMessage });
        logger.error('Failed to delete episode', error, { episodeId });
      }
    }

    // Determine overall success
    result.success = result.failed.length === 0;

    logger.info('Bulk delete completed', {
      deleted: result.deleted.length,
      failed: result.failed.length,
    });

    return result;
  } catch (error) {
    logError('BULK_DELETE', error);

    // Return error result
    return {
      success: false,
      deleted: [],
      failed: [
        {
          id: 'bulk-operation',
          error: getErrorMessage(error, 'Unknown error'),
        },
      ],
    };
  }
}