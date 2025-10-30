'use server';

import { db } from '@/lib/db';
import { userCosts, costTrackingEvents } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { SessionService } from '@/lib/auth/server';

export interface UserCostBreakdown {
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

export interface CostEvent {
  id: string;
  episodeId: string | null;
  podcastId: string | null;
  eventType: string;
  service: string;
  quantity: string;
  unit: string;
  unitCostUsd: string;
  totalCostUsd: string;
  timestamp: Date;
}

export interface GetUserCostsResult {
  success: boolean;
  breakdown?: UserCostBreakdown;
  error?: string;
}

export interface GetUserCostEventsResult {
  success: boolean;
  events?: CostEvent[];
  total?: number;
  error?: string;
}

export interface RecalculateUserCostsResult {
  success: boolean;
  breakdown?: UserCostBreakdown;
  error?: string;
}

/**
 * Get aggregated cost breakdown for the current user
 * Returns data from user_costs table
 */
export async function getUserCosts(): Promise<GetUserCostsResult> {
  try {
    const user = await SessionService.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const [costRecord] = await db
      .select()
      .from(userCosts)
      .where(eq(userCosts.user_id, user.id))
      .limit(1);

    if (!costRecord) {
      // User exists but has no cost record yet - return zero costs
      return {
        success: true,
        breakdown: {
          totalCostUsd: '0',
          aiTextCostUsd: '0',
          aiImageCostUsd: '0',
          aiTtsCostUsd: '0',
          lambdaExecutionCostUsd: '0',
          s3OperationsCostUsd: '0',
          s3StorageCostUsd: '0',
          emailCostUsd: '0',
          sqsCostUsd: '0',
          otherCostUsd: '0',
          totalTokens: 0,
          totalEmailsSent: 0,
          totalS3Operations: 0,
          storageMb: '0',
          lambdaDurationSeconds: '0',
          costCalculatedAt: null,
          lastUpdated: new Date(),
        },
      };
    }

    return {
      success: true,
      breakdown: {
        totalCostUsd: costRecord.total_cost_usd,
        aiTextCostUsd: costRecord.ai_text_cost_usd,
        aiImageCostUsd: costRecord.ai_image_cost_usd,
        aiTtsCostUsd: costRecord.ai_tts_cost_usd,
        lambdaExecutionCostUsd: costRecord.lambda_execution_cost_usd,
        s3OperationsCostUsd: costRecord.s3_operations_cost_usd,
        s3StorageCostUsd: costRecord.s3_storage_cost_usd,
        emailCostUsd: costRecord.email_cost_usd,
        sqsCostUsd: costRecord.sqs_cost_usd,
        otherCostUsd: costRecord.other_cost_usd,
        totalTokens: costRecord.total_tokens,
        totalEmailsSent: costRecord.total_emails_sent,
        totalS3Operations: costRecord.total_s3_operations,
        storageMb: costRecord.storage_mb,
        lambdaDurationSeconds: costRecord.lambda_duration_seconds,
        costCalculatedAt: costRecord.cost_calculated_at,
        lastUpdated: costRecord.last_updated,
      },
    };
  } catch (error) {
    console.error('[GET_USER_COSTS] Error fetching user costs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user costs',
    };
  }
}

/**
 * Get detailed cost events for the current user
 * Returns raw cost tracking events with pagination
 */
export async function getUserCostEvents({
  limit = 50,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}): Promise<GetUserCostEventsResult> {
  try {
    const user = await SessionService.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const events = await db
      .select({
        id: costTrackingEvents.id,
        episodeId: costTrackingEvents.episode_id,
        podcastId: costTrackingEvents.podcast_id,
        eventType: costTrackingEvents.event_type,
        service: costTrackingEvents.service,
        quantity: costTrackingEvents.quantity,
        unit: costTrackingEvents.unit,
        unitCostUsd: costTrackingEvents.unit_cost_usd,
        totalCostUsd: costTrackingEvents.total_cost_usd,
        timestamp: costTrackingEvents.timestamp,
      })
      .from(costTrackingEvents)
      .where(eq(costTrackingEvents.user_id, user.id))
      .orderBy(desc(costTrackingEvents.timestamp))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(costTrackingEvents)
      .where(eq(costTrackingEvents.user_id, user.id));

    return {
      success: true,
      events,
      total: count,
    };
  } catch (error) {
    console.error('[GET_USER_COST_EVENTS] Error fetching user cost events:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user cost events',
    };
  }
}

/**
 * Recalculate user costs from raw cost tracking events
 * Aggregates all cost_tracking_events for the user and updates user_costs table
 */
export async function recalculateUserCosts(): Promise<RecalculateUserCostsResult> {
  try {
    const user = await SessionService.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Aggregate costs by service type
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
      .where(eq(costTrackingEvents.user_id, user.id));

    const aggregate = aggregates[0];

    // Upsert into user_costs table
    await db
      .insert(userCosts)
      .values({
        user_id: user.id,
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

    return {
      success: true,
      breakdown: {
        totalCostUsd: aggregate.totalCost,
        aiTextCostUsd: aggregate.aiTextCost,
        aiImageCostUsd: aggregate.aiImageCost,
        aiTtsCostUsd: aggregate.aiTtsCost,
        lambdaExecutionCostUsd: aggregate.lambdaCost,
        s3OperationsCostUsd: aggregate.s3OpsCost,
        s3StorageCostUsd: aggregate.s3StorageCost,
        emailCostUsd: aggregate.emailCost,
        sqsCostUsd: aggregate.sqsCost,
        otherCostUsd: aggregate.otherCost,
        totalTokens: aggregate.totalTokens,
        totalEmailsSent: aggregate.totalEmails,
        totalS3Operations: aggregate.totalS3Ops,
        storageMb: aggregate.storageMb,
        lambdaDurationSeconds: aggregate.lambdaSeconds,
        costCalculatedAt: new Date(),
        lastUpdated: new Date(),
      },
    };
  } catch (error) {
    console.error('[RECALCULATE_USER_COSTS] Error recalculating user costs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to recalculate user costs',
    };
  }
}
