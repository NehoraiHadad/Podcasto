/**
 * Server-side utilities for admin functionality
 * These functions should only be used in server components or server actions
 */

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getAdminStatus as fetchAdminStatus, getUser, isAdmin } from '@/lib/auth';

/**
 * Checks if the current user has admin role
 * This is a server-side function that can be used in server components
 * It's cached to prevent redundant database queries
 *
 * @returns Boolean indicating if the user is an admin
 */
export const isUserAdmin = cache(async (): Promise<boolean> => {
  const user = await getUser();

  if (!user) {
    return false;
  }

  return await isAdmin(user.id);
});

/**
 * Gets the current user's admin status and user data
 * This is useful for components that need both the admin status and user data
 *
 * @returns Object with isAdmin flag and user data
 */
export const getAdminStatus = fetchAdminStatus;

/**
 * Server component wrapper that redirects if the user is not an admin
 * This can be used as an alternative to the requireAdmin function
 * when you need to perform additional operations
 *
 * @param redirectUrl URL to redirect to if user is not an admin
 * @returns The admin status and user data if the user is an admin
 */
export const verifyAdminAccess = async (redirectUrl = '/unauthorized') => {
  const status = await fetchAdminStatus();

  if (!status.isAdmin) {
    redirect(redirectUrl);
  }

  return status;
};
