import { createPostProcessingService } from '@/lib/services/post-processing';

// Define a type for the service for clarity, assuming its return type
type PostProcessingService = ReturnType<typeof createPostProcessingService>;

/**
 * Creates and returns the post-processing service instance if environment 
 * variables are properly configured.
 * Returns null if configuration is missing.
 */
export function getPostProcessingService(): PostProcessingService | null {
  const aiApiKey = process.env.GEMINI_API_KEY;
  const s3Region = process.env.AWS_REGION;
  const s3Bucket = process.env.S3_BUCKET_NAME;
  const s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  // Check if required environment variables are available
  if (!aiApiKey || !s3Region || !s3Bucket || !s3AccessKeyId || !s3SecretAccessKey) {
    console.error('[SERVICE_FACTORY] Missing required environment variables for post-processing');
    return null;
  }
  
  try {
    // Create and return the post-processing service
    return createPostProcessingService({
      s3: {
        region: s3Region,
        bucket: s3Bucket,
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      },
      ai: {
        provider: 'gemini',
        apiKey: aiApiKey,
      },
    });
  } catch (error) {
    console.error('[SERVICE_FACTORY] Error creating post-processing service:', error);
    return null;
  }
} 