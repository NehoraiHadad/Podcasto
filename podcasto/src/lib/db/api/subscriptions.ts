import { subscriptions } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';
import * as dbUtils from '../utils';

// Types
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

/**
 * Returns all subscriptions
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  return await dbUtils.getAll<Subscription>(subscriptions);
}

/**
 * Returns a subscription by ID
 */
export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  return await dbUtils.findById<Subscription>(subscriptions, subscriptions.id, id);
}

/**
 * Creates a new subscription
 */
export async function createSubscription(data: NewSubscription): Promise<Subscription> {
  return await dbUtils.create<Subscription, NewSubscription>(subscriptions, data);
}

/**
 * Deletes a subscription
 */
export async function deleteSubscription(id: string): Promise<boolean> {
  return await dbUtils.deleteById(subscriptions, subscriptions.id, id);
}

/**
 * Returns all subscriptions for a specific user
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  return await dbUtils.findBy<Subscription>(subscriptions, eq(subscriptions.user_id, userId));
}

/**
 * Returns all subscriptions for a specific podcast
 */
export async function getPodcastSubscriptions(podcastId: string): Promise<Subscription[]> {
  return await dbUtils.findBy<Subscription>(subscriptions, eq(subscriptions.podcast_id, podcastId));
}

/**
 * Checks if a user is subscribed to a podcast
 */
export async function isUserSubscribed(userId: string, podcastId: string): Promise<boolean> {
  const condition: SQL = and(
    eq(subscriptions.user_id, userId),
    eq(subscriptions.podcast_id, podcastId)
  ) as SQL;
  
  return await dbUtils.exists(subscriptions, condition);
}

/**
 * Returns the total count of subscriptions
 */
export async function getSubscriptionCount(): Promise<number> {
  return await dbUtils.count(subscriptions);
} 