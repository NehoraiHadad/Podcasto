import { getCloudFrontUrl } from './cloudfront-utils';
import { AWS_CONSTANTS } from '@/lib/constants/aws-constants';

/**
 * Utility functions for building correct S3 URLs
 * Supports both CloudFront CDN URLs and direct S3 URLs
 *
 * Note: These are synchronous utility functions, not server actions.
 * Import these in server components or server actions as needed.
 */

export interface S3UrlConfig {
  bucket: string;
  region: string;
  key: string;
}

export type UrlSource = 'cloudfront' | 's3';

export interface BestUrlResult {
  url: string | null;
  source: UrlSource;
  error?: string;
}

/**
 * Build a proper S3 URL based on bucket, region, and key
 * Handles different AWS regions and URL formats correctly
 */
export function buildS3Url({ bucket, region, key }: S3UrlConfig): string {
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
export function getS3Config(): { bucket: string; region: string } {
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
export function buildS3UrlFromEnv(key: string): string {
  const { bucket, region } = getS3Config();
  return buildS3Url({ bucket, region, key });
}

/**
 * Parse an S3 URL to extract bucket, region, and key
 * Handles both virtual-hosted-style and path-style URLs
 */
export function parseS3Url(url: string): { bucket: string; region?: string; key: string } | null {
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
export function validateS3Url(url: string): boolean {
  const parsed = parseS3Url(url);
  if (!parsed) {
    return false;
  }

  try {
    const { bucket: configBucket } = getS3Config();
    return parsed.bucket === configBucket;
  } catch {
    // If config is not available, we can't validate
    return false;
  }
}

/**
 * Gets the best URL for an S3 object with CloudFront CDN support
 * Prefers CloudFront if configured, falls back to S3
 *
 * Architecture:
 * - CloudFront enabled: Returns CloudFront URL for edge caching
 * - CloudFront disabled: Returns direct S3 URL
 *
 * @param s3KeyOrUrl - S3 key, s3:// URI, or HTTPS URL
 * @param usePresigned - Whether to generate presigned S3 URL (only used for S3 fallback)
 * @returns Object with URL, source, and optional error
 *
 * @example
 * // With CloudFront enabled
 * await getBestUrlForS3Object("podcasts/123/audio.mp3")
 * // Returns: { url: "https://d123.cloudfront.net/podcasts/123/audio.mp3", source: "cloudfront" }
 *
 * // With CloudFront disabled
 * await getBestUrlForS3Object("podcasts/123/audio.mp3")
 * // Returns: { url: "https://bucket.s3.region.amazonaws.com/podcasts/123/audio.mp3", source: "s3" }
 */
export function getBestUrlForS3Object(
  s3KeyOrUrl: string,
  usePresigned: boolean = false
): BestUrlResult {
  try {
    // Strategy 1: Try CloudFront first (if enabled)
    if (AWS_CONSTANTS.USE_CLOUDFRONT) {
      const cloudFrontUrl = getCloudFrontUrl(s3KeyOrUrl);

      if (cloudFrontUrl) {
        console.log('[getBestUrlForS3Object] Using CloudFront URL:', cloudFrontUrl);
        return {
          url: cloudFrontUrl,
          source: 'cloudfront'
        };
      }

      console.warn('[getBestUrlForS3Object] CloudFront enabled but failed to generate URL, falling back to S3');
    }

    // Strategy 2: Fallback to S3 (presigned or public)
    console.log('[getBestUrlForS3Object] Using S3 URL (CloudFront not available)');

    // Extract S3 key from various input formats
    let s3Key = s3KeyOrUrl;

    // If it's an s3:// URI, extract the key
    if (s3KeyOrUrl.startsWith('s3://')) {
      const withoutProtocol = s3KeyOrUrl.substring(5);
      const firstSlashIndex = withoutProtocol.indexOf('/');
      if (firstSlashIndex !== -1) {
        s3Key = withoutProtocol.substring(firstSlashIndex + 1);
      }
    }

    // If it's already an HTTPS URL, return it directly
    if (s3KeyOrUrl.startsWith('http://') || s3KeyOrUrl.startsWith('https://')) {
      return {
        url: s3KeyOrUrl,
        source: 's3'
      };
    }

    const { bucket, region } = getS3Config();

    // Generate presigned URL if requested (more secure, but expires)
    if (usePresigned) {
      // Presigned URLs require AWS SDK and credentials
      // This would need to be implemented with getSignedUrl from @aws-sdk/s3-request-presigner
      // For now, fall back to public URL
      console.warn('[getBestUrlForS3Object] Presigned URLs not yet implemented in getBestUrlForS3Object');
    }

    // Build public S3 URL
    const s3Url = buildS3Url({ bucket, region, key: s3Key });

    return {
      url: s3Url,
      source: 's3'
    };

  } catch (error) {
    console.error('[getBestUrlForS3Object] Error:', error);
    return {
      url: null,
      source: 's3',
      error: error instanceof Error ? error.message : 'Unknown error generating URL'
    };
  }
}

/**
 * Extract S3 key from s3:// URI (helper function)
 * @param s3Uri - S3 URI in format s3://bucket/key/path
 * @returns S3 key or null if invalid
 */
export function extractKeyFromS3Uri(s3Uri: string): string | null {
  if (!s3Uri.startsWith('s3://')) {
    return null;
  }

  const withoutProtocol = s3Uri.substring(5);
  const firstSlashIndex = withoutProtocol.indexOf('/');

  if (firstSlashIndex === -1) {
    return null;
  }

  return withoutProtocol.substring(firstSlashIndex + 1);
} 