/**
 * Image URL Utilities
 *
 * Helper functions to convert legacy S3 URLs to CloudFront URLs
 * and ensure images are served through the CDN.
 */

import { AWS_CONSTANTS } from '@/lib/constants/aws-constants';
import { extractS3Key, buildCloudFrontUrl } from './cloudfront-utils';

/**
 * Converts any S3 URL (direct or legacy) to CloudFront URL if CloudFront is enabled.
 * If CloudFront is not configured, returns the original URL.
 *
 * @param imageUrl - The image URL from database (may be S3 direct URL)
 * @returns CloudFront URL if configured, otherwise original URL
 *
 * @example
 * // Input: "https://podcasto-podcasts.s3.amazonaws.com/podcasts/123/cover.jpg"
 * // Output: "https://d1rfoqxjgv1gpt.cloudfront.net/podcasts/123/cover.jpg"
 */
export function getBestImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  // If URL is not from our S3 bucket, return as-is (e.g., placeholder images)
  const s3BucketName = AWS_CONSTANTS.S3_BUCKET_NAME;
  if (!imageUrl.includes(s3BucketName) && !imageUrl.includes('s3.amazonaws.com')) {
    return imageUrl;
  }

  // Debug logging
  if (typeof window === 'undefined') {
    // Server-side logging
    console.log('[getBestImageUrl] CLOUDFRONT_DOMAIN:', AWS_CONSTANTS.CLOUDFRONT_DOMAIN);
    console.log('[getBestImageUrl] USE_CLOUDFRONT:', AWS_CONSTANTS.USE_CLOUDFRONT);
  }

  // If CloudFront is not configured, return original URL
  // NOTE: This will fail if S3 bucket is restricted to CloudFront only
  if (!AWS_CONSTANTS.USE_CLOUDFRONT) {
    console.warn(
      'CloudFront is not configured but S3 bucket may be restricted. ' +
      'Add CLOUDFRONT_DOMAIN environment variable.',
      'Current CLOUDFRONT_DOMAIN:', AWS_CONSTANTS.CLOUDFRONT_DOMAIN
    );
    return imageUrl;
  }

  // Extract S3 key from the URL
  const s3Key = extractS3Key(imageUrl);
  if (!s3Key) {
    console.error('Failed to extract S3 key from image URL:', imageUrl);
    return imageUrl; // Fallback to original
  }

  // Build CloudFront URL
  const cloudfrontUrl = buildCloudFrontUrl(s3Key);
  if (!cloudfrontUrl) {
    console.error('Failed to build CloudFront URL for S3 key:', s3Key);
    return imageUrl; // Fallback to original
  }

  return cloudfrontUrl;
}

/**
 * Batch convert multiple image URLs to CloudFront URLs
 *
 * @param imageUrls - Array of image URLs from database
 * @returns Array of CloudFront URLs (or original if conversion fails)
 */
export function getBestImageUrls(imageUrls: (string | null | undefined)[]): (string | null)[] {
  return imageUrls.map(getBestImageUrl);
}

/**
 * Check if an image URL is already a CloudFront URL
 *
 * @param imageUrl - The image URL to check
 * @returns true if URL is already using CloudFront
 */
export function isCloudFrontUrl(imageUrl: string | null | undefined): boolean {
  if (!imageUrl || !AWS_CONSTANTS.CLOUDFRONT_DOMAIN) return false;
  return imageUrl.includes(AWS_CONSTANTS.CLOUDFRONT_DOMAIN);
}

/**
 * Check if an image URL needs migration to CloudFront
 *
 * @param imageUrl - The image URL to check
 * @returns true if URL is S3 direct and should be migrated
 */
export function needsCloudFrontMigration(imageUrl: string | null | undefined): boolean {
  if (!imageUrl || !AWS_CONSTANTS.USE_CLOUDFRONT) return false;

  const s3BucketName = AWS_CONSTANTS.S3_BUCKET_NAME;
  const isS3Url = imageUrl.includes(s3BucketName) || imageUrl.includes('s3.amazonaws.com');
  const isAlreadyCloudFront = isCloudFrontUrl(imageUrl);

  return isS3Url && !isAlreadyCloudFront;
}
