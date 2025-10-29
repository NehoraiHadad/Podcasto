import 'server-only';

import { db } from '../index';
import { podcasts, subscriptions } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as dbUtils from '../utils';
import { getProfileById } from './profiles';

// ============================================================================
// Types
// ============================================================================

/**
 * Subscription model - represents a subscription record from the database
 */
export type Subscription = InferSelectModel<typeof subscriptions>;

/**
 * New subscription data for insertion
 */
export type NewSubscription = InferInsertModel<typeof subscriptions>;

export interface UserSubscriptionWithPodcast {
  id: string;
  podcast_id: string | null;
  podcast_title: string;
  podcast_description: string | null;
  cover_image: string | null;
  email_notifications: boolean;
  created_at: Date | null;
}

export interface UserNotificationSettings {
  emailNotifications: boolean;
  subscriptions: UserSubscriptionWithPodcast[];
}

// ============================================================================
// Read Operations (Queries)
// ============================================================================

/**
 * Get all subscriptions
 *
 * @returns Array of all subscriptions
 *
 * @example
 * ```typescript
 * const allSubscriptions = await getAllSubscriptions();
 * console.log(`Total subscriptions: ${allSubscriptions.length}`);
 * ```
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  return await dbUtils.getAll<Subscription>(subscriptions);
}

/**
 * Get subscription by ID
 *
 * @param id - Subscription ID (UUID)
 * @returns The subscription if found, null otherwise
 *
 * @example
 * ```typescript
 * const subscription = await getSubscriptionById('sub-123');
 * if (subscription) {
 *   console.log(subscription.user_id);
 * }
 * ```
 */
export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  return await dbUtils.findById<Subscription>(subscriptions, subscriptions.id, id);
}

/**
 * Get all subscriptions for a specific user
 *
 * @param userId - User ID
 * @returns Array of subscriptions for the user
 *
 * @example
 * ```typescript
 * const userSubs = await getUserSubscriptions('user-123');
 * console.log(`User has ${userSubs.length} subscriptions`);
 * ```
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  return await dbUtils.findBy<Subscription>(subscriptions, eq(subscriptions.user_id, userId));
}

/**
 * Get all subscriptions for a specific podcast
 *
 * @param podcastId - Podcast ID
 * @returns Array of subscriptions for the podcast
 *
 * @example
 * ```typescript
 * const podcastSubs = await getPodcastSubscriptions('podcast-123');
 * console.log(`Podcast has ${podcastSubs.length} subscribers`);
 * ```
 */
export async function getPodcastSubscriptions(podcastId: string): Promise<Subscription[]> {
  return await dbUtils.findBy<Subscription>(subscriptions, eq(subscriptions.podcast_id, podcastId));
}

/**
 * Get total count of subscriptions
 *
 * @returns The total number of subscriptions
 *
 * @example
 * ```typescript
 * const total = await getSubscriptionCount();
 * console.log(`Total subscriptions: ${total}`);
 * ```
 */
export async function getSubscriptionCount(): Promise<number> {
  return await dbUtils.count(subscriptions);
}

/**
 * Get user notification settings including global profile preference and subscriptions
 */
export async function getUserNotificationSettings(userId: string): Promise<UserNotificationSettings> {
  const [profile, subscriptionRows] = await Promise.all([
    getProfileById(userId),
    db
      .select({
        id: subscriptions.id,
        podcastId: subscriptions.podcast_id,
        podcastTitle: podcasts.title,
        podcastDescription: podcasts.description,
        coverImage: podcasts.cover_image,
        emailNotifications: subscriptions.email_notifications,
        createdAt: subscriptions.created_at,
      })
      .from(subscriptions)
      .leftJoin(podcasts, eq(subscriptions.podcast_id, podcasts.id))
      .where(eq(subscriptions.user_id, userId))
      .orderBy(subscriptions.created_at),
  ]);

  return {
    emailNotifications: profile?.email_notifications ?? true,
    subscriptions: subscriptionRows.map((subscription) => ({
      id: subscription.id,
      podcast_id: subscription.podcastId ?? null,
      podcast_title: subscription.podcastTitle ?? 'Unknown Podcast',
      podcast_description: subscription.podcastDescription ?? null,
      cover_image: subscription.coverImage ?? null,
      email_notifications: subscription.emailNotifications,
      created_at: subscription.createdAt ?? null,
    })),
  };
}

/**
 * Check if a user is subscribed to a podcast
 *
 * @param userId - User ID
 * @param podcastId - Podcast ID
 * @returns true if user is subscribed to the podcast, false otherwise
 *
 * @example
 * ```typescript
 * const isSubscribed = await isUserSubscribed('user-123', 'podcast-456');
 * if (!isSubscribed) {
 *   await createSubscription({ user_id: userId, podcast_id: podcastId });
 * }
 * ```
 */
export async function isUserSubscribed(userId: string, podcastId: string): Promise<boolean> {
  const condition: SQL = and(
    eq(subscriptions.user_id, userId),
    eq(subscriptions.podcast_id, podcastId)
  ) as SQL;

  return await dbUtils.exists(subscriptions, condition);
}

// ============================================================================
// Write Operations (Mutations)
// ============================================================================

/**
 * Create a new subscription
 *
 * @param data - Subscription data to insert
 * @returns The created subscription
 *
 * @example
 * ```typescript
 * const subscription = await createSubscription({
 *   user_id: 'user-123',
 *   podcast_id: 'podcast-456'
 * });
 * ```
 */
export async function createSubscription(data: NewSubscription): Promise<Subscription> {
  return await dbUtils.create<Subscription, NewSubscription>(subscriptions, data);
}

/**
 * Delete a subscription
 *
 * @param id - Subscription ID
 * @returns true if subscription was deleted, false if not found
 *
 * @example
 * ```typescript
 * const success = await deleteSubscription('sub-123');
 * ```
 */
export async function deleteSubscription(id: string): Promise<boolean> {
  return await dbUtils.deleteById(subscriptions, subscriptions.id, id);
}
