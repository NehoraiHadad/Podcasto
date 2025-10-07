import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client } from '@/lib/utils/s3-utils';

export interface S3FileInfo {
  key: string;
  name: string;
  type: 'content' | 'audio' | 'transcript' | 'image' | 'other';
  size: number;
  lastModified: Date;
  url?: string;
}

export interface S3FileContent {
  content: string | null;
  signedUrl?: string;
  isText: boolean;
}

/**
 * Service for managing S3 files for episodes
 */
export class S3FileService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private initError?: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || '';

    if (!this.bucketName) {
      this.initError = 'S3_BUCKET_NAME environment variable is required';
    }
  }

  /**
   * Initialize S3 client if not already initialized
   */
  private async ensureClient(): Promise<{ success: boolean; error?: string }> {
    if (this.initError) {
      return { success: false, error: this.initError };
    }

    if (!this.s3Client) {
      const { client, error } = await createS3Client();
      if (!client || error) {
        return { success: false, error: error || 'Failed to create S3 client' };
      }
      this.s3Client = client;
    }

    return { success: true };
  }

  /**
   * List all files for an episode
   */
  async listEpisodeFiles(
    podcastId: string,
    episodeId: string
  ): Promise<{ files: S3FileInfo[]; error?: string }> {
    const clientResult = await this.ensureClient();
    if (!clientResult.success || !this.s3Client) {
      return { files: [], error: clientResult.error };
    }

    try {
      const prefix = `podcasts/${podcastId}/${episodeId}/`;

      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix
      });

      const response = await this.s3Client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        return { files: [] };
      }

      const files: S3FileInfo[] = response.Contents
        .filter(obj => obj.Key && obj.Key !== prefix) // Exclude folder itself
        .map(obj => {
          const key = obj.Key!;
          const name = key.split('/').pop() || key;
          const type = this.getFileType(key);

          return {
            key,
            name,
            type,
            size: obj.Size || 0,
            lastModified: obj.LastModified || new Date()
          };
        })
        .sort((a, b) => {
          // Sort by type first, then by name
          const typeOrder = { content: 0, audio: 1, transcript: 2, image: 3, other: 4 };
          const typeCompare = typeOrder[a.type] - typeOrder[b.type];
          if (typeCompare !== 0) return typeCompare;
          return a.name.localeCompare(b.name);
        });

      return { files };
    } catch (error) {
      console.error('[S3_FILE_SERVICE] Error listing files:', error);
      return {
        files: [],
        error: error instanceof Error ? error.message : 'Failed to list files'
      };
    }
  }

  /**
   * Get file content (for text files) or signed URL (for binary files)
   */
  async getFileContent(
    key: string
  ): Promise<{ content: S3FileContent | null; error?: string }> {
    const clientResult = await this.ensureClient();
    if (!clientResult.success || !this.s3Client) {
      return { content: null, error: clientResult.error };
    }

    try {
      const isTextFile = this.isTextFile(key);

      if (isTextFile) {
        // For text files, fetch and return content
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });

        const response = await this.s3Client.send(command);
        const content = await response.Body?.transformToString('utf-8');

        return {
          content: {
            content: content || null,
            isText: true
          }
        };
      } else {
        // For binary files, generate signed URL
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });

        const signedUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: 900 // 15 minutes
        });

        return {
          content: {
            content: null,
            signedUrl,
            isText: false
          }
        };
      }
    } catch (error) {
      console.error('[S3_FILE_SERVICE] Error getting file content:', error);
      return {
        content: null,
        error: error instanceof Error ? error.message : 'Failed to get file content'
      };
    }
  }

  /**
   * Delete a single file
   */
  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    const clientResult = await this.ensureClient();
    if (!clientResult.success || !this.s3Client) {
      return { success: false, error: clientResult.error };
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);

      console.log(`[S3_FILE_SERVICE] Successfully deleted file: ${key}`);
      return { success: true };
    } catch (error) {
      console.error('[S3_FILE_SERVICE] Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  }

  /**
   * Delete all files for an episode
   */
  async deleteAllEpisodeFiles(
    podcastId: string,
    episodeId: string
  ): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    const { files, error: listError } = await this.listEpisodeFiles(podcastId, episodeId);

    if (listError) {
      return { success: false, error: listError };
    }

    if (files.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const file of files) {
      const { success, error } = await this.deleteFile(file.key);
      if (success) {
        deletedCount++;
      } else {
        errors.push(`${file.name}: ${error}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        deletedCount,
        error: `Failed to delete some files: ${errors.join(', ')}`
      };
    }

    return { success: true, deletedCount };
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<{
    metadata: { size: number; contentType?: string; lastModified?: Date } | null;
    error?: string
  }> {
    const clientResult = await this.ensureClient();
    if (!clientResult.success || !this.s3Client) {
      return { metadata: null, error: clientResult.error };
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);

      return {
        metadata: {
          size: response.ContentLength || 0,
          contentType: response.ContentType,
          lastModified: response.LastModified
        }
      };
    } catch (error) {
      console.error('[S3_FILE_SERVICE] Error getting file metadata:', error);
      return {
        metadata: null,
        error: error instanceof Error ? error.message : 'Failed to get file metadata'
      };
    }
  }

  /**
   * Determine file type based on key path
   */
  private getFileType(key: string): S3FileInfo['type'] {
    if (key.includes('/content.json')) return 'content';
    if (key.includes('/audio/')) return 'audio';
    if (key.includes('/transcripts/')) return 'transcript';
    if (key.includes('/images/')) return 'image';
    return 'other';
  }

  /**
   * Check if file is a text file
   */
  private isTextFile(key: string): boolean {
    const extension = key.split('.').pop()?.toLowerCase();
    return ['txt', 'json', 'md', 'log'].includes(extension || '');
  }
}

/**
 * Create and export singleton instance
 */
export const s3FileService = new S3FileService();
