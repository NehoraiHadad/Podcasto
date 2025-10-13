/**
 * Type definitions for audio generation API
 */

/**
 * Request payload for triggering audio generation for a specific episode
 */
export interface GenerateAudioRequest {
  episodeId: string;
  podcastId: string;
  telegramDataPath?: string;
  s3Path?: string;
  timestamp?: string;
}

/**
 * Result of sending an episode to SQS
 */
export interface SQSSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Result of batch sending episodes to SQS
 */
export interface BatchSQSResult {
  successful: number;
  failed: number;
  details: Array<{
    episodeId: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

/**
 * Episode data for SQS processing
 */
export interface EpisodeForSQS {
  id: string;
  title: string;
  podcast_id: string;
}
