/**
 * Deployment and environment configuration constants
 * Extracted from hardcoded values across the codebase
 */

/**
 * Default site URL for local development and fallback
 */
export const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Default AWS region
 */
export const DEFAULT_AWS_REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Default AWS SES region (can differ from main AWS region)
 */
export const DEFAULT_AWS_SES_REGION =
  process.env.AWS_SES_REGION || DEFAULT_AWS_REGION;

/**
 * Check if running in production environment
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Check if running in development environment
 */
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (IS_PRODUCTION) {
    return 'https://podcasto.org';
  }

  return 'http://localhost:3000';
}
