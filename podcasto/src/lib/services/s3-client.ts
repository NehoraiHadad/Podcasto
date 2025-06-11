import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client } from '@/lib/utils/s3-utils';
import { buildS3UrlFromEnv } from '@/lib/utils/s3-url-utils';

export class S3Client {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || '';
    
    if (!this.bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is required');
    }
  }

  /**
   * Uploads audio buffer to S3 and returns the public URL
   */
  async uploadAudio(
    audioBuffer: Buffer,
    podcastId: string,
    episodeId: string,
    format: 'mp3' | 'wav' = 'mp3'
  ): Promise<string> {
    try {
      const { client, error } = await createS3Client();
      if (!client || error) {
        throw new Error(`Failed to create S3 client: ${error}`);
      }

      const timestamp = new Date().toISOString();
      const key = `podcasts/${podcastId}/${episodeId}/podcast.${format}`;
      
      console.log(`[S3_CLIENT] Uploading audio to: ${key}`);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: audioBuffer,
        ContentType: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
        Metadata: {
          'podcast-id': podcastId,
          'episode-id': episodeId,
          'upload-timestamp': timestamp,
          'generated-by': 'google-tts'
        }
      });

      await client.send(command);
      
      // Construct public URL using utility function
      const publicUrl = await buildS3UrlFromEnv(key);
      
      console.log(`[S3_CLIENT] Successfully uploaded audio: ${publicUrl}`);
      return publicUrl;

    } catch (error) {
      console.error('[S3_CLIENT] Error uploading audio:', error);
      throw new Error(`Failed to upload audio to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Uploads any file to S3
   */
  async uploadFile(
    content: Buffer | string,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const { client, error } = await createS3Client();
      if (!client || error) {
        throw new Error(`Failed to create S3 client: ${error}`);
      }

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: content,
        ContentType: contentType,
        Metadata: metadata
      });

      await client.send(command);
      
      // Construct public URL using utility function
      const publicUrl = await buildS3UrlFromEnv(key);
      
      console.log(`[S3_CLIENT] Successfully uploaded file: ${publicUrl}`);
      return publicUrl;

    } catch (error) {
      console.error('[S3_CLIENT] Error uploading file:', error);
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 