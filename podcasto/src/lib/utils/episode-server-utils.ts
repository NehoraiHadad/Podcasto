'use server';

/**
 * Server-side utilities for episode generation
 * These functions must be used only in server actions and API routes
 */

import { isUserAdmin } from '@/lib/db/api/user-roles';

/**
 * Determine the trigger source for episode generation based on user role
 * @param user - The user who triggered the generation (null for CRON)
 * @returns The trigger source type
 */
export async function determineTriggerSource(
  user?: { id: string } | null
): Promise<'cron' | 'manual_admin' | 'manual_user'> {
  if (!user) return 'cron';
  const isAdmin = await isUserAdmin(user.id);
  return isAdmin ? 'manual_admin' : 'manual_user';
}
