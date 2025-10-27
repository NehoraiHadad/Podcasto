'use server';

import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Generate a new unsubscribe token for a user
 * @param userId - User ID
 * @returns Success with token or error
 */
export async function generateUnsubscribeToken(userId: string) {
  try {
    const token = randomUUID();

    await db.update(profiles)
      .set({ unsubscribe_token: token })
      .where(eq(profiles.id, userId));

    return { success: true as const, token };
  } catch (error) {
    console.error('Error generating unsubscribe token:', error);
    return { success: false as const, error: 'Failed to generate unsubscribe token' };
  }
}

/**
 * Get existing unsubscribe token or create a new one if it doesn't exist
 * @param userId - User ID
 * @returns Success with token or error
 */
export async function getOrCreateUnsubscribeToken(userId: string) {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: { unsubscribe_token: true }
    });

    if (profile?.unsubscribe_token) {
      return { success: true as const, token: profile.unsubscribe_token };
    }

    // Generate new token if it doesn't exist
    return await generateUnsubscribeToken(userId);
  } catch (error) {
    console.error('Error getting unsubscribe token:', error);
    return { success: false as const, error: 'Failed to get unsubscribe token' };
  }
}

/**
 * Unsubscribe a user by their unsubscribe token
 * @param token - Unsubscribe token
 * @returns Success with email or error
 */
export async function unsubscribeByToken(token: string) {
  try {
    // Find profile by token
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.unsubscribe_token, token),
    });

    if (!profile) {
      return { success: false as const, error: 'Invalid unsubscribe token' };
    }

    // Get user email from auth.users using parameterized query
    const userResult = await db.execute<{ email: string }>(sql`
      SELECT email FROM auth.users WHERE id = ${profile.id}::uuid
    `);

    const userEmail = userResult[0]?.email || 'your email';

    // Update email_notifications to false
    await db.update(profiles)
      .set({ email_notifications: false })
      .where(eq(profiles.unsubscribe_token, token));

    return {
      success: true as const,
      email: userEmail
    };
  } catch (error) {
    console.error('Error unsubscribing by token:', error);
    return { success: false as const, error: 'Failed to unsubscribe' };
  }
}
