'use server';

import { redirect } from 'next/navigation';
import { cache } from 'react';
import { SessionService } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Server action to get the current user
 * This is a secure way to get the user in server components
 * Cached to avoid multiple database calls
 *
 * @returns The authenticated user or null if not authenticated
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  return await SessionService.getUser();
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
  const user = await SessionService.getUser();

  if (!user) {
    // Redirect to login with optional redirect parameter
    const loginPath = redirectTo
      ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/auth/login';

    redirect(loginPath);
  }

  return user;
};

/**
 * Server action to mark the welcome page as seen for a user
 * Used to ensure welcome page is only shown once per user
 *
 * @param userId The user ID to mark as having seen the welcome page
 * @returns Promise with success/error status
 */
export const markWelcomeAsSeen = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await db
      .update(profiles)
      .set({
        has_seen_welcome: true,
        updated_at: new Date()
      })
      .where(eq(profiles.id, userId));

    return { success: true };
  } catch (error) {
    const { getErrorMessage } = await import('@/lib/utils/error-utils');
    const { createLogger } = await import('@/lib/utils/logger');
    const logger = createLogger('MARK_WELCOME_SEEN');

    logger.error('Failed to mark welcome as seen', error, { userId });
    return {
      success: false,
      error: getErrorMessage(error, 'Failed to mark welcome as seen'),
    };
  }
};

/**
 * Server action to check if a user has seen the welcome page
 *
 * @param userId The user ID to check
 * @returns Promise with has_seen_welcome status
 */
export const hasSeenWelcome = async (userId: string): Promise<{ success: boolean; hasSeen: boolean; error?: string }> => {
  try {
    const [profile] = await db
      .select({ has_seen_welcome: profiles.has_seen_welcome })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    return {
      success: true,
      hasSeen: profile?.has_seen_welcome ?? false
    };
  } catch (error) {
    const { getErrorMessage } = await import('@/lib/utils/error-utils');
    const { createLogger } = await import('@/lib/utils/logger');
    const logger = createLogger('HAS_SEEN_WELCOME');

    logger.error('Failed to check welcome status', error, { userId });
    return {
      success: false,
      hasSeen: false,
      error: getErrorMessage(error, 'Failed to check welcome status'),
    };
  }
}; 