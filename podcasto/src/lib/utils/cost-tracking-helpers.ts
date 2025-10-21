/**
 * Helper utilities for cost tracking
 * Provides convenient functions to log cost events without boilerplate
 */

import { db } from '@/lib/db';
import { costTrackingEvents } from '@/lib/db/schema';
import type { CostEventMetadata, CostEventType, CostService, CostUnit } from '@/types/cost-tracking';

interface LogCostEventParams {
  episodeId?: string;
  podcastId?: string;
  eventType: CostEventType;
  service: CostService;
  quantity: number;
  unit: CostUnit;
  unitCostUsd: number;
  metadata?: CostEventMetadata;
}

/**
 * Log a cost tracking event to the database
 * Automatically calculates total_cost_usd from quantity and unit_cost_usd
 */
export async function logCostEvent(params: LogCostEventParams): Promise<void> {
  const totalCostUsd = params.quantity * params.unitCostUsd;

  await db.insert(costTrackingEvents).values({
    episode_id: params.episodeId,
    podcast_id: params.podcastId,
    event_type: params.eventType,
    service: params.service,
    quantity: params.quantity.toString(),
    unit: params.unit,
    unit_cost_usd: params.unitCostUsd.toString(),
    total_cost_usd: totalCostUsd.toString(),
    metadata: params.metadata,
    timestamp: new Date()
  });
}

/**
 * Log a Gemini text API call
 */
export async function logGeminiTextCost(params: {
  episodeId?: string;
  podcastId?: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  unitCostUsd: number;
}): Promise<void> {
  const totalTokens = params.inputTokens + params.outputTokens;

  await logCostEvent({
    episodeId: params.episodeId,
    podcastId: params.podcastId,
    eventType: 'ai_api_call',
    service: 'gemini_text',
    quantity: totalTokens,
    unit: 'tokens',
    unitCostUsd: params.unitCostUsd,
    metadata: {
      model: params.model,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens
    }
  });
}

/**
 * Log a Gemini TTS API call
 */
export async function logGeminiTTSCost(params: {
  episodeId: string;
  podcastId: string;
  characters: number;
  durationMs: number;
  model: string;
  unitCostUsd: number;
}): Promise<void> {
  await logCostEvent({
    episodeId: params.episodeId,
    podcastId: params.podcastId,
    eventType: 'ai_api_call',
    service: 'gemini_tts',
    quantity: params.characters,
    unit: 'tokens',
    unitCostUsd: params.unitCostUsd,
    metadata: {
      model: params.model,
      duration_ms: params.durationMs
    }
  });
}

/**
 * Log a Lambda execution cost
 */
export async function logLambdaExecutionCost(params: {
  episodeId?: string;
  podcastId?: string;
  service: 'lambda_audio' | 'lambda_telegram';
  durationMs: number;
  memoryMb: number;
  unitCostUsd: number;
}): Promise<void> {
  const gbSeconds = (params.memoryMb / 1024) * (params.durationMs / 1000);

  await logCostEvent({
    episodeId: params.episodeId,
    podcastId: params.podcastId,
    eventType: 'lambda_execution',
    service: params.service,
    quantity: gbSeconds,
    unit: 'gb_seconds',
    unitCostUsd: params.unitCostUsd,
    metadata: {
      duration_ms: params.durationMs,
      memory_mb: params.memoryMb
    }
  });
}

/**
 * Log an S3 operation cost
 */
export async function logS3OperationCost(params: {
  episodeId?: string;
  podcastId?: string;
  operation: 's3_put' | 's3_get';
  fileSizeMb?: number;
  region: string;
  unitCostUsd: number;
}): Promise<void> {
  await logCostEvent({
    episodeId: params.episodeId,
    podcastId: params.podcastId,
    eventType: 's3_operation',
    service: params.operation,
    quantity: 1,
    unit: 'requests',
    unitCostUsd: params.unitCostUsd,
    metadata: {
      region: params.region,
      file_size_mb: params.fileSizeMb,
      operation: params.operation
    }
  });
}

/**
 * Log an SES email send cost
 */
export async function logSESEmailCost(params: {
  episodeId?: string;
  podcastId?: string;
  recipientCount: number;
  region: string;
  unitCostUsd: number;
}): Promise<void> {
  await logCostEvent({
    episodeId: params.episodeId,
    podcastId: params.podcastId,
    eventType: 'ses_email',
    service: 'ses',
    quantity: params.recipientCount,
    unit: 'emails',
    unitCostUsd: params.unitCostUsd,
    metadata: {
      region: params.region,
      email_recipients: params.recipientCount
    }
  });
}

/**
 * Log an SQS message send cost
 */
export async function logSQSMessageCost(params: {
  episodeId?: string;
  podcastId?: string;
  messageCount: number;
  region: string;
  unitCostUsd: number;
}): Promise<void> {
  await logCostEvent({
    episodeId: params.episodeId,
    podcastId: params.podcastId,
    eventType: 'sqs_message',
    service: 'sqs',
    quantity: params.messageCount,
    unit: 'requests',
    unitCostUsd: params.unitCostUsd,
    metadata: {
      region: params.region
    }
  });
}
