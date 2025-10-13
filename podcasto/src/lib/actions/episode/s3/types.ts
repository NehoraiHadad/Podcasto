/**
 * Type definitions for S3 file actions
 */

// Re-export from service layer
export type { S3FileInfo, S3FileContent } from '@/lib/services/s3-file-service';

/**
 * Generic result type for S3 file actions
 */
export interface S3FileActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
