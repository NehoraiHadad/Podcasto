'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { TablesInsert } from '@/lib/supabase/types';

interface SubscriptionParams {
  podcastId: string;
}

/**
 * Check if the current user is subscribed to a podcast
 */
export async function isUserSubscribed({ podcastId }: SubscriptionParams): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Get authenticated user data directly from the Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting authenticated user:', userError);
      return false;
    }
    
    const userId = user.id;
    
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
 * Toggle subscription status for the current user
 */
export async function toggleSubscription(
  prevState: { success: boolean; message: string } | null,
  formData: FormData
): Promise<{ success: boolean; message: string; isSubscribed?: boolean }> {
  try {
    const podcastId = formData.get('podcastId') as string;
    
    if (!podcastId) {
      return { 
        success: false, 
        message: 'Podcast ID is required' 
      };
    }
    
    const supabase = await createClient();
    
    // Get authenticated user data directly from the Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        message: 'You need to be logged in to subscribe for updates' 
      };
    }
    
    const userId = user.id;
    
    // Check current subscription status
    const isCurrentlySubscribed = await isUserSubscribed({ podcastId });
    
    if (isCurrentlySubscribed) {
      // Unsubscribe
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('podcast_id', podcastId);
      
      if (error) {
        console.error('Error unsubscribing:', error);
        return { 
          success: false, 
          message: 'An error occurred while unsubscribing' 
        };
      }
      
      revalidatePath(`/podcasts/${podcastId}`);
      
      return { 
        success: true, 
        message: 'You will no longer receive updates for new episodes',
        isSubscribed: false
      };
    } else {
      // Subscribe
      type SubscriptionInsert = TablesInsert<'subscriptions'>;
      const newSubscription: SubscriptionInsert[] = [{
        user_id: userId,
        podcast_id: podcastId
      }];

      const { error } = await supabase
        .from('subscriptions')
        .insert(newSubscription);
      
      if (error) {
        console.error('Error subscribing:', error);
        return { 
          success: false, 
          message: 'An error occurred while subscribing' 
        };
      }
      
      revalidatePath(`/podcasts/${podcastId}`);
      
      return { 
        success: true, 
        message: 'You will receive updates when new episodes are released',
        isSubscribed: true
      };
    }
  } catch (error) {
    console.error('Error toggling subscription:', error);
    return { 
      success: false, 
      message: 'An error occurred while processing your request' 
    };
  }
} 