'use server';

import { getUser } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';
import type { SubscriptionParams } from './shared';
import { subscriptionService } from '@/lib/services/subscriptions';

interface SubscriptionCheckOptions {
  user?: User | null;
}

/**
 * Check if the current user is subscribed to a podcast
 *
 * @param podcastId - The ID of the podcast to check
 * @returns true if user is subscribed, false otherwise
 *
 * @example
 * const isSubscribed = await isUserSubscribed({ podcastId: 'abc123' });
 * if (isSubscribed) {
 *   // Show unsubscribe button
 * }
 */
export async function isUserSubscribed(
  { podcastId }: SubscriptionParams,
  { user: providedUser }: SubscriptionCheckOptions = {}
): Promise<boolean> {
  try {
    const user = providedUser ?? await getUser();

    if (!user) {
      return false;
    }

    const result = await subscriptionService.getSubscription(user.id, podcastId);

    if (!result.success) {
      console.error('Error checking subscription:', result.error);
      return false;
    }

    return Boolean(result.data);
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}
