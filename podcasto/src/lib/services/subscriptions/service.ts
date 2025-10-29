import { profilesApi, subscriptionsApi } from '@/lib/db/api';
import type { Subscription } from '@/lib/db/api/subscriptions';
import type { NewProfile } from '@/lib/db/api/profiles';
import type { ActionResult } from '@/lib/actions/shared/types';

type SubscriptionRecord = Subscription | null;

type ToggleSubscriptionData = { isSubscribed: boolean };

type EmailPreferenceResult = ActionResult<boolean>;

type SubscriptionResult = ActionResult<Subscription>;

type SubscriptionLookupResult = ActionResult<SubscriptionRecord>;

type ToggleSubscriptionResult = ActionResult<ToggleSubscriptionData>;

/**
 * Service responsible for managing subscriptions and related profile preferences.
 *
 * Provides a higher-level abstraction over the database APIs, ensuring consistent
 * ActionResult responses across server actions.
 */
export class SubscriptionService {
  /**
   * Retrieve a specific subscription for a user and podcast.
   */
  async getSubscription(
    userId: string,
    podcastId: string
  ): Promise<SubscriptionLookupResult> {
    try {
      const subscriptions = await subscriptionsApi.getUserSubscriptions(userId);
      const subscription = subscriptions.find(
        (record) => record.podcast_id === podcastId
      ) ?? null;

      return { success: true, data: subscription };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to fetch subscription'
      };
    }
  }

  /**
   * Check if a user is subscribed to a given podcast.
   */
  async isSubscribed(userId: string, podcastId: string): Promise<ActionResult<boolean>> {
    try {
      const subscription = await this.getSubscription(userId, podcastId);
      if (!subscription.success) {
        return {
          success: false,
          error: subscription.error ?? 'Failed to check subscription state'
        };
      }

      return { success: true, data: Boolean(subscription.data) };
    } catch (error) {
      console.error('Error checking subscription state:', error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to check subscription state'
      };
    }
  }

  /**
   * Subscribe a user to a podcast.
   */
  async subscribe(userId: string, podcastId: string): Promise<SubscriptionResult> {
    try {
      const existing = await this.getSubscription(userId, podcastId);
      if (!existing.success) {
        return {
          success: false,
          error: existing.error ?? 'Failed to load subscription state'
        };
      }

      if (existing.data) {
        return { success: true, data: existing.data };
      }

      const subscription = await subscriptionsApi.createSubscription({
        user_id: userId,
        podcast_id: podcastId
      });

      return { success: true, data: subscription };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to subscribe user'
      };
    }
  }

  /**
   * Unsubscribe a user from a podcast.
   */
  async unsubscribe(
    userId: string,
    podcastId: string,
    existingSubscription?: Subscription | null
  ): Promise<ActionResult<void>> {
    try {
      let subscription = existingSubscription ?? null;

      if (!subscription) {
        const lookup = await this.getSubscription(userId, podcastId);
        if (!lookup.success) {
          return {
            success: false,
            error: lookup.error ?? 'Failed to load subscription state'
          };
        }

        subscription = lookup.data;
      }

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      const deleted = await subscriptionsApi.deleteSubscription(subscription.id);

      if (!deleted) {
        return { success: false, error: 'Failed to delete subscription' };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to unsubscribe user'
      };
    }
  }

  /**
   * Toggle the subscription state for a user and podcast.
   */
  async toggleSubscription(
    userId: string,
    podcastId: string
  ): Promise<ToggleSubscriptionResult> {
    try {
      const existing = await this.getSubscription(userId, podcastId);
      if (!existing.success) {
        return {
          success: false,
          error: existing.error ?? 'Failed to load subscription state'
        };
      }

      if (existing.data) {
        const unsubscribeResult = await this.unsubscribe(
          userId,
          podcastId,
          existing.data
        );

        if (!unsubscribeResult.success) {
          return {
            success: false,
            error: unsubscribeResult.error ?? 'Failed to unsubscribe user'
          };
        }

        return { success: true, data: { isSubscribed: false } };
      }

      const subscribeResult = await this.subscribe(userId, podcastId);
      if (!subscribeResult.success) {
        return {
          success: false,
          error: subscribeResult.error ?? 'Failed to subscribe user'
        };
      }

      return { success: true, data: { isSubscribed: true } };
    } catch (error) {
      console.error('Error toggling subscription:', error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to toggle subscription'
      };
    }
  }

  /**
   * Get the email notification preference for a user.
   */
  async getEmailNotificationPreference(userId: string): Promise<EmailPreferenceResult> {
    try {
      const profile = await profilesApi.getProfileById(userId);

      if (!profile) {
        return { success: true, data: true };
      }

      return {
        success: true,
        data: profile.email_notifications ?? true
      };
    } catch (error) {
      console.error('Error fetching email notification preference:', error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to fetch email notification preference'
      };
    }
  }

  /**
   * Update the email notification preference for a user.
   */
  async updateEmailNotificationPreference(
    userId: string,
    enabled: boolean
  ): Promise<EmailPreferenceResult> {
    try {
      const profile = await profilesApi.getProfileById(userId);

      if (!profile) {
        const payload = {
          id: userId,
          email_notifications: enabled
        } satisfies NewProfile;

        await profilesApi.createProfile(payload);
        return { success: true, data: enabled };
      }

      const updated = await profilesApi.updateEmailNotifications(userId, enabled);

      if (!updated) {
        return { success: false, error: 'Profile not found' };
      }

      return {
        success: true,
        data: updated.email_notifications ?? enabled
      };
    } catch (error) {
      console.error('Error updating email notification preference:', error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to update email notification preference'
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();
