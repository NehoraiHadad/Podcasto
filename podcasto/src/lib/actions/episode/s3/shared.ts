/**
 * Shared utilities for S3 file actions
 * Internal module - not directly exposed to clients
 */

import { checkIsAdmin } from '@/lib/actions/admin';
import type { S3FileActionResult } from './types';

/**
 * Validates admin permissions
 * Returns error result if not admin, null if validation passed
 */
export async function requireAdminForS3(): Promise<S3FileActionResult | null> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Admin access required'
    };
  }
  return null; // null means validation passed
}

/**
 * Validates S3 key path to prevent path traversal
 * Returns error result if invalid, null if validation passed
 */
export function validateS3Key(key: string): S3FileActionResult | null {
  if (!key.startsWith('podcasts/')) {
    return {
      success: false,
      error: 'Invalid file path'
    };
  }
  return null; // null means validation passed
}

/**
 * Generic wrapper for S3 actions with error handling
 * Eliminates try-catch boilerplate across all actions
 */
export async function wrapS3Action<T>(
  actionName: string,
  handler: () => Promise<S3FileActionResult<T>>
): Promise<S3FileActionResult<T>> {
  try {
    return await handler();
  } catch (error) {
    console.error(`[S3_FILE_ACTIONS] Error ${actionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to ${actionName}`
    } as S3FileActionResult<T>;
  }
}

/**
 * Creates success result
 */
export function successResult<T>(data?: T): S3FileActionResult<T> {
  return { success: true, data };
}

/**
 * Creates error result
 */
export function errorResult(error: string): S3FileActionResult {
  return { success: false, error };
}
