'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';
import { subscriptionService } from '@/lib/services/subscriptions';
import type { SubscriptionActionResult } from './shared';

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

    const result = await subscriptionService.toggleSubscription(user.id, podcastId);

    if (!result.success) {
      console.error('Error toggling subscription:', result.error);
      return {
        success: false,
        message: result.error ?? 'An error occurred while processing your request'
      };
    }

    const data = result.data;

    if (!data) {
      console.error('Error toggling subscription: missing response data');
      return {
        success: false,
        message: 'An error occurred while processing your request'
      };
    }

    revalidatePath(`/podcasts/${podcastId}`);

    if (data.isSubscribed) {
      return {
        success: true,
        message: 'You will receive updates when new episodes are released',
        isSubscribed: true
      };
    }

    return {
      success: true,
      message: 'You will no longer receive updates for new episodes',
      isSubscribed: false
    };
  } catch (error) {
    console.error('Error toggling subscription:', error);
    return {
      success: false,
      message: 'An error occurred while processing your request'
    };
  }
}
