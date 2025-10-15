'use server';

import { createServerClient } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';
import type { SubscriptionActionResult } from './shared';
import { isUserSubscribed } from './check-actions';

/**
 * Toggle subscription status for the current user
 *
 * Subscribes the user if not currently subscribed, unsubscribes if already subscribed.
 * Revalidates the podcast page after the action.
 *
 * @param prevState - Previous action state (for useActionState)
 * @param formData - Form data containing podcastId
 * @returns Action result with success status, message, and subscription state
 *
 * @example
 * // In a component:
 * const [state, formAction] = useActionState(toggleSubscription, null);
 * <form action={formAction}>
 *   <input type="hidden" name="podcastId" value={podcastId} />
 *   <button type="submit">Toggle Subscription</button>
 * </form>
 */
export async function toggleSubscription(
  prevState: { success: boolean; message: string } | null,
  formData: FormData
): Promise<SubscriptionActionResult> {
  try {
    const podcastId = formData.get('podcastId') as string;

    if (!podcastId) {
      return {
        success: false,
        message: 'Podcast ID is required'
      };
    }

    const user = await getUser();

    if (!user) {
      return {
        success: false,
        message: 'You need to be logged in to subscribe for updates'
      };
    }

    const supabase = await createServerClient();
    const isCurrentlySubscribed = await isUserSubscribed({ podcastId });

    if (isCurrentlySubscribed) {
      // Unsubscribe
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
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
          user_id: user.id,
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
