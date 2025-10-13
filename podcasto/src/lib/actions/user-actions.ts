'use server';

import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';

/**
 * Server action to get the current user
 * This is a secure way to get the user in server components
 * Cached to avoid multiple database calls
 *
 * @returns The authenticated user or null if not authenticated
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  return await getUser();
});

/**
 * Server action to check if user is authenticated
 * Redirects to login if not authenticated
 *
 * @param redirectTo Optional path to redirect to after login
 * @returns The authenticated user
 * @throws Redirects to login page if not authenticated
 */
export const requireAuth = async (redirectTo?: string): Promise<User> => {
  const user = await getUser();

  if (!user) {
    // Redirect to login with optional redirect parameter
    const loginPath = redirectTo
      ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/auth/login';

    redirect(loginPath);
  }

  return user;
}; 