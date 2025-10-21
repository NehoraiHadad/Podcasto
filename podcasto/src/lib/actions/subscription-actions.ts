'use server';

import { getUser } from '@/lib/auth';
import {
  getUserPlanType,
  isUserPremium,
  hasAdvancedPodcastAccess,
  getActiveUserSubscription,
  type PlanType,
  type UserSubscription
} from '@/lib/db/api/user-subscriptions';

/**
 * Get current user's plan type
 * Returns 'free' for unauthenticated users or users without subscription
 */
export async function getUserPlanTypeAction(): Promise<{
  success: boolean;
  planType: PlanType;
}> {
  const user = await getUser();

  if (!user) {
    return { success: true, planType: 'free' };
  }

  const planType = await getUserPlanType(user.id);
  return { success: true, planType };
}

/**
 * Check if current user has premium access
 */
export async function checkUserPremiumAction(): Promise<{
  success: boolean;
  isPremium: boolean;
  planType: PlanType;
}> {
  const user = await getUser();

  if (!user) {
    return { success: true, isPremium: false, planType: 'free' };
  }

  const [isPremium, planType] = await Promise.all([
    isUserPremium(user.id),
    getUserPlanType(user.id)
  ]);

  return { success: true, isPremium, planType };
}

/**
 * Check if current user can access advanced podcast creation features
 * Access is granted based on:
 * 1. Premium subscription (Pro/Enterprise), OR
 * 2. High credit balance (100+ credits)
 */
export async function checkAdvancedPodcastAccessAction(): Promise<{
  success: boolean;
  hasAccess: boolean;
  planType: PlanType;
  totalCredits: number;
  accessReason?: 'subscription' | 'credits';
  subscription?: UserSubscription | null;
}> {
  const user = await getUser();

  if (!user) {
    return {
      success: true,
      hasAccess: false,
      planType: 'free',
      totalCredits: 0,
      subscription: null
    };
  }

  // Get user's credit information
  const { getUserCreditsAction } = await import('@/lib/actions/credit/credit-core-actions');
  const creditsResult = await getUserCreditsAction();
  const totalCredits = creditsResult.success ? creditsResult.data.total_credits : 0;

  const [planType, subscription] = await Promise.all([
    getUserPlanType(user.id),
    getActiveUserSubscription(user.id)
  ]);

  // Check access via subscription or credits
  const hasAccess = await hasAdvancedPodcastAccess(user.id, totalCredits);
  const isPremiumPlan = ['pro', 'enterprise'].includes(planType);

  return {
    success: true,
    hasAccess,
    planType,
    totalCredits,
    accessReason: hasAccess ? (isPremiumPlan ? 'subscription' : 'credits') : undefined,
    subscription
  };
}
