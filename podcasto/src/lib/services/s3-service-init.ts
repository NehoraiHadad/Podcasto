import { S3Client } from '@aws-sdk/client-s3';
import { createS3Client } from '@/lib/utils/s3-utils';
import { TranscriptFileUtils, createTranscriptFileUtils } from './transcript-utils';
import { S3BulkOperations } from './s3-service-bulk-operations';
import type { S3ServiceConfig } from './s3-service-types';

/**
 * Initialization utilities for S3Service
 */
export class S3ServiceInitializer {
  static validateConfig(config: S3ServiceConfig): string | undefined {
    if (!config.bucket) return 'S3_BUCKET_NAME is required';
    if (!config.region) return 'AWS_REGION is required';
    if (!config.accessKeyId || !config.secretAccessKey) return 'AWS credentials are required';
    return undefined;
  }

  static async initializeClient(config: S3ServiceConfig): Promise<{ client: S3Client | null; error?: string }> {
    const { client, error } = await createS3Client();

    if (!client || error) {
      if (config.accessKeyId && config.secretAccessKey) {
        return {
          client: new S3Client({
            region: config.region,
            credentials: {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey
            }
          })
        };
      }
      return { client: null, error: error || 'Failed to create S3 client' };
    }

    return { client };
  }

  static createHelpers(client: S3Client, bucket: string, region?: string): {
    transcriptUtils: TranscriptFileUtils;
    bulkOps: S3BulkOperations;
  } {
    return {
      transcriptUtils: createTranscriptFileUtils(client, bucket),
      bulkOps: new S3BulkOperations(client, bucket, region)
    };
  }
}
