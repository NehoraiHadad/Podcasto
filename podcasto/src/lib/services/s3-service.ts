import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { buildEpisodeFolderPrefix, buildEpisodeImagePath } from '@/lib/utils/s3-path-utils';
import { buildS3Url } from '@/lib/utils/s3-url-utils';
import { TranscriptFileUtils } from './transcript-utils';
import { S3BulkOperations } from './s3-service-bulk-operations';
import { S3ServiceInitializer } from './s3-service-init';
import { getFileType, isTextFile, sortS3Files } from './s3-service-helpers';
import type { S3ServiceConfig, S3FileInfo, S3FileContent, DetailedDeleteResult, S3FileMetadata } from './s3-service-types';
import type { IS3Service } from './interfaces';

/**
 * Unified S3 service for all S3 operations
 * Combines functionality from S3FileService and StorageUtils
 */
export class S3Service implements IS3Service {
  private s3Client: S3Client | null = null;
  private config: S3ServiceConfig;
  private transcriptUtils: TranscriptFileUtils | null = null;
  private bulkOps: S3BulkOperations | null = null;
  private initError?: string;

  constructor(config?: Partial<S3ServiceConfig>) {
    this.config = {
      region: config?.region || process.env.AWS_REGION || '',
      bucket: config?.bucket || process.env.S3_BUCKET_NAME || '',
      accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || ''
    };
    this.initError = S3ServiceInitializer.validateConfig(this.config);
  }

  private async ensureClient(): Promise<{ success: boolean; error?: string }> {
    if (this.initError) return { success: false, error: this.initError };
    if (this.s3Client) return { success: true };

    const { client, error } = await S3ServiceInitializer.initializeClient(this.config);
    if (!client) return { success: false, error };

    this.s3Client = client;
    const helpers = S3ServiceInitializer.createHelpers(client, this.config.bucket);
    this.transcriptUtils = helpers.transcriptUtils;
    this.bulkOps = helpers.bulkOps;
    return { success: true };
  }

  async listEpisodeFiles(podcastId: string, episodeId: string): Promise<{ files: S3FileInfo[]; error?: string }> {
    const clientResult = await this.ensureClient();
    if (!clientResult.success || !this.s3Client) return { files: [], error: clientResult.error };

    try {
      const prefix = buildEpisodeFolderPrefix(podcastId, episodeId);
      const response = await this.s3Client.send(new ListObjectsV2Command({ Bucket: this.config.bucket, Prefix: prefix }));
      if (!response.Contents || response.Contents.length === 0) return { files: [] };

      const files: S3FileInfo[] = response.Contents
        .filter(obj => obj.Key && obj.Key !== prefix)
        .map(obj => ({
          key: obj.Key!,
          name: obj.Key!.split('/').pop() || obj.Key!,
          type: getFileType(obj.Key!),
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date()
        }));

      return { files: sortS3Files(files) };
    } catch (error) {
      console.error('[S3_SERVICE] Error listing files:', error);
      return { files: [], error: error instanceof Error ? error.message : 'Failed to list files' };
    }
  }

  async getFileContent(key: string): Promise<{ content: S3FileContent | null; error?: string }> {
    const clientResult = await this.ensureClient();
    if (!clientResult.success || !this.s3Client) return { content: null, error: clientResult.error };

    try {
      const command = new GetObjectCommand({ Bucket: this.config.bucket, Key: key });

      if (isTextFile(key)) {
        const response = await this.s3Client.send(command);
        const content = await response.Body?.transformToString('utf-8');
        return { content: { content: content || null, isText: true } };
      } else {
        const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
        return { content: { content: null, signedUrl, isText: false } };
      }
    } catch (error) {
      console.error('[S3_SERVICE] Error getting file content:', error);
      return { content: null, error: error instanceof Error ? error.message : 'Failed to get file content' };
    }
  }

  async getFileMetadata(key: string): Promise<{ metadata: S3FileMetadata | null; error?: string }> {
    const clientResult = await this.ensureClient();
    if (!clientResult.success || !this.s3Client) return { metadata: null, error: clientResult.error };

    try {
      const response = await this.s3Client.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }));
      return {
        metadata: {
          size: response.ContentLength || 0,
          contentType: response.ContentType,
          lastModified: response.LastModified
        }
      };
    } catch (error) {
      return { metadata: null, error: error instanceof Error ? error.message : 'Failed to get metadata' };
    }
  }

  async uploadImageToS3(podcastId: string, episodeId: string, imageData: Buffer, mimeType: string) {
    const clientResult = await this.ensureClient();
    if (!clientResult.success || !this.s3Client) return { error: clientResult.error };

    try {
      const extension = mimeType.split('/')[1] || 'jpg';
      const filename = `cover-${randomUUID()}.${extension}`;
      const imageKey = buildEpisodeImagePath(podcastId, episodeId, filename);

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: imageKey,
        Body: imageData,
        ContentType: mimeType
      }));

      const url = await buildS3Url({ bucket: this.config.bucket, region: this.config.region, key: imageKey });
      return { url };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to upload image' };
    }
  }

  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    const clientResult = await this.ensureClient();
    if (!clientResult.success || !this.s3Client) return { success: false, error: clientResult.error };

    try {
      await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
      console.log(`[S3_SERVICE] Deleted file: ${key}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete file' };
    }
  }

  async deleteAllEpisodeFiles(podcastId: string, episodeId: string): Promise<{
    success: boolean;
    deletedCount: number;
    error?: string;
  }> {
    await this.ensureClient();
    return this.bulkOps?.deleteAllEpisodeFiles(podcastId, episodeId) || { success: false, deletedCount: 0, error: 'Not initialized' };
  }

  async deleteEpisodeFromS3(podcastId: string, episodeId: string): Promise<DetailedDeleteResult> {
    await this.ensureClient();
    return this.bulkOps?.deleteEpisodeFromS3(podcastId, episodeId) || { success: false, deletedCount: 0, error: 'Not initialized' };
  }

  async deletePodcastFromS3(podcastId: string): Promise<DetailedDeleteResult> {
    await this.ensureClient();
    return this.bulkOps?.deletePodcastFromS3(podcastId) || { success: false, deletedCount: 0, error: 'Not initialized' };
  }

  async getTranscriptFromS3(podcastId: string, episodeId: string): Promise<string | null> {
    await this.ensureClient();
    return this.transcriptUtils?.getTranscriptsFromS3(podcastId, episodeId) || null;
  }
}

/**
 * Factory function to create an S3Service instance
 * @param config - Optional partial configuration
 * @returns IS3Service interface implementation
 */
export function createS3Service(config?: Partial<S3ServiceConfig>): IS3Service {
  return new S3Service(config);
}

/** @deprecated Use createS3Service() factory function instead of singleton */
export const s3Service = createS3Service();

export type { S3ServiceConfig, S3FileInfo, S3FileContent, DetailedDeleteResult, S3FileMetadata };
