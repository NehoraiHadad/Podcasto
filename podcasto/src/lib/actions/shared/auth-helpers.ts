'use server';

import { createServerClient } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';
import { errorResult } from './error-handler';

/**
 * Get authenticated user or return error result
 * Replaces repetitive auth check pattern across action files
 *
 * @returns Success with user or error result
 *
 * @example
 * const authResult = await requireAuthenticatedUser();
 * if (!authResult.success) return authResult;
 * const user = authResult.user;
 */
export async function requireAuthenticatedUser(): Promise<
  | { success: true; user: User }
  | { success: false; error: string }
> {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return errorResult('Not authenticated');
  }

  return { success: true, user };
}

/**
 * Validate that a resource belongs to the current user
 * Common pattern for podcast/episode ownership checks
 *
 * @param resource - Resource with created_by field
 * @param userId - User ID to check ownership against
 * @param resourceType - Type of resource for error message
 * @returns Success boolean or error result
 *
 * @example
 * const ownershipResult = validateResourceOwnership(
 *   podcast,
 *   user.id,
 *   'podcast'
 * );
 * if (!ownershipResult.success) return ownershipResult;
 */
export function validateResourceOwnership(
  resource: { created_by?: string | null } | null | undefined,
  userId: string,
  resourceType: string
): { success: true } | { success: false; error: string } {
  if (!resource) {
    return errorResult(`${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`);
  }

  if (resource.created_by !== userId) {
    return errorResult(`You can only modify your own ${resourceType}s`);
  }

  return { success: true };
}

/**
 * Combined auth check and ownership validation
 * One-liner for the most common action pattern
 *
 * @param resource - Resource with created_by field
 * @param resourceType - Type of resource for error messages
 * @returns Success with user or error result
 *
 * @example
 * const authResult = await requireResourceOwnership(podcast, 'podcast');
 * if (!authResult.success) return authResult;
 * const user = authResult.user;
 */
export async function requireResourceOwnership(
  resource: { created_by?: string | null } | null | undefined,
  resourceType: string
): Promise<
  | { success: true; user: User }
  | { success: false; error: string }
> {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) return authResult;

  const ownershipResult = validateResourceOwnership(
    resource,
    authResult.user.id,
    resourceType
  );
  if (!ownershipResult.success) return ownershipResult;

  return { success: true, user: authResult.user };
}
