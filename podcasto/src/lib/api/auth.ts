import { NextRequest } from 'next/server';

/**
 * Result of authentication validation
 */
export interface AuthValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate CRON secret from request Authorization header
 * Used by CRON job endpoints to verify legitimate scheduled requests
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = validateCronAuth(request);
 *   if (!authResult.valid) {
 *     return apiError(authResult.error || 'Unauthorized', 401);
 *   }
 *   // ... proceed with CRON job logic
 * }
 * ```
 *
 * @param request - Next.js request object
 * @returns Validation result with valid flag and optional error message
 */
export function validateCronAuth(request: NextRequest): AuthValidationResult {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Check if CRON_SECRET is configured
  if (!cronSecret) {
    console.error('[AUTH] CRON_SECRET environment variable not configured');
    return {
      valid: false,
      error: 'CRON authentication not configured',
    };
  }

  // Check if Authorization header is present
  if (!authHeader) {
    console.error('[AUTH] Missing Authorization header for CRON request');
    return {
      valid: false,
      error: 'Missing Authorization header',
    };
  }

  // Validate Bearer token format and value
  const expectedAuth = `Bearer ${cronSecret}`;
  if (authHeader !== expectedAuth) {
    console.error('[AUTH] Invalid CRON secret provided');
    return {
      valid: false,
      error: 'Invalid CRON credentials',
    };
  }

  return { valid: true };
}

/**
 * Validate Bearer token from Authorization header
 * Generic token validation for any Bearer token authentication
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const lambdaSecret = process.env.LAMBDA_CALLBACK_SECRET;
 *   if (!lambdaSecret) {
 *     return apiError('Lambda authentication not configured', 500);
 *   }
 *
 *   const authResult = validateBearerToken(request, lambdaSecret);
 *   if (!authResult.valid) {
 *     return apiError(authResult.error || 'Unauthorized', 401);
 *   }
 *   // ... proceed with Lambda callback logic
 * }
 * ```
 *
 * @param request - Next.js request object
 * @param expectedToken - Token value to validate against
 * @returns Validation result with valid flag and optional error message
 */
export function validateBearerToken(
  request: NextRequest,
  expectedToken: string
): AuthValidationResult {
  const authHeader = request.headers.get('Authorization');

  // Check if Authorization header is present
  if (!authHeader) {
    console.error('[AUTH] Missing Authorization header for token validation');
    return {
      valid: false,
      error: 'Missing Authorization header',
    };
  }

  // Validate Bearer token format and value
  const expectedAuth = `Bearer ${expectedToken}`;
  if (authHeader !== expectedAuth) {
    console.error('[AUTH] Invalid Bearer token provided');
    return {
      valid: false,
      error: 'Invalid credentials',
    };
  }

  return { valid: true };
}

/**
 * Validate Lambda callback authentication
 * Convenience wrapper for Lambda-specific authentication
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const authResult = validateLambdaAuth(request);
 *   if (!authResult.valid) {
 *     return apiError(authResult.error || 'Unauthorized', 401);
 *   }
 *   // ... proceed with callback processing
 * }
 * ```
 *
 * @param request - Next.js request object
 * @returns Validation result
 */
export function validateLambdaAuth(request: NextRequest): AuthValidationResult {
  const lambdaSecret = process.env.LAMBDA_CALLBACK_SECRET;

  if (!lambdaSecret) {
    console.error('[AUTH] LAMBDA_CALLBACK_SECRET environment variable not configured');
    return {
      valid: false,
      error: 'Lambda authentication not configured',
    };
  }

  return validateBearerToken(request, lambdaSecret);
}
