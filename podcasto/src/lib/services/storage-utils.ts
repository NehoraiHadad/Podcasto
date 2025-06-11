import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { TranscriptFileUtils, createTranscriptFileUtils } from './transcript-utils';
import { buildS3Url } from '@/lib/utils/s3-url-utils';

/**
 * Configuration for S3 storage operations
 */
export interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Utilities for handling S3 storage operations
 */
export class S3StorageUtils {
  private s3Client: S3Client;
  private s3Bucket: string;
  private s3Region: string;
  private transcriptUtils: TranscriptFileUtils;

  /**
   * Initialize S3 storage utilities
   */
  constructor(config: S3StorageConfig) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    
    this.s3Bucket = config.bucket;
    this.s3Region = config.region;
    
    // Initialize transcript utilities
    this.transcriptUtils = createTranscriptFileUtils(this.s3Client, this.s3Bucket);
  }

  /**
   * Get transcript file from S3
   */
  async getTranscriptFromS3(podcastId: string, episodeId: string): Promise<string | null> {
    return this.transcriptUtils.getTranscriptsFromS3(podcastId, episodeId);
  }

  /**
   * Upload episode image to S3
   */
  async uploadImageToS3(
    podcastId: string, 
    episodeId: string, 
    imageData: Buffer,
    mimeType: string
  ): Promise<string> {
    // Generate a unique filename
    const extension = mimeType.split('/')[1] || 'jpg';
    const filename = `cover-${randomUUID()}.${extension}`;
    
    // Construct the image path
    const imageKey = `podcasts/${podcastId}/${episodeId}/images/${filename}`;
    
    // Upload the image
    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: imageKey,
      Body: imageData,
      ContentType: mimeType,
    });
    
    await this.s3Client.send(command);
    
    // Return the public URL using the utility function
    return await buildS3Url({
      bucket: this.s3Bucket,
      region: this.s3Region,
      key: imageKey
    });
  }

  /**
   * Delete episode folder from S3
   */
  async deleteEpisodeFromS3(podcastId: string, episodeId: string): Promise<{
    success: boolean;
    deletedCount?: number;
    error?: string;
  }> {
    try {
      // Construct the folder prefix
      const prefix = `podcasts/${podcastId}/${episodeId}/`;
      
      // List all objects with the episode prefix
      const objects = await this.listObjectsWithPrefix(prefix);
      
      if (!objects || objects.length === 0) {
        console.log(`[S3_STORAGE] No objects found for episode ${episodeId}`);
        return { success: true, deletedCount: 0 };
      }
      
      // Delete all objects in the episode folder
      let deletedCount = 0;
      for (const object of objects) {
        await this.deleteObject(object.Key!);
        deletedCount++;
      }
      
      console.log(`[S3_STORAGE] Successfully deleted ${deletedCount} objects for episode ${episodeId}`);
      
      return {
        success: true,
        deletedCount
      };
    } catch (error) {
      console.error(`[S3_STORAGE] Error deleting episode ${episodeId} from S3:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Delete podcast folder from S3
   */
  async deletePodcastFromS3(podcastId: string): Promise<{
    success: boolean;
    deletedCount?: number;
    error?: string;
  }> {
    try {
      // Construct the folder prefix
      const prefix = `podcasts/${podcastId}/`;
      
      // List all objects with the podcast prefix
      const objects = await this.listObjectsWithPrefix(prefix);
      
      if (!objects || objects.length === 0) {
        console.log(`[S3_STORAGE] No objects found for podcast ${podcastId}`);
        return { success: true, deletedCount: 0 };
      }
      
      // Delete all objects in the podcast folder
      let deletedCount = 0;
      for (const object of objects) {
        await this.deleteObject(object.Key!);
        deletedCount++;
      }
      
      console.log(`[S3_STORAGE] Successfully deleted ${deletedCount} objects for podcast ${podcastId}`);
      
      return {
        success: true,
        deletedCount
      };
    } catch (error) {
      console.error(`[S3_STORAGE] Error deleting podcast ${podcastId} from S3:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * List objects with a specific prefix
   */
  private async listObjectsWithPrefix(prefix: string) {
    const command = new ListObjectsV2Command({
      Bucket: this.s3Bucket,
      Prefix: prefix
    });
    
    const response = await this.s3Client.send(command);
    return response.Contents;
  }
  
  /**
   * Delete an object from S3
   */
  private async deleteObject(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.s3Bucket,
      Key: key
    });
    
    await this.s3Client.send(command);
  }
}

/**
 * Create S3 storage utilities with the specified configuration
 */
export function createS3StorageUtils(config: S3StorageConfig): S3StorageUtils {
  return new S3StorageUtils(config);
} 