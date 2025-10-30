import { AWS_CONSTANTS } from '@/lib/constants/aws-constants';

/**
 * CloudFront CDN Utilities
 *
 * Provides functions for generating CloudFront URLs for S3 objects.
 * CloudFront acts as a CDN layer in front of S3, providing:
 * - 50-70% latency reduction for global users
 * - 60-80% bandwidth cost savings
 * - Edge caching and DDoS protection
 * - Better scalability
 *
 * Architecture:
 * User → CloudFront Edge → S3 Origin (only on cache miss)
 */

/**
 * Extracts the S3 key from various URL formats
 * Handles:
 * - s3://bucket/key/path
 * - https://bucket.s3.region.amazonaws.com/key/path
 * - https://cloudfront.net/key/path
 *
 * @param url - The URL to parse
 * @returns The S3 object key (path within bucket) or null if invalid
 */
export function extractS3Key(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Handle s3:// URIs
  if (url.startsWith('s3://')) {
    const withoutProtocol = url.substring(5);
    const firstSlashIndex = withoutProtocol.indexOf('/');

    if (firstSlashIndex === -1) {
      return null;
    }

    return withoutProtocol.substring(firstSlashIndex + 1);
  }

  // Handle HTTPS URLs (S3 or CloudFront)
  try {
    const urlObj = new URL(url);

    // Remove leading slash from pathname
    const key = urlObj.pathname.startsWith('/')
      ? urlObj.pathname.slice(1)
      : urlObj.pathname;

    return key || null;
  } catch {
    return null;
  }
}

/**
 * Builds a CloudFront URL for an S3 object key
 *
 * @param s3Key - The S3 object key (e.g., "podcasts/123/456/audio/podcast.wav")
 * @returns CloudFront URL or null if CloudFront not configured
 *
 * @example
 * buildCloudFrontUrl("podcasts/123/456/audio.mp3")
 * // Returns: "https://d1234abcd.cloudfront.net/podcasts/123/456/audio.mp3"
 */
export function buildCloudFrontUrl(s3Key: string): string | null {
  if (!AWS_CONSTANTS.USE_CLOUDFRONT) {
    return null;
  }

  if (!s3Key) {
    return null;
  }

  // Remove leading slash if present (CloudFront expects clean paths)
  const cleanKey = s3Key.startsWith('/') ? s3Key.slice(1) : s3Key;

  // URL encode the path segments while preserving slashes
  const encodedKey = cleanKey
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return `https://${AWS_CONSTANTS.CLOUDFRONT_DOMAIN}/${encodedKey}`;
}

/**
 * Generates a CloudFront URL from various input formats
 * Accepts s3:// URIs, HTTPS S3 URLs, or direct S3 keys
 *
 * @param input - S3 URI, S3 URL, or S3 key
 * @returns CloudFront URL or null if CloudFront not configured or invalid input
 *
 * @example
 * getCloudFrontUrl("s3://podcasto-podcasts/podcasts/123/audio.mp3")
 * getCloudFrontUrl("https://podcasto-podcasts.s3.us-east-1.amazonaws.com/podcasts/123/audio.mp3")
 * getCloudFrontUrl("podcasts/123/audio.mp3")
 * // All return: "https://d1234abcd.cloudfront.net/podcasts/123/audio.mp3"
 */
export function getCloudFrontUrl(input: string): string | null {
  const s3Key = extractS3Key(input);

  if (!s3Key) {
    return null;
  }

  return buildCloudFrontUrl(s3Key);
}

/**
 * Validates that a CloudFront URL is properly formatted
 *
 * @param url - URL to validate
 * @returns true if URL is a valid CloudFront URL for this distribution
 */
export function isValidCloudFrontUrl(url: string): boolean {
  if (!AWS_CONSTANTS.USE_CLOUDFRONT || !url) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return (
      urlObj.protocol === 'https:' &&
      urlObj.hostname === AWS_CONSTANTS.CLOUDFRONT_DOMAIN
    );
  } catch {
    return false;
  }
}

/**
 * Gets CloudFront cache status from response headers (for debugging)
 * Call this with response headers from a fetch() to check cache hit/miss
 *
 * @param headers - Response headers from fetch
 * @returns Cache status string or null
 *
 * @example
 * const response = await fetch(cloudFrontUrl);
 * const cacheStatus = getCloudFrontCacheStatus(response.headers);
 * console.log('Cache Status:', cacheStatus); // "Hit from cloudfront" or "Miss from cloudfront"
 */
export function getCloudFrontCacheStatus(headers: Headers): string | null {
  return headers.get('x-cache') || null;
}

/**
 * Type guard to check if a URL source is from CloudFront
 */
export function isCloudFrontSource(source: string): source is 'cloudfront' {
  return source === 'cloudfront';
}
