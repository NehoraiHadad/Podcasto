'use server';

import { s3FileService, type S3FileInfo, type S3FileContent } from '@/lib/services/s3-file-service';
import { checkIsAdmin } from '@/lib/actions/admin-actions';
import { revalidatePath } from 'next/cache';

export interface S3FileActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * List all S3 files for an episode
 * Requires admin permissions
 */
export async function listEpisodeS3Files(
  episodeId: string,
  podcastId: string
): Promise<S3FileActionResult<S3FileInfo[]>> {
  try {
    // Check admin permissions
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required'
      };
    }

    const { files, error } = await s3FileService.listEpisodeFiles(podcastId, episodeId);

    if (error) {
      return {
        success: false,
        error
      };
    }

    return {
      success: true,
      data: files
    };
  } catch (error) {
    console.error('[S3_FILE_ACTIONS] Error listing files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files'
    };
  }
}

/**
 * Get content of a specific S3 file
 * Requires admin permissions
 */
export async function getS3FileContent(
  key: string
): Promise<S3FileActionResult<S3FileContent>> {
  try {
    // Check admin permissions
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required'
      };
    }

    // Validate key to prevent path traversal
    if (!key.startsWith('podcasts/')) {
      return {
        success: false,
        error: 'Invalid file path'
      };
    }

    const { content, error } = await s3FileService.getFileContent(key);

    if (error) {
      return {
        success: false,
        error
      };
    }

    if (!content) {
      return {
        success: false,
        error: 'File content not found'
      };
    }

    return {
      success: true,
      data: content
    };
  } catch (error) {
    console.error('[S3_FILE_ACTIONS] Error getting file content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file content'
    };
  }
}

/**
 * Delete a specific S3 file
 * Requires admin permissions
 */
export async function deleteS3File(
  key: string,
  episodeId?: string
): Promise<S3FileActionResult<void>> {
  try {
    // Check admin permissions
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required'
      };
    }

    // Validate key to prevent unauthorized deletions
    if (!key.startsWith('podcasts/')) {
      return {
        success: false,
        error: 'Invalid file path'
      };
    }

    const { success, error } = await s3FileService.deleteFile(key);

    if (!success) {
      return {
        success: false,
        error
      };
    }

    // Revalidate episode page if episodeId provided
    if (episodeId) {
      revalidatePath(`/admin/episodes/${episodeId}`);
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('[S3_FILE_ACTIONS] Error deleting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    };
  }
}

/**
 * Delete all S3 files for an episode
 * Requires admin permissions
 */
export async function deleteAllEpisodeS3Files(
  episodeId: string,
  podcastId: string
): Promise<S3FileActionResult<{ deletedCount: number }>> {
  try {
    // Check admin permissions
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required'
      };
    }

    const { success, deletedCount, error } = await s3FileService.deleteAllEpisodeFiles(
      podcastId,
      episodeId
    );

    if (!success) {
      return {
        success: false,
        error
      };
    }

    // Revalidate episode page
    revalidatePath(`/admin/episodes/${episodeId}`);
    revalidatePath('/admin/episodes');

    return {
      success: true,
      data: { deletedCount: deletedCount || 0 }
    };
  } catch (error) {
    console.error('[S3_FILE_ACTIONS] Error deleting all files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete all files'
    };
  }
}

/**
 * Get file metadata
 * Requires admin permissions
 */
export async function getS3FileMetadata(
  key: string
): Promise<S3FileActionResult<{ size: number; contentType?: string; lastModified?: Date }>> {
  try {
    // Check admin permissions
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required'
      };
    }

    // Validate key
    if (!key.startsWith('podcasts/')) {
      return {
        success: false,
        error: 'Invalid file path'
      };
    }

    const { metadata, error } = await s3FileService.getFileMetadata(key);

    if (error || !metadata) {
      return {
        success: false,
        error: error || 'Metadata not found'
      };
    }

    return {
      success: true,
      data: metadata
    };
  } catch (error) {
    console.error('[S3_FILE_ACTIONS] Error getting file metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file metadata'
    };
  }
}
