'use server';

import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from '../admin/auth-actions';
import type { ActionResult } from '../shared/types';
import { creditService } from '@/lib/services/credits/credit-service';
import { db } from '@/lib/db';
import { userCredits, profiles } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getUserTransactionHistory } from '@/lib/db/api/credits/credit-transactions-api';

/**
 * Credit Admin Actions
 * Admin-only server actions for managing user credits
 */

export interface UserWithCredits {
  user_id: string;
  email: string;
  display_name: string | null;
  available_credits: number;
  used_credits: number;
  free_credits: number;
  total_credits: number;
  last_purchase_at: Date | null;
  created_at: Date;
}

export interface UserCreditTransaction {
  id: string;
  amount: number;
  type: string;
  balance_after: number;
  description: string | null;
  episode_id: string | null;
  podcast_id: string | null;
  created_at: Date;
}

/**
 * Get all users with their credit information (admin only)
 */
export async function getAllUsersWithCreditsAction(
  page: number = 1,
  pageSize: number = 50
): Promise<ActionResult<{ users: UserWithCredits[]; total: number }>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const offset = (page - 1) * pageSize;

    // Get users with credits joined with profiles for email
    const usersWithCredits = await db
      .select({
        user_id: userCredits.user_id,
        email: sql<string>`auth.users.email`,
        display_name: profiles.display_name,
        available_credits: userCredits.available_credits,
        used_credits: userCredits.used_credits,
        free_credits: userCredits.free_credits,
        total_credits: userCredits.total_credits,
        last_purchase_at: userCredits.last_purchase_at,
        created_at: userCredits.created_at,
      })
      .from(userCredits)
      .leftJoin(profiles, eq(userCredits.user_id, profiles.id))
      .leftJoin(sql`auth.users`, sql`${userCredits.user_id} = auth.users.id`)
      .orderBy(desc(userCredits.created_at))
      .limit(pageSize)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userCredits);

    const formattedUsers: UserWithCredits[] = usersWithCredits.map(user => ({
      user_id: user.user_id,
      email: user.email || 'Unknown',
      display_name: user.display_name,
      available_credits: parseFloat(user.available_credits),
      used_credits: parseFloat(user.used_credits),
      free_credits: parseFloat(user.free_credits),
      total_credits: parseFloat(user.total_credits),
      last_purchase_at: user.last_purchase_at,
      created_at: user.created_at,
    }));

    return {
      success: true,
      data: {
        users: formattedUsers,
        total: Number(count),
      },
    };
  } catch (error) {
    console.error('[getAllUsersWithCreditsAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get users with credits',
    };
  }
}

/**
 * Get credit details for a specific user (admin only)
 */
export async function getUserCreditDetailsAction(
  userId: string
): Promise<ActionResult<{
  credits: UserWithCredits;
  transactions: UserCreditTransaction[];
}>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    // Get user credits and profile
    const [userCreditData] = await db
      .select({
        user_id: userCredits.user_id,
        email: sql<string>`auth.users.email`,
        display_name: profiles.display_name,
        available_credits: userCredits.available_credits,
        used_credits: userCredits.used_credits,
        free_credits: userCredits.free_credits,
        total_credits: userCredits.total_credits,
        last_purchase_at: userCredits.last_purchase_at,
        created_at: userCredits.created_at,
      })
      .from(userCredits)
      .leftJoin(profiles, eq(userCredits.user_id, profiles.id))
      .leftJoin(sql`auth.users`, sql`${userCredits.user_id} = auth.users.id`)
      .where(eq(userCredits.user_id, userId))
      .limit(1);

    if (!userCreditData) {
      return {
        success: false,
        error: 'User credits not found',
      };
    }

    // Get transaction history
    const transactions = await getUserTransactionHistory(userId, 100);

    const formattedCredits: UserWithCredits = {
      user_id: userCreditData.user_id,
      email: userCreditData.email || 'Unknown',
      display_name: userCreditData.display_name,
      available_credits: parseFloat(userCreditData.available_credits),
      used_credits: parseFloat(userCreditData.used_credits),
      free_credits: parseFloat(userCreditData.free_credits),
      total_credits: parseFloat(userCreditData.total_credits),
      last_purchase_at: userCreditData.last_purchase_at,
      created_at: userCreditData.created_at,
    };

    const formattedTransactions: UserCreditTransaction[] = transactions.map(t => ({
      id: t.id,
      amount: parseFloat(t.amount),
      type: t.transaction_type,
      balance_after: parseFloat(t.balance_after),
      description: t.description,
      episode_id: t.episode_id,
      podcast_id: t.podcast_id,
      created_at: t.created_at,
    }));

    return {
      success: true,
      data: {
        credits: formattedCredits,
        transactions: formattedTransactions,
      },
    };
  } catch (error) {
    console.error('[getUserCreditDetailsAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user credit details',
    };
  }
}

/**
 * Grant bonus credits to a user (admin only)
 */
export async function grantCreditsToUserAction(
  userId: string,
  amount: number,
  description: string
): Promise<ActionResult<void>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    // Validate inputs
    if (amount <= 0) {
      return {
        success: false,
        error: 'Credit amount must be positive',
      };
    }

    if (!description || description.trim().length === 0) {
      return {
        success: false,
        error: 'Description is required',
      };
    }

    // Add credits using the credit service
    const result = await creditService.addCredits(
      userId,
      amount,
      'bonus',
      description,
      { admin_granted: true }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to grant credits',
      };
    }

    revalidatePath('/admin/users/credits');
    revalidatePath(`/admin/users/${userId}/credits`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('[grantCreditsToUserAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to grant credits',
    };
  }
}

/**
 * Get credit statistics for admin dashboard (admin only)
 */
export async function getCreditStatisticsAction(): Promise<
  ActionResult<{
    totalUsers: number;
    totalCreditsDistributed: number;
    totalCreditsUsed: number;
    totalFreeCredits: number;
  }>
> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const [stats] = await db
      .select({
        totalUsers: sql<number>`count(*)`,
        totalCreditsDistributed: sql<number>`sum(${userCredits.total_credits})`,
        totalCreditsUsed: sql<number>`sum(${userCredits.used_credits})`,
        totalFreeCredits: sql<number>`sum(${userCredits.free_credits})`,
      })
      .from(userCredits);

    return {
      success: true,
      data: {
        totalUsers: Number(stats.totalUsers),
        totalCreditsDistributed: Number(stats.totalCreditsDistributed || 0),
        totalCreditsUsed: Number(stats.totalCreditsUsed || 0),
        totalFreeCredits: Number(stats.totalFreeCredits || 0),
      },
    };
  } catch (error) {
    console.error('[getCreditStatisticsAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get credit statistics',
    };
  }
}
