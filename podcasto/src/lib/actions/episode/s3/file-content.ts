'use server';

import { s3FileService } from '@/lib/services/s3-file-service';
import {
  requireAdminForS3,
  validateS3Key,
  wrapS3Action,
  successResult,
  errorResult
} from './shared';
import type { S3FileActionResult, S3FileContent } from './types';

/**
 * Get content of a specific S3 file
 * Requires admin permissions
 */
export async function getS3FileContent(
  key: string
): Promise<S3FileActionResult<S3FileContent>> {
  return wrapS3Action<S3FileContent>('getting file content', async (): Promise<S3FileActionResult<S3FileContent>> => {
    // Admin check
    const adminError = await requireAdminForS3();
    if (adminError) return adminError as S3FileActionResult<S3FileContent>;

    // Validate key
    const keyError = validateS3Key(key);
    if (keyError) return keyError as S3FileActionResult<S3FileContent>;

    // Get content
    const { content, error } = await s3FileService.getFileContent(key);

    if (error) {
      return errorResult(error) as S3FileActionResult<S3FileContent>;
    }

    if (!content) {
      return errorResult('File content not found') as S3FileActionResult<S3FileContent>;
    }

    return successResult(content);
  });
}
