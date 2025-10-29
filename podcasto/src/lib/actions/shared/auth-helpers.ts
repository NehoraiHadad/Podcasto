'use server';

import { SessionService } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';

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
  const user = await SessionService.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  return { success: true, user };
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
  // Check authentication
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) return authResult;

  // Validate resource exists
  if (!resource) {
    return {
      success: false,
      error: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`
    };
  }

  // Validate ownership
  if (resource.created_by !== authResult.user.id) {
    return {
      success: false,
      error: `You can only modify your own ${resourceType}s`
    };
  }

  return { success: true, user: authResult.user };
}
