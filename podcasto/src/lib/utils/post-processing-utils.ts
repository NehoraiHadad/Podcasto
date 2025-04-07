'use server';

import type { AIServiceConfig, ProviderType } from '@/lib/ai/types';

/**
 * Configuration for post-processing service
 */
export interface PostProcessingConfig {
  s3?: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  ai?: AIServiceConfig;
}

/**
 * Get post-processing service configuration from environment variables
 */
export async function getPostProcessingConfig(aiRequired: boolean = true, s3Required: boolean = true): Promise<{
  config: PostProcessingConfig;
  error?: string;
}> {
  try {
    const config: PostProcessingConfig = {};
    
    // Get S3 config if required
    if (s3Required) {
      const s3Region = process.env.AWS_REGION;
      const s3Bucket = process.env.S3_BUCKET_NAME;
      const s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      
      // Check if required environment variables are available
      if (!s3Region || !s3Bucket || !s3AccessKeyId || !s3SecretAccessKey) {
        return {
          config,
          error: 'Missing required S3 environment variables'
        };
      }
      
      config.s3 = {
        region: s3Region,
        bucket: s3Bucket,
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      };
    }
    
    // Get AI config if required
    if (aiRequired) {
      const aiApiKey = process.env.GEMINI_API_KEY;
      
      if (!aiApiKey) {
        return {
          config,
          error: 'Missing required AI API key'
        };
      }
      
      const provider: ProviderType = 'gemini';
      config.ai = {
        provider,
        apiKey: aiApiKey,
      };
    }
    
    return { config };
  } catch (error) {
    console.error('Error creating post-processing config:', error);
    return {
      config: {},
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Create a post-processing service with the given configuration
 */
export async function createPostProcessingWithConfig(aiRequired: boolean = true, s3Required: boolean = true) {
  try {
    // Get configuration
    const { config, error } = await getPostProcessingConfig(aiRequired, s3Required);
    
    if (error) {
      throw new Error(error);
    }
    
    // Import required modules
    const { createPostProcessingService } = await import('@/lib/services/post-processing');
    
    // Ensure config has required properties and they're not undefined
    if (!config.s3 && s3Required) {
      throw new Error('S3 configuration is required but missing');
    }
    
    if (!config.ai && aiRequired) {
      throw new Error('AI configuration is required but missing');
    }
    
    // Create and return the service with properly typed config
    return createPostProcessingService({
      s3: config.s3!,
      ai: config.ai!
    });
  } catch (error) {
    console.error('Error creating post-processing service:', error);
    throw error;
  }
}

/**
 * Extract image data from a base64 data URL
 */
export async function extractImageDataFromUrl(imageDataUrl: string): Promise<{ mimeType: string; buffer: Buffer } | null> {
  try {
    const matches = imageDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return null;
    }
    
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    return { mimeType, buffer };
  } catch (error) {
    console.error('Error extracting image data from URL:', error);
    return null;
  }
}

/**
 * Extract usable description from episode for image generation
 */
export async function extractEpisodeDescription(episode: { description?: string | null; metadata?: string | null }): Promise<string | null> {
  // Check if we have a description to work with
  let description = episode.description;
  
  // If the description appears to be an error message, try to get the original description from metadata
  if (description?.includes('failed') || description?.includes('error') || description?.startsWith('Image generation failed')) {
    console.log('[IMAGE_DESCRIPTION] Description looks like an error message, checking metadata for original description');
    
    if (episode.metadata) {
      try {
        const metadata = JSON.parse(episode.metadata);
        
        // If metadata has original_description, use that instead
        if (metadata.original_description) {
          console.log('[IMAGE_DESCRIPTION] Using original description from metadata');
          description = metadata.original_description;
        }
      } catch (parseError) {
        console.warn('[IMAGE_DESCRIPTION] Could not parse metadata JSON', parseError);
      }
    }
  }
  
  return description || null;
} 