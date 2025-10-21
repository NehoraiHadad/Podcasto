'use server';

import { db } from '@/lib/db';
import { userCosts, profiles } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export interface UserCostSummary {
  userId: string;
  userDisplayName: string | null;
  totalCostUsd: string;
  aiTextCostUsd: string;
  aiImageCostUsd: string;
  aiTtsCostUsd: string;
  lambdaExecutionCostUsd: string;
  s3OperationsCostUsd: string;
  s3StorageCostUsd: string;
  emailCostUsd: string;
  sqsCostUsd: string;
  otherCostUsd: string;
  totalTokens: number;
  totalEmailsSent: number;
  totalS3Operations: number;
  storageMb: string;
  lambdaDurationSeconds: string;
  costCalculatedAt: Date | null;
  lastUpdated: Date;
}

export interface GetAllUserCostsResult {
  success: boolean;
  users?: UserCostSummary[];
  totalUsers?: number;
  grandTotalCost?: number;
  error?: string;
}

/**
 * Get cost breakdown for all users (Admin only)
 * Returns data from user_costs joined with profiles
 */
export async function getAllUserCosts(): Promise<GetAllUserCostsResult> {
  try {
    // Ensure user is admin
    await requireAdmin();

    // Fetch all user costs with profile information
    const usersWithCosts = await db
      .select({
        userId: userCosts.user_id,
        userDisplayName: profiles.display_name,
        totalCostUsd: userCosts.total_cost_usd,
        aiTextCostUsd: userCosts.ai_text_cost_usd,
        aiImageCostUsd: userCosts.ai_image_cost_usd,
        aiTtsCostUsd: userCosts.ai_tts_cost_usd,
        lambdaExecutionCostUsd: userCosts.lambda_execution_cost_usd,
        s3OperationsCostUsd: userCosts.s3_operations_cost_usd,
        s3StorageCostUsd: userCosts.s3_storage_cost_usd,
        emailCostUsd: userCosts.email_cost_usd,
        sqsCostUsd: userCosts.sqs_cost_usd,
        otherCostUsd: userCosts.other_cost_usd,
        totalTokens: userCosts.total_tokens,
        totalEmailsSent: userCosts.total_emails_sent,
        totalS3Operations: userCosts.total_s3_operations,
        storageMb: userCosts.storage_mb,
        lambdaDurationSeconds: userCosts.lambda_duration_seconds,
        costCalculatedAt: userCosts.cost_calculated_at,
        lastUpdated: userCosts.last_updated,
      })
      .from(userCosts)
      .leftJoin(profiles, sql`${userCosts.user_id} = ${profiles.id}`)
      .orderBy(desc(userCosts.total_cost_usd));

    // Calculate grand total
    const grandTotal = usersWithCosts.reduce(
      (sum, user) => sum + parseFloat(user.totalCostUsd),
      0
    );

    return {
      success: true,
      users: usersWithCosts,
      totalUsers: usersWithCosts.length,
      grandTotalCost: grandTotal,
    };
  } catch (error) {
    console.error('[GET_ALL_USER_COSTS] Error fetching all user costs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user costs',
    };
  }
}

/**
 * Recalculate costs for a specific user (Admin only)
 * @param userId - The user ID to recalculate costs for
 */
export async function recalculateUserCostsAdmin(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Ensure user is admin
    await requireAdmin();

    // Import the recalculation logic from cost-tracker
    const { costTrackingEvents } = await import('@/lib/db/schema');

    // Aggregate costs by service type for the specified user
    const aggregates = await db
      .select({
        aiTextCost: sql<string>`COALESCE(SUM(CASE WHEN service IN ('gemini_text') THEN ${costTrackingEvents.total_cost_usd}::numeric ELSE 0 END), 0)`,
        aiImageCost: sql<string>`COALESCE(SUM(CASE WHEN service IN ('gemini_image') THEN ${costTrackingEvents.total_cost_usd}::numeric ELSE 0 END), 0)`,
        aiTtsCost: sql<string>`COALESCE(SUM(CASE WHEN service IN ('gemini_tts') THEN ${costTrackingEvents.total_cost_usd}::numeric ELSE 0 END), 0)`,
        lambdaCost: sql<string>`COALESCE(SUM(CASE WHEN service LIKE 'lambda_%' THEN ${costTrackingEvents.total_cost_usd}::numeric ELSE 0 END), 0)`,
        s3OpsCost: sql<string>`COALESCE(SUM(CASE WHEN service IN ('s3_put', 's3_get') THEN ${costTrackingEvents.total_cost_usd}::numeric ELSE 0 END), 0)`,
        s3StorageCost: sql<string>`COALESCE(SUM(CASE WHEN service = 's3_storage' THEN ${costTrackingEvents.total_cost_usd}::numeric ELSE 0 END), 0)`,
        emailCost: sql<string>`COALESCE(SUM(CASE WHEN service = 'ses' THEN ${costTrackingEvents.total_cost_usd}::numeric ELSE 0 END), 0)`,
        sqsCost: sql<string>`COALESCE(SUM(CASE WHEN service = 'sqs' THEN ${costTrackingEvents.total_cost_usd}::numeric ELSE 0 END), 0)`,
        otherCost: sql<string>`COALESCE(SUM(CASE WHEN service NOT IN ('gemini_text', 'gemini_image', 'gemini_tts', 's3_put', 's3_get', 's3_storage', 'ses', 'sqs') AND service NOT LIKE 'lambda_%' THEN ${costTrackingEvents.total_cost_usd}::numeric ELSE 0 END), 0)`,
        totalCost: sql<string>`COALESCE(SUM(${costTrackingEvents.total_cost_usd}::numeric), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(CASE WHEN unit = 'tokens' THEN ${costTrackingEvents.quantity}::numeric ELSE 0 END)::int, 0)`,
        totalEmails: sql<number>`COALESCE(SUM(CASE WHEN unit = 'emails' THEN ${costTrackingEvents.quantity}::numeric ELSE 0 END)::int, 0)`,
        totalS3Ops: sql<number>`COALESCE(SUM(CASE WHEN unit = 'requests' AND service LIKE 's3_%' THEN ${costTrackingEvents.quantity}::numeric ELSE 0 END)::int, 0)`,
        storageMb: sql<string>`COALESCE(SUM(CASE WHEN unit = 'mb' THEN ${costTrackingEvents.quantity}::numeric ELSE 0 END), 0)`,
        lambdaSeconds: sql<string>`COALESCE(SUM(CASE WHEN unit = 'gb_seconds' THEN ${costTrackingEvents.quantity}::numeric ELSE 0 END), 0)`,
      })
      .from(costTrackingEvents)
      .where(sql`${costTrackingEvents.user_id} = ${userId}`);

    const aggregate = aggregates[0];

    // Upsert into user_costs table
    await db
      .insert(userCosts)
      .values({
        user_id: userId,
        ai_text_cost_usd: aggregate.aiTextCost,
        ai_image_cost_usd: aggregate.aiImageCost,
        ai_tts_cost_usd: aggregate.aiTtsCost,
        lambda_execution_cost_usd: aggregate.lambdaCost,
        s3_operations_cost_usd: aggregate.s3OpsCost,
        s3_storage_cost_usd: aggregate.s3StorageCost,
        email_cost_usd: aggregate.emailCost,
        sqs_cost_usd: aggregate.sqsCost,
        other_cost_usd: aggregate.otherCost,
        total_cost_usd: aggregate.totalCost,
        total_tokens: aggregate.totalTokens,
        total_emails_sent: aggregate.totalEmails,
        total_s3_operations: aggregate.totalS3Ops,
        storage_mb: aggregate.storageMb,
        lambda_duration_seconds: aggregate.lambdaSeconds,
        cost_calculated_at: new Date(),
        last_updated: new Date(),
      })
      .onConflictDoUpdate({
        target: userCosts.user_id,
        set: {
          ai_text_cost_usd: aggregate.aiTextCost,
          ai_image_cost_usd: aggregate.aiImageCost,
          ai_tts_cost_usd: aggregate.aiTtsCost,
          lambda_execution_cost_usd: aggregate.lambdaCost,
          s3_operations_cost_usd: aggregate.s3OpsCost,
          s3_storage_cost_usd: aggregate.s3StorageCost,
          email_cost_usd: aggregate.emailCost,
          sqs_cost_usd: aggregate.sqsCost,
          other_cost_usd: aggregate.otherCost,
          total_cost_usd: aggregate.totalCost,
          total_tokens: aggregate.totalTokens,
          total_emails_sent: aggregate.totalEmails,
          total_s3_operations: aggregate.totalS3Ops,
          storage_mb: aggregate.storageMb,
          lambda_duration_seconds: aggregate.lambdaSeconds,
          cost_calculated_at: new Date(),
          last_updated: new Date(),
        },
      });

    return { success: true };
  } catch (error) {
    console.error('[RECALCULATE_USER_COSTS_ADMIN] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to recalculate user costs',
    };
  }
}
