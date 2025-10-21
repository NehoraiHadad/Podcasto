import { db } from '@/lib/db';
import { userSubscriptions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

/**
 * User subscription model
 */
export type UserSubscription = InferSelectModel<typeof userSubscriptions>;

/**
 * Plan types supported in the system
 * - free: Default plan, basic podcast creation only
 * - basic: One-time credit purchase (basic features)
 * - pro: Monthly subscription with premium features (advanced podcast creation)
 * - enterprise: Top-tier subscription with all features
 */
export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

/**
 * Premium plan types that have access to advanced features
 * This includes:
 * - Multi-language podcast support
 * - Advanced podcast configuration
 * - Podcast groups creation
 */
export const PREMIUM_PLANS: PlanType[] = ['pro', 'enterprise'];

/**
 * Default minimum credit threshold for advanced features
 * Actual value is fetched from system_settings table
 * Users with one-time purchases can access advanced features if they have enough credits
 */
export const DEFAULT_PREMIUM_CREDIT_THRESHOLD = 100;

/**
 * Get active subscription for a user
 * Returns the active subscription if exists and not expired
 *
 * @param userId - User ID
 * @returns Active subscription or null
 */
export async function getActiveUserSubscription(userId: string): Promise<UserSubscription | null> {
  const now = new Date();

  const subscription = await db.query.userSubscriptions.findFirst({
    where: and(
      eq(userSubscriptions.user_id, userId),
      eq(userSubscriptions.status, 'active'),
      gt(userSubscriptions.current_period_end, now)
    )
  });

  return subscription || null;
}

/**
 * Get user's plan type
 * Returns 'free' if no active subscription exists
 *
 * @param userId - User ID
 * @returns Plan type
 */
export async function getUserPlanType(userId: string): Promise<PlanType> {
  const subscription = await getActiveUserSubscription(userId);

  if (!subscription) {
    return 'free';
  }

  return subscription.plan_type as PlanType;
}

/**
 * Check if user has premium access
 * Premium access includes 'pro' and 'enterprise' plans
 *
 * @param userId - User ID
 * @returns true if user has premium plan
 */
export async function isUserPremium(userId: string): Promise<boolean> {
  const planType = await getUserPlanType(userId);
  return PREMIUM_PLANS.includes(planType);
}

/**
 * Check if user has access to advanced podcast creation features
 * This includes multi-language support and advanced configuration
 *
 * Access is granted if:
 * 1. User has a premium subscription (Pro/Enterprise), OR
 * 2. User has purchased credits above the premium threshold
 *
 * @param userId - User ID
 * @param userCredits - Optional: user's current credit balance (to avoid extra query)
 * @returns true if user can access advanced features
 */
export async function hasAdvancedPodcastAccess(
  userId: string,
  userCredits?: number
): Promise<boolean> {
  // Check if user has premium subscription
  const isPremium = await isUserPremium(userId);
  if (isPremium) {
    return true;
  }

  // If credits not provided, fetch them
  if (userCredits === undefined) {
    const { getUserCreditsAction } = await import('@/lib/actions/credit/credit-core-actions');
    const creditsResult = await getUserCreditsAction();
    userCredits = creditsResult.success ? creditsResult.data.total_credits : 0;
  }

  // Get dynamic threshold from system settings
  const { getPremiumCreditThreshold } = await import('@/lib/db/api/system-settings');
  const threshold = await getPremiumCreditThreshold();

  // Check if user has enough credits for advanced access
  return userCredits >= threshold;
}
