/**
 * Type for logging a generation attempt
 */
export interface LogGenerationAttemptParams {
  podcastId: string;
  episodeId?: string;
  triggeredBy?: string;
  status: 'success' | 'failed_no_messages' | 'failed_insufficient_credits' | 'failed_error';
  triggerSource: 'cron' | 'manual_admin' | 'manual_user' | 'api';
  contentStartDate?: Date;
  contentEndDate?: Date;
  failureReason?: string;
  errorDetails?: {
    error_type?: string;
    error_message?: string;
    channel_name?: string;
    latest_message_date?: string;
    credits_required?: number;
    credits_available?: number;
    stack_trace?: string;
  };
}

/**
 * Generation attempt record returned from database
 */
export interface GenerationAttemptRecord {
  id: string;
  podcast_id: string;
  episode_id: string | null;
  triggered_by: string | null;
  status: string;
  trigger_source: string;
  content_start_date: Date | null;
  content_end_date: Date | null;
  failure_reason: string | null;
  error_details: Record<string, unknown> | null;
  notification_sent: boolean;
  notification_sent_at: Date | null;
  attempted_at: Date;
  created_at: Date;
}

/**
 * Daily summary record for reporting
 */
export interface DailySummaryRecord {
  status: string;
  trigger_source: string;
  count: number;
}

/**
 * Problematic podcast record for monitoring
 */
export interface ProblematicPodcastRecord {
  podcast_id: string;
  total_attempts: number;
  failed_attempts: number;
  failure_rate: number;
  podcast_title: string;
  created_by: string;
  recent_failure_reason: string | null;
  recent_error_details: Record<string, unknown> | null;
  last_failure_at: Date | null;
}
