import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { TranscriptFileUtils, createTranscriptFileUtils } from './transcript-utils';

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
    
    // Return the public URL
    return `https://${this.s3Bucket}.s3.amazonaws.com/${imageKey}`;
  }
}

/**
 * Create S3 storage utilities with the specified configuration
 */
export function createS3StorageUtils(config: S3StorageConfig): S3StorageUtils {
  return new S3StorageUtils(config);
} 