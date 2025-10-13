'use server';

import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../user-actions';
import { userRolesApi } from '@/lib/db/api';

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
} = {}) => {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    if (redirectOnFailure) {
      redirect(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`);
    }
    return false;
  }

  // Check if user has admin role using Drizzle API
  const isAdmin = await userRolesApi.isUserAdmin(user.id);

  if (!isAdmin && redirectOnFailure) {
    redirect('/unauthorized');
  }

  return redirectOnFailure ? user : isAdmin;
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
  const user = await getCurrentUser();

  if (!user) return null;

  // Get user role using Drizzle API
  const userRoles = await userRolesApi.getUserRoles(user.id);

  if (!userRoles || userRoles.length === 0) {
    return null;
  }

  return userRoles[0].role;
};
