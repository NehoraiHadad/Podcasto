/**
 * API Utilities - Centralized helpers for API routes
 *
 * This module provides standardized utilities for building consistent,
 * maintainable API routes across the Podcasto application.
 *
 * @module api
 *
 * @example
 * ```typescript
 * import { apiSuccess, apiError, validateCronAuth, validateJsonBody } from '@/lib/api';
 *
 * export async function GET(request: NextRequest) {
 *   // Validate authentication
 *   const authResult = validateCronAuth(request);
 *   if (!authResult.valid) {
 *     return apiError(authResult.error || 'Unauthorized', 401);
 *   }
 *
 *   try {
 *     const data = await fetchData();
 *     return apiSuccess(data);
 *   } catch (error) {
 *     return apiError(error, 500);
 *   }
 * }
 * ```
 */

// Response helpers
export {
  apiSuccess,
  apiError,
  apiSuccessLegacy,
  type ApiSuccessResponse,
  type ApiErrorResponse,
} from './response';

// Authentication helpers
export {
  validateCronAuth,
  validateBearerToken,
  validateLambdaAuth,
  type AuthValidationResult,
} from './auth';

// Validation helpers
export {
  validateJsonBody,
  validateSearchParams,
  validateEnvVars,
  type ValidationResult,
} from './validation';

// Error handling helpers
export {
  getErrorMessage,
  getErrorType,
  logError,
  isRetryableError,
  type ErrorType,
} from './error-handler';
