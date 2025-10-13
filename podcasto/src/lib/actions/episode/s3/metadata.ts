'use server';

import { createS3Service } from '@/lib/services/s3-service';
import {
  requireAdminForS3,
  validateS3Key,
  wrapS3Action,
  successResult,
  errorResult
} from './shared';
import type { S3FileActionResult } from './types';

/**
 * Get file metadata
 * Requires admin permissions
 */
export async function getS3FileMetadata(
  key: string
): Promise<S3FileActionResult<{ size: number; contentType?: string; lastModified?: Date }>> {
  return wrapS3Action<{ size: number; contentType?: string; lastModified?: Date }>('getting file metadata', async (): Promise<S3FileActionResult<{ size: number; contentType?: string; lastModified?: Date }>> => {
    // Admin check
    const adminError = await requireAdminForS3();
    if (adminError) return adminError as S3FileActionResult<{ size: number; contentType?: string; lastModified?: Date }>;

    // Validate key
    const keyError = validateS3Key(key);
    if (keyError) return keyError as S3FileActionResult<{ size: number; contentType?: string; lastModified?: Date }>;

    // Create S3 service instance
    const s3Service = createS3Service();

    // Get metadata
    const { metadata, error } = await s3Service.getFileMetadata(key);

    if (error || !metadata) {
      return errorResult(error || 'Metadata not found') as S3FileActionResult<{ size: number; contentType?: string; lastModified?: Date }>;
    }

    return successResult(metadata);
  });
}
