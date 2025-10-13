'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, type SubscriptionParams } from './shared';

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
export async function isUserSubscribed({ podcastId }: SubscriptionParams): Promise<boolean> {
  try {
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return false;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('podcast_id', podcastId);

    if (error) {
      console.error('Error checking subscription:', error);
      return false;
    }

    return !!data && data.length > 0;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}
