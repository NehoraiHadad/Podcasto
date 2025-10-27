import { db } from "@/lib/db";
import { costTrackingEvents } from "@/lib/db/schema";
import { getUnitCost } from "@/lib/constants/pricing";
import type {
  CostEventType,
  CostService,
  CostUnit,
  CostEventMetadata,
} from "@/types/cost-tracking";

export interface TrackCostEventParams {
  episodeId?: string;
  podcastId?: string;
  userId?: string;
  eventType: CostEventType;
  service: CostService;
  quantity: number;
  unit: CostUnit;
  metadata?: CostEventMetadata;
}

export interface TrackCostEventResult {
  success: boolean;
  eventId?: string;
  totalCostUsd?: number;
  error?: string;
}

export interface TrackCostEventBatchParams {
  events: TrackCostEventParams[];
}

export interface TrackCostEventBatchResult {
  success: boolean;
  eventIds?: string[];
  totalCostUsd?: number;
  successCount?: number;
  failureCount?: number;
  error?: string;
}

/**
 * Track a single cost event in the database
 * Automatically calculates total cost from quantity and unit pricing
 */
export async function trackCostEvent(
  params: TrackCostEventParams
): Promise<TrackCostEventResult> {
  try {
    const { episodeId, podcastId, userId, eventType, service, quantity, unit, metadata } = params;
    const unitCostUsd = getCurrentPricing({ service });
    const totalCostUsd = quantity * unitCostUsd;

    const [event] = await db
      .insert(costTrackingEvents)
      .values({
        episode_id: episodeId,
        podcast_id: podcastId,
        user_id: userId,
        event_type: eventType,
        service,
        quantity: quantity.toString(),
        unit,
        unit_cost_usd: unitCostUsd.toString(),
        total_cost_usd: totalCostUsd.toString(),
        metadata: metadata || {},
      })
      .returning({ id: costTrackingEvents.id });

    return { success: true, eventId: event.id, totalCostUsd };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Cost Tracker] Failed to track cost event:", {
      error: errorMessage,
      params,
      userId: params.userId,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Track multiple cost events in a single batch operation
 * More efficient than individual calls for bulk operations
 */
export async function trackCostEventBatch(
  params: TrackCostEventBatchParams
): Promise<TrackCostEventBatchResult> {
  try {
    const { events } = params;

    if (events.length === 0) {
      return { success: true, eventIds: [], totalCostUsd: 0, successCount: 0, failureCount: 0 };
    }

    const insertValues = events.map((event) => {
      const unitCostUsd = getCurrentPricing({ service: event.service });
      const totalCostUsd = event.quantity * unitCostUsd;

      return {
        episode_id: event.episodeId,
        podcast_id: event.podcastId,
        user_id: event.userId,
        event_type: event.eventType,
        service: event.service,
        quantity: event.quantity.toString(),
        unit: event.unit,
        unit_cost_usd: unitCostUsd.toString(),
        total_cost_usd: totalCostUsd.toString(),
        metadata: event.metadata || {},
      };
    });

    const totalCostUsd = insertValues.reduce((sum, val) => sum + parseFloat(val.total_cost_usd), 0);

    const insertedEvents = await db
      .insert(costTrackingEvents)
      .values(insertValues)
      .returning({ id: costTrackingEvents.id });

    return {
      success: true,
      eventIds: insertedEvents.map((e) => e.id),
      totalCostUsd,
      successCount: insertedEvents.length,
      failureCount: 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Cost Tracker] Failed to track batch cost events:", {
      error: errorMessage,
      eventCount: params.events.length,
    });
    return {
      success: false,
      successCount: 0,
      failureCount: params.events.length,
      error: errorMessage,
    };
  }
}

/**
 * Get current unit pricing for a service from pricing constants
 */
export function getCurrentPricing(params: { service: string }): number {
  const { service } = params;
  return getUnitCost(service);
}

/**
 * Safely track S3 operation cost without throwing errors
 * Wraps trackCostEvent with try-catch to prevent blocking operations
 *
 * @param operation - S3 operation type (GET, PUT, DELETE, etc.)
 * @param key - S3 key/path being accessed
 * @param episodeId - Optional episode ID
 * @param podcastId - Optional podcast ID
 * @param metadata - Additional metadata to track
 *
 * @example
 * await trackS3OperationSafely('GET', 'podcasts/123/episode.mp3', episodeId, podcastId, {
 *   file_size_mb: 5.2,
 *   content_type: 'audio/mpeg'
 * });
 */
export async function trackS3OperationSafely(
  operation: 'GET' | 'PUT' | 'DELETE' | 'HEAD' | 'LIST',
  key: string,
  episodeId?: string,
  podcastId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await trackCostEvent({
      episodeId,
      podcastId,
      eventType: 's3_operation',
      service: `s3_${operation.toLowerCase()}` as CostService,
      quantity: 1,
      unit: 'requests',
      metadata: {
        operation,
        s3_key: key,
        ...metadata
      }
    });
  } catch (error) {
    // Log but don't throw - cost tracking failures shouldn't block operations
    console.error(`[COST_TRACKER] Failed to track S3 ${operation}:`, error);
  }
}
