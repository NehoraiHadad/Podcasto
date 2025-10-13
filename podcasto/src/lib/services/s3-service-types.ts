/**
 * Type definitions for unified S3 service
 */

/**
 * Configuration for S3 service operations
 */
export interface S3ServiceConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Information about an S3 file
 */
export interface S3FileInfo {
  key: string;
  name: string;
  type: 'content' | 'audio' | 'transcript' | 'image' | 'other';
  size: number;
  lastModified: Date;
  url?: string;
}

/**
 * Content of an S3 file (text or binary)
 */
export interface S3FileContent {
  content: string | null;
  signedUrl?: string;
  isText: boolean;
}

/**
 * Detailed result for S3 deletion operations
 */
export interface DetailedDeleteResult {
  success: boolean;
  deletedCount: number;
  failedKeys?: string[];
  warnings?: string[];
  error?: string;
}

/**
 * File metadata from S3
 */
export interface S3FileMetadata {
  size: number;
  contentType?: string;
  lastModified?: Date;
}
