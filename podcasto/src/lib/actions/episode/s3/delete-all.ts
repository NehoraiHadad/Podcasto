'use server';

import { s3FileService } from '@/lib/services/s3-file-service';
import { revalidatePath } from 'next/cache';
import {
  requireAdminForS3,
  wrapS3Action,
  successResult,
  errorResult
} from './shared';
import type { S3FileActionResult } from './types';

/**
 * Delete all S3 files for an episode
 * Requires admin permissions
 */
export async function deleteAllEpisodeS3Files(
  episodeId: string,
  podcastId: string
): Promise<S3FileActionResult<{ deletedCount: number }>> {
  return wrapS3Action<{ deletedCount: number }>('deleting all files', async (): Promise<S3FileActionResult<{ deletedCount: number }>> => {
    // Admin check
    const adminError = await requireAdminForS3();
    if (adminError) return adminError as S3FileActionResult<{ deletedCount: number }>;

    // Delete all files
    const { success, deletedCount, error } = await s3FileService.deleteAllEpisodeFiles(
      podcastId,
      episodeId
    );

    if (!success) {
      return errorResult(error || 'Failed to delete all files') as S3FileActionResult<{ deletedCount: number }>;
    }

    // Revalidate episode pages
    revalidatePath(`/admin/episodes/${episodeId}`);
    revalidatePath('/admin/episodes');

    return successResult({ deletedCount: deletedCount || 0 });
  });
}
