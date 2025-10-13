'use server';

import { createS3Service } from '@/lib/services/s3-service';
import { revalidatePath } from 'next/cache';
import {
  requireAdminForS3,
  validateS3Key,
  wrapS3Action,
  successResult,
  errorResult
} from './shared';
import type { S3FileActionResult } from './types';

/**
 * Delete a specific S3 file
 * Requires admin permissions
 */
export async function deleteS3File(
  key: string,
  episodeId?: string
): Promise<S3FileActionResult<void>> {
  return wrapS3Action<void>('deleting file', async (): Promise<S3FileActionResult<void>> => {
    // Admin check
    const adminError = await requireAdminForS3();
    if (adminError) return adminError as S3FileActionResult<void>;

    // Validate key to prevent unauthorized deletions
    const keyError = validateS3Key(key);
    if (keyError) return keyError as S3FileActionResult<void>;

    // Create S3 service instance
    const s3Service = createS3Service();

    // Delete file
    const { success, error } = await s3Service.deleteFile(key);

    if (!success) {
      return errorResult(error || 'Failed to delete file') as S3FileActionResult<void>;
    }

    // Revalidate episode page if episodeId provided
    if (episodeId) {
      revalidatePath(`/admin/episodes/${episodeId}`);
    }

    return successResult();
  });
}
