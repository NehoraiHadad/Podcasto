'use server';

/**
 * Server Actions for Subscription Management
 * Handles per-podcast email notification preferences
 */

import { db } from '@/lib/db';
import { subscriptions, podcasts, profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createServerClient } from '@/lib/auth';

export interface UserSubscription {
  id: string;
  podcast_id: string | null;
  podcast_title: string;
  podcast_description: string | null;
  cover_image: string | null;
  email_notifications: boolean;
  created_at: Date | null;
}

/**
 * Get all user subscriptions with podcast details
 */
export async function getUserSubscriptions() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const userSubs = await db
      .select({
        id: subscriptions.id,
        podcast_id: subscriptions.podcast_id,
        podcast_title: podcasts.title,
        podcast_description: podcasts.description,
        cover_image: podcasts.cover_image,
        email_notifications: subscriptions.email_notifications,
        created_at: subscriptions.created_at,
      })
      .from(subscriptions)
      .innerJoin(podcasts, eq(subscriptions.podcast_id, podcasts.id))
      .where(eq(subscriptions.user_id, user.id))
      .orderBy(subscriptions.created_at);

    return {
      success: true,
      data: userSubs as UserSubscription[],
    };
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch subscriptions',
    };
  }
}

/**
 * Toggle email notifications for a specific podcast subscription
 */
export async function togglePodcastEmailNotifications(subscriptionId: string, enabled: boolean) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify subscription belongs to user
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.user_id, user.id)
      ),
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Update email_notifications
    await db
      .update(subscriptions)
      .set({ email_notifications: enabled })
      .where(eq(subscriptions.id, subscriptionId));

    return { success: true };
  } catch (error) {
    console.error('Error toggling podcast email notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notification settings',
    };
  }
}

/**
 * Disable email notifications for all podcast subscriptions (global disable)
 */
export async function disableAllPodcastEmailNotifications() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Update all user's subscriptions
    await db
      .update(subscriptions)
      .set({ email_notifications: false })
      .where(eq(subscriptions.user_id, user.id));

    // Also update global profile setting
    await db
      .update(profiles)
      .set({ email_notifications: false })
      .where(eq(profiles.id, user.id));

    return { success: true };
  } catch (error) {
    console.error('Error disabling all email notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable all notifications',
    };
  }
}

/**
 * Enable email notifications for all podcast subscriptions (global enable)
 */
export async function enableAllPodcastEmailNotifications() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Update all user's subscriptions
    await db
      .update(subscriptions)
      .set({ email_notifications: true })
      .where(eq(subscriptions.user_id, user.id));

    // Also update global profile setting
    await db
      .update(profiles)
      .set({ email_notifications: true })
      .where(eq(profiles.id, user.id));

    return { success: true };
  } catch (error) {
    console.error('Error enabling all email notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable all notifications',
    };
  }
}

/**
 * Unsubscribe from a specific podcast by token and podcast ID
 * Used for one-click unsubscribe from email
 */
export async function unsubscribeFromPodcastByToken(token: string, podcastId: string) {
  try {
    // Find user by unsubscribe token
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.unsubscribe_token, token),
      columns: {
        id: true,
      },
    });

    if (!profile) {
      return { success: false, error: 'Invalid unsubscribe token' };
    }

    // Find subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.user_id, profile.id),
        eq(subscriptions.podcast_id, podcastId)
      ),
      with: {
        podcast: {
          columns: {
            title: true,
          },
        },
      },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Disable email notifications for this podcast
    await db
      .update(subscriptions)
      .set({ email_notifications: false })
      .where(eq(subscriptions.id, subscription.id));

    return {
      success: true,
      podcastTitle: subscription.podcast?.title || 'this podcast',
    };
  } catch (error) {
    console.error('Error unsubscribing from podcast:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unsubscribe',
    };
  }
}
