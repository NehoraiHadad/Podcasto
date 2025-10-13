'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { profilesApi } from '@/lib/db/api';

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
      const { error } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: userId,
          podcast_id: podcastId
        }]);
      
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

/**
 * Toggle email notifications preference for the current user
 */
/**
 * Simple toggle for email notifications (for settings page)
 */
export async function updateEmailNotificationPreference(): Promise<{
  success: boolean;
  message?: string;
  enabled?: boolean;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }

    // Get current preference
    const currentProfile = await profilesApi.getProfileById(user.id);
    const currentEnabled = currentProfile?.email_notifications ?? true;
    const newEnabled = !currentEnabled;

    // Update preference
    await profilesApi.updateEmailNotifications(user.id, newEnabled);

    return {
      success: true,
      enabled: newEnabled
    };
  } catch (error) {
    console.error('Error updating email notification preference:', error);
    return {
      success: false,
      message: 'Failed to update preference'
    };
  }
}

export async function toggleEmailNotifications(
  prevState: { success: boolean; message: string } | null,
  formData: FormData
): Promise<{ success: boolean; message: string; enabled?: boolean }> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: 'You need to be logged in to update preferences'
      };
    }

    const userId = user.id;
    const enabled = formData.get('enabled') === 'true';

    // Update email notifications preference
    const updatedProfile = await profilesApi.updateEmailNotifications(userId, enabled);

    if (!updatedProfile) {
      return {
        success: false,
        message: 'Failed to update email notification preferences'
      };
    }

    revalidatePath('/settings');
    revalidatePath('/profile');

    return {
      success: true,
      message: enabled
        ? 'You will now receive email notifications for new episodes'
        : 'Email notifications have been disabled',
      enabled
    };
  } catch (error) {
    console.error('Error toggling email notifications:', error);
    return {
      success: false,
      message: 'An error occurred while updating your preferences'
    };
  }
} 