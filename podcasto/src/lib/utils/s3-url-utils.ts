'use server';

/**
 * Utility functions for building correct S3 URLs
 */

export interface S3UrlConfig {
  bucket: string;
  region: string;
  key: string;
}

/**
 * Build a proper S3 URL based on bucket, region, and key
 * Handles different AWS regions and URL formats correctly
 */
export async function buildS3Url({ bucket, region, key }: S3UrlConfig): Promise<string> {
  // Remove any leading slashes from the key
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  
  // For us-east-1, AWS allows both formats but the regional format is preferred
  // For other regions, the regional format is required
  if (region === 'us-east-1') {
    // Use the regional format for consistency
    return `https://${bucket}.s3.${region}.amazonaws.com/${cleanKey}`;
  } else {
    // For all other regions, use the regional format
    return `https://${bucket}.s3.${region}.amazonaws.com/${cleanKey}`;
  }
}

/**
 * Get S3 configuration from environment variables with validation
 */
export async function getS3Config(): Promise<{ bucket: string; region: string }> {
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  
  if (!bucket) {
    throw new Error('S3_BUCKET_NAME environment variable is required');
  }
  
  if (!region) {
    throw new Error('AWS_REGION environment variable is required');
  }
  
  return { bucket, region };
}

/**
 * Build S3 URL using environment variables
 */
export async function buildS3UrlFromEnv(key: string): Promise<string> {
  const { bucket, region } = await getS3Config();
  return await buildS3Url({ bucket, region, key });
}

/**
 * Parse an S3 URL to extract bucket, region, and key
 * Handles both virtual-hosted-style and path-style URLs
 */
export async function parseS3Url(url: string): Promise<{ bucket: string; region?: string; key: string } | null> {
  try {
    const urlObj = new URL(url);
    
    // Check if it's an S3 URL
    if (!urlObj.hostname.includes('amazonaws.com') || !urlObj.hostname.includes('s3')) {
      return null;
    }
    
    // Virtual-hosted-style URL: https://bucket.s3.region.amazonaws.com/key
    const virtualHostedMatch = urlObj.hostname.match(/^(.+)\.s3\.([^.]+)\.amazonaws\.com$/);
    if (virtualHostedMatch) {
      return {
        bucket: virtualHostedMatch[1],
        region: virtualHostedMatch[2],
        key: urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname
      };
    }
    
    // Legacy virtual-hosted-style URL: https://bucket.s3.amazonaws.com/key
    const legacyVirtualMatch = urlObj.hostname.match(/^(.+)\.s3\.amazonaws\.com$/);
    if (legacyVirtualMatch) {
      return {
        bucket: legacyVirtualMatch[1],
        key: urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname
      };
    }
    
    // Path-style URL: https://s3.region.amazonaws.com/bucket/key
    const pathStyleMatch = urlObj.hostname.match(/^s3\.([^.]+)\.amazonaws\.com$/);
    if (pathStyleMatch) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        return {
          bucket: pathParts[0],
          region: pathStyleMatch[1],
          key: pathParts.slice(1).join('/')
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing S3 URL:', error);
    return null;
  }
}

/**
 * Validate that an S3 URL is accessible from the configured bucket
 */
export async function validateS3Url(url: string): Promise<boolean> {
  const parsed = await parseS3Url(url);
  if (!parsed) {
    return false;
  }
  
  try {
    const { bucket: configBucket } = await getS3Config();
    return parsed.bucket === configBucket;
  } catch {
    // If config is not available, we can't validate
    return false;
  }
} 