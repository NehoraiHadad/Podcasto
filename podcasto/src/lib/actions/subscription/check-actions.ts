'use server';

import { createServerClient, getUser } from '@/lib/auth';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { SubscriptionParams } from './shared';

type SupabaseServerClient = SupabaseClient<Database>;

interface SubscriptionCheckOptions {
  supabase?: SupabaseServerClient;
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
  { supabase: providedClient, user: providedUser }: SubscriptionCheckOptions = {}
): Promise<boolean> {
  try {
    const user = providedUser ?? await getUser();

    if (!user) {
      return false;
    }

    const supabase = providedClient ?? await createServerClient();
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
