/**
 * Pricing constants for cost tracking (January 2025)
 *
 * These are fallback values when pricing is not configured in the database.
 * Update these values when pricing changes.
 */

export const PRICING = {
  // Google Gemini AI
  GEMINI_TEXT: 0.00000075, // per token (Gemini 2.0 Flash)
  GEMINI_IMAGE: 0.01, // per image (Gemini 2.5 Flash Image)
  GEMINI_TTS: 0.000002, // per token (estimated for TTS)

  // AWS Lambda
  LAMBDA_GB_SECOND: 0.0000166667, // per GB-second
  LAMBDA_REQUEST: 0.0000002, // per request

  // AWS S3
  S3_PUT: 0.000005, // per PUT request
  S3_GET: 0.00000007, // per GET request (10,000 requests)
  S3_DELETE: 0.0000025, // per DELETE request (1,000 requests)
  S3_STORAGE_GB_MONTH: 0.023, // per GB per month (Standard)

  // AWS SES
  SES_EMAIL: 0.0001, // per email sent

  // AWS SQS
  SQS_REQUEST: 0.0000004, // per request
} as const;

/**
 * Service names for cost tracking
 */
export const SERVICES = {
  GEMINI_TEXT: 'gemini_text',
  GEMINI_IMAGE: 'gemini_image',
  GEMINI_TTS: 'gemini_tts',
  LAMBDA_AUDIO: 'lambda_audio_generation',
  LAMBDA_TELEGRAM: 'lambda_telegram',
  LAMBDA_SCRIPT: 'lambda_script_preprocessor',
  S3_PUT: 's3_put',
  S3_GET: 's3_get',
  S3_DELETE: 's3_delete',
  S3_STORAGE: 's3_storage',
  SES: 'ses',
  SQS: 'sqs',
} as const;

/**
 * Get current pricing for a service
 * Fallback to hardcoded constants if not in DB
 */
export function getUnitCost(service: string): number {
  switch (service) {
    case SERVICES.GEMINI_TEXT:
      return PRICING.GEMINI_TEXT;
    case SERVICES.GEMINI_IMAGE:
      return PRICING.GEMINI_IMAGE;
    case SERVICES.GEMINI_TTS:
      return PRICING.GEMINI_TTS;
    case SERVICES.LAMBDA_AUDIO:
    case SERVICES.LAMBDA_TELEGRAM:
    case SERVICES.LAMBDA_SCRIPT:
      return PRICING.LAMBDA_GB_SECOND;
    case SERVICES.S3_PUT:
      return PRICING.S3_PUT;
    case SERVICES.S3_GET:
      return PRICING.S3_GET;
    case SERVICES.S3_DELETE:
      return PRICING.S3_DELETE;
    case SERVICES.S3_STORAGE:
      return PRICING.S3_STORAGE_GB_MONTH;
    case SERVICES.SES:
      return PRICING.SES_EMAIL;
    case SERVICES.SQS:
      return PRICING.SQS_REQUEST;
    default:
      console.warn(`Unknown service: ${service}, defaulting to $0`);
      return 0;
  }
}
