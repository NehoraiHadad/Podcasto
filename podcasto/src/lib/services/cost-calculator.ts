"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { costTrackingEvents, episodeCosts, episodes } from "@/lib/db/schema";
import { sumCostsByService, countByService, sumMetadataField } from "./cost-calculator-helpers";
import type {
  CalculateEpisodeCostParams,
  CalculateEpisodeCostResult,
  CostBreakdown,
  UsageMetrics,
} from "./cost-calculator-types";

// Re-export types for convenience
export type {
  CalculateEpisodeCostParams,
  CalculateEpisodeCostResult,
  CostBreakdown,
  UsageMetrics,
} from "./cost-calculator-types";

/**
 * Calculate aggregated costs for an episode
 * Fetches all cost tracking events, aggregates by category, and stores in episode_costs table
 */
export async function calculateEpisodeCost(
  params: CalculateEpisodeCostParams
): Promise<CalculateEpisodeCostResult> {
  try {
    const { episodeId } = params;

    // Fetch the episode to get podcast_id
    const [episode] = await db
      .select({ podcast_id: episodes.podcast_id })
      .from(episodes)
      .where(eq(episodes.id, episodeId))
      .limit(1);

    if (!episode || !episode.podcast_id) {
      return { success: false, error: "Episode not found or missing podcast_id" };
    }

    // Fetch all cost events for this episode
    const events = await db
      .select()
      .from(costTrackingEvents)
      .where(eq(costTrackingEvents.episode_id, episodeId));

    // Calculate cost breakdown by category
    const breakdown: CostBreakdown = {
      ai_text_cost_usd: sumCostsByService({ events, services: ["gemini_text"] }),
      ai_image_cost_usd: sumCostsByService({ events, services: ["gemini_image"] }),
      ai_tts_cost_usd: sumCostsByService({ events, services: ["gemini_tts"] }),
      lambda_execution_cost_usd: sumCostsByService({
        events,
        services: ["lambda_audio", "lambda_telegram"],
      }),
      s3_operations_cost_usd: sumCostsByService({
        events,
        services: ["s3_put", "s3_get"],
      }),
      s3_storage_cost_usd: sumCostsByService({ events, services: ["s3_storage"] }),
      email_cost_usd: sumCostsByService({ events, services: ["ses"] }),
      sqs_cost_usd: sumCostsByService({ events, services: ["sqs"] }),
      other_cost_usd: 0,
      total_cost_usd: 0,
    };

    // Calculate total cost
    breakdown.total_cost_usd =
      breakdown.ai_text_cost_usd +
      breakdown.ai_image_cost_usd +
      breakdown.ai_tts_cost_usd +
      breakdown.lambda_execution_cost_usd +
      breakdown.s3_operations_cost_usd +
      breakdown.s3_storage_cost_usd +
      breakdown.email_cost_usd +
      breakdown.sqs_cost_usd +
      breakdown.other_cost_usd;

    // Calculate usage metrics
    const metrics: UsageMetrics = {
      total_tokens: Math.round(
        sumMetadataField({ events, field: "input_tokens" }) +
          sumMetadataField({ events, field: "output_tokens" })
      ),
      total_emails_sent: countByService({ events, service: "ses" }),
      total_s3_operations:
        countByService({ events, service: "s3_put" }) +
        countByService({ events, service: "s3_get" }),
      storage_mb: sumMetadataField({ events, field: "file_size_mb" }),
      lambda_duration_seconds: sumMetadataField({ events, field: "duration_ms" }) / 1000,
    };

    // Upsert episode_costs table
    await db
      .insert(episodeCosts)
      .values({
        episode_id: episodeId,
        podcast_id: episode.podcast_id,
        ai_text_cost_usd: breakdown.ai_text_cost_usd.toFixed(6),
        ai_image_cost_usd: breakdown.ai_image_cost_usd.toFixed(6),
        ai_tts_cost_usd: breakdown.ai_tts_cost_usd.toFixed(6),
        lambda_execution_cost_usd: breakdown.lambda_execution_cost_usd.toFixed(6),
        s3_operations_cost_usd: breakdown.s3_operations_cost_usd.toFixed(6),
        s3_storage_cost_usd: breakdown.s3_storage_cost_usd.toFixed(6),
        email_cost_usd: breakdown.email_cost_usd.toFixed(6),
        sqs_cost_usd: breakdown.sqs_cost_usd.toFixed(6),
        other_cost_usd: breakdown.other_cost_usd.toFixed(6),
        total_cost_usd: breakdown.total_cost_usd.toFixed(6),
        total_tokens: metrics.total_tokens,
        total_emails_sent: metrics.total_emails_sent,
        total_s3_operations: metrics.total_s3_operations,
        storage_mb: metrics.storage_mb.toFixed(2),
        lambda_duration_seconds: metrics.lambda_duration_seconds.toFixed(2),
        cost_calculated_at: sql`NOW()`,
      })
      .onConflictDoUpdate({
        target: episodeCosts.episode_id,
        set: {
          ai_text_cost_usd: sql`EXCLUDED.ai_text_cost_usd`,
          ai_image_cost_usd: sql`EXCLUDED.ai_image_cost_usd`,
          ai_tts_cost_usd: sql`EXCLUDED.ai_tts_cost_usd`,
          lambda_execution_cost_usd: sql`EXCLUDED.lambda_execution_cost_usd`,
          s3_operations_cost_usd: sql`EXCLUDED.s3_operations_cost_usd`,
          s3_storage_cost_usd: sql`EXCLUDED.s3_storage_cost_usd`,
          email_cost_usd: sql`EXCLUDED.email_cost_usd`,
          sqs_cost_usd: sql`EXCLUDED.sqs_cost_usd`,
          other_cost_usd: sql`EXCLUDED.other_cost_usd`,
          total_cost_usd: sql`EXCLUDED.total_cost_usd`,
          total_tokens: sql`EXCLUDED.total_tokens`,
          total_emails_sent: sql`EXCLUDED.total_emails_sent`,
          total_s3_operations: sql`EXCLUDED.total_s3_operations`,
          storage_mb: sql`EXCLUDED.storage_mb`,
          lambda_duration_seconds: sql`EXCLUDED.lambda_duration_seconds`,
          cost_calculated_at: sql`EXCLUDED.cost_calculated_at`,
          last_updated: sql`NOW()`,
        },
      });

    return { success: true, breakdown, metrics };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Cost Calculator] Failed to calculate episode cost:", {
      error: errorMessage,
      episodeId: params.episodeId,
    });
    return { success: false, error: errorMessage };
  }
}
