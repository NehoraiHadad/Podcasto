'use server';

import { s3FileService } from '@/lib/services/s3-file-service';
import { requireAdminForS3, wrapS3Action, successResult, errorResult } from './shared';
import type { S3FileActionResult, S3FileInfo } from './types';

/**
 * List all S3 files for an episode
 * Requires admin permissions
 */
export async function listEpisodeS3Files(
  episodeId: string,
  podcastId: string
): Promise<S3FileActionResult<S3FileInfo[]>> {
  return wrapS3Action<S3FileInfo[]>('listing files', async (): Promise<S3FileActionResult<S3FileInfo[]>> => {
    // Admin check
    const adminError = await requireAdminForS3();
    if (adminError) return adminError as S3FileActionResult<S3FileInfo[]>;

    // List files
    const { files, error } = await s3FileService.listEpisodeFiles(podcastId, episodeId);

    if (error) {
      return errorResult(error) as S3FileActionResult<S3FileInfo[]>;
    }

    return successResult(files);
  });
}
