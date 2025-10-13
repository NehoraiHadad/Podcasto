/**
 * Storage Service Interfaces
 * Type-safe contracts for S3 file storage operations
 */

import type {
  S3ServiceConfig,
  S3FileInfo,
  S3FileContent,
  DetailedDeleteResult,
  S3FileMetadata,
} from '../s3-service-types';

/**
 * S3 Storage Service Interface
 * Handles file upload, download, listing, and deletion operations with AWS S3
 */
export interface IS3Service {
  /**
   * Lists all files in an episode folder
   * @param podcastId - Podcast identifier
   * @param episodeId - Episode identifier
   * @returns Array of file information objects
   * @throws Never throws - returns error in result object
   */
  listEpisodeFiles(
    podcastId: string,
    episodeId: string
  ): Promise<{ files: S3FileInfo[]; error?: string }>;

  /**
   * Gets the content of a file from S3
   * For text files, returns the content as string
   * For binary files, returns a signed URL for download
   * @param key - S3 object key
   * @returns File content or signed URL
   * @throws Never throws - returns error in result object
   */
  getFileContent(key: string): Promise<{ content: S3FileContent | null; error?: string }>;

  /**
   * Gets metadata for a file in S3
   * @param key - S3 object key
   * @returns File metadata (size, content type, last modified)
   * @throws Never throws - returns error in result object
   */
  getFileMetadata(key: string): Promise<{ metadata: S3FileMetadata | null; error?: string }>;

  /**
   * Uploads an image to S3 with auto-generated filename
   * @param podcastId - Podcast identifier
   * @param episodeId - Episode identifier
   * @param imageData - Image buffer to upload
   * @param mimeType - MIME type of the image
   * @returns Upload result with URL or error
   * @throws Never throws - returns error in result object
   */
  uploadImageToS3(
    podcastId: string,
    episodeId: string,
    imageData: Buffer,
    mimeType: string
  ): Promise<{ url?: string; error?: string }>;

  /**
   * Deletes a single file from S3
   * @param key - S3 object key
   * @returns Success status and any error
   * @throws Never throws - returns error in result object
   */
  deleteFile(key: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Deletes all files in an episode folder
   * @param podcastId - Podcast identifier
   * @param episodeId - Episode identifier
   * @returns Detailed deletion result with count and failures
   * @throws Never throws - returns error in result object
   */
  deleteAllEpisodeFiles(
    podcastId: string,
    episodeId: string
  ): Promise<{ success: boolean; deletedCount: number; error?: string }>;

  /**
   * Deletes an entire episode folder and its contents
   * @param podcastId - Podcast identifier
   * @param episodeId - Episode identifier
   * @returns Detailed deletion result
   * @throws Never throws - returns error in result object
   */
  deleteEpisodeFromS3(podcastId: string, episodeId: string): Promise<DetailedDeleteResult>;

  /**
   * Deletes an entire podcast folder and all episode contents
   * @param podcastId - Podcast identifier
   * @returns Detailed deletion result
   * @throws Never throws - returns error in result object
   */
  deletePodcastFromS3(podcastId: string): Promise<DetailedDeleteResult>;

  /**
   * Gets transcript content from S3 for an episode
   * @param podcastId - Podcast identifier
   * @param episodeId - Episode identifier
   * @returns Transcript text or null if not found
   * @throws May throw if S3 operation fails
   */
  getTranscriptFromS3(podcastId: string, episodeId: string): Promise<string | null>;
}

/**
 * Factory function type for creating S3 service instances
 */
export type S3ServiceFactory = (config?: Partial<S3ServiceConfig>) => IS3Service;
