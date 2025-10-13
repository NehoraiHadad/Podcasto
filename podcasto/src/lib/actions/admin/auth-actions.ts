'use server';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import {
  requireAdmin as requireAdminAuth,
  getUserHighestRole,
  getUser,
  InsufficientPermissionsError,
  UnauthorizedError,
} from '@/lib/auth';
import type { User } from '@/lib/auth';

/**
 * Server action to check if the current user has admin role
 * This is cached to avoid multiple database calls for the same user
 *
 * @param redirectOnFailure If true, redirects to unauthorized page if not admin
 * @param redirectTo Optional path to redirect to after login if not authenticated
 * @returns The user object if admin (when redirecting), or boolean if not redirecting
 *
 * @example
 * // Check without redirect (returns boolean)
 * const isAdmin = await checkIsAdmin();
 * if (!isAdmin) {
 *   return <div>Access denied</div>;
 * }
 *
 * @example
 * // Check with redirect (returns user or redirects)
 * const user = await checkIsAdmin({ redirectOnFailure: true });
 * // If we get here, user is admin
 */
export const checkIsAdmin = cache(async ({
  redirectOnFailure = false,
  redirectTo = '/admin'
}: {
  redirectOnFailure?: boolean,
  redirectTo?: string
} = {}): Promise<boolean | User> => {
  try {
    // Use centralized role service to check admin status
    const admin = await requireAdminAuth();

    // If redirectOnFailure is true, return the user object
    return redirectOnFailure ? admin : true;
  } catch (error) {
    // If redirectOnFailure is false, return false
    if (!redirectOnFailure) {
      return false;
    }

    // Handle redirects for redirectOnFailure = true
    if (error instanceof UnauthorizedError) {
      // User not authenticated - redirect to login
      redirect(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`);
    }

    if (error instanceof InsufficientPermissionsError) {
      // User authenticated but not admin - redirect to unauthorized
      redirect('/unauthorized');
    }

    // Unexpected error - redirect to unauthorized
    redirect('/unauthorized');
  }
});

/**
 * Server action to get the current user's role
 *
 * Fetches the first role assigned to the user from the user_roles table.
 * Returns null if user is not authenticated or has no roles.
 *
 * @returns The user's role string or null if not found
 *
 * @example
 * const role = await getUserRole();
 * if (role === 'admin') {
 *   // Show admin features
 * }
 */
export const getUserRole = async (): Promise<string | null> => {
  // Use centralized session service
  const user = await getUser();

  if (!user) return null;

  // Use centralized role service to get highest priority role
  return await getUserHighestRole(user.id);
};
