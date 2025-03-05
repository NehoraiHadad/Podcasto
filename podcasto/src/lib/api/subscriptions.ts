import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface SubscriptionParams {
  userId: string;
  podcastId: string;
}

/**
 * Check if a user is subscribed to a podcast (client-side)
 */
export async function isUserSubscribedClient({ userId, podcastId }: SubscriptionParams): Promise<boolean> {
  try {
    const supabase = createBrowserClient();
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('podcast_id', podcastId);
    
    if (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
    
    // Check if data exists and has at least one row
    return !!data && data.length > 0;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Check if a user is subscribed to a podcast (server-side)
 */
export async function isUserSubscribed({ userId, podcastId }: SubscriptionParams): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('podcast_id', podcastId);
    
    if (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
    
    // Check if data exists and has at least one row
    return !!data && data.length > 0;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Subscribe a user to receive notifications for new episodes (client-side)
 */
export async function subscribeToNewEpisodesClient({ userId, podcastId }: SubscriptionParams): Promise<boolean> {
  try {
    const supabase = createBrowserClient();
    
    // Check if subscription already exists
    const existingSubscription = await isUserSubscribedClient({ userId, podcastId });
    if (existingSubscription) {
      return true;
    }
    
    // Create new subscription
    const { error } = await supabase
      .from('subscriptions')
      .insert([
        { user_id: userId, podcast_id: podcastId }
      ]);
    
    if (error) {
      console.error('Error creating subscription:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return false;
  }
}

/**
 * Subscribe a user to receive notifications for new episodes (server-side)
 */
export async function subscribeToNewEpisodes({ userId, podcastId }: SubscriptionParams): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    
    // Check if subscription already exists
    const existingSubscription = await isUserSubscribed({ userId, podcastId });
    if (existingSubscription) {
      return true;
    }
    
    // Create new subscription
    const { error } = await supabase
      .from('subscriptions')
      .insert([
        { user_id: userId, podcast_id: podcastId }
      ]);
    
    if (error) {
      console.error('Error creating subscription:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return false;
  }
}

/**
 * Unsubscribe a user from a podcast (client-side)
 */
export async function unsubscribeFromPodcastClient({ userId, podcastId }: SubscriptionParams): Promise<boolean> {
  try {
    const supabase = createBrowserClient();
    
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('podcast_id', podcastId);
    
    if (error) {
      console.error('Error deleting subscription:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return false;
  }
}

/**
 * Unsubscribe a user from a podcast (server-side)
 */
export async function unsubscribeFromPodcast({ userId, podcastId }: SubscriptionParams): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('podcast_id', podcastId);
    
    if (error) {
      console.error('Error deleting subscription:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return false;
  }
} 