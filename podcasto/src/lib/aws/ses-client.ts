import { SESClient } from '@aws-sdk/client-ses';

/**
 * SES Client for sending emails
 * Uses AWS credentials from environment variables:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION (or AWS_SES_REGION)
 */

// Get region from environment
const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1';

// Create SES client instance
export const sesClient = new SESClient({
  region,
  // Credentials are automatically loaded from environment variables
  // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
});

// Export SES configuration
export const SES_CONFIG = {
  FROM_EMAIL: process.env.AWS_SES_FROM_EMAIL || 'noreply@podcasto.app',
  FROM_NAME: process.env.AWS_SES_FROM_NAME || 'Podcasto',
  REGION: region,
} as const;
