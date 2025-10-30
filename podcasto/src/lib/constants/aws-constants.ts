/**
 * AWS Service Configuration Constants
 * Centralized configuration for AWS services including CloudFront CDN and S3
 */

/**
 * AWS CloudFront and S3 configuration
 * CloudFront acts as a CDN layer in front of S3 for optimized global content delivery
 */
export const AWS_CONSTANTS = {
  // CloudFront CDN Configuration
  CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN || '',

  // S3 Storage Configuration (used as CloudFront origin and fallback)
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'podcasto-podcasts',
  S3_REGION: process.env.AWS_REGION || 'us-east-1',

  // Feature flag: Use CloudFront if domain is configured
  USE_CLOUDFRONT: Boolean(process.env.CLOUDFRONT_DOMAIN),

  // CloudFront cache settings (for reference - actual TTL configured in AWS)
  CLOUDFRONT_DEFAULT_TTL_SECONDS: 86400, // 1 day
  CLOUDFRONT_MAX_TTL_SECONDS: 31536000, // 1 year
} as const;

/**
 * Get the CloudFront domain name
 * @returns CloudFront distribution domain or empty string if not configured
 */
export function getCloudFrontDomain(): string {
  return AWS_CONSTANTS.CLOUDFRONT_DOMAIN;
}

/**
 * Check if CloudFront is enabled
 * @returns true if CloudFront domain is configured
 */
export function isCloudFrontEnabled(): boolean {
  return AWS_CONSTANTS.USE_CLOUDFRONT;
}

/**
 * Get S3 bucket configuration
 * @returns Object with S3 bucket name and region
 */
export function getS3Config(): { bucket: string; region: string } {
  return {
    bucket: AWS_CONSTANTS.S3_BUCKET_NAME,
    region: AWS_CONSTANTS.S3_REGION,
  };
}
