import { ProcessingStage, StageStatus } from './enums';

/**
 * Processing log entry for a specific stage
 */
export interface ProcessingLogEntry {
  id: string;
  episode_id: string;
  stage: ProcessingStage;
  status: StageStatus;
  error_message?: string;
  error_details?: {
    error_type?: string;
    stack_trace?: string;
    context?: Record<string, unknown>;
    retry_count?: number;
  };
  metadata?: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}

/**
 * Stage history entry stored in episode.stage_history
 */
export interface StageHistoryEntry {
  stage: string;
  status: string;
  timestamp: string;
  duration_ms?: number;
}

/**
 * Extended episode type with processing tracking fields
 */
export interface EpisodeWithProcessing {
  id: string;
  podcast_id: string | null;
  title: string;
  status: string | null;
  current_stage?: string | null;
  processing_started_at?: string | null;
  last_stage_update?: string | null;
  stage_history?: StageHistoryEntry[];
  created_at?: string | null;
  published_at?: string | null;
}

/**
 * Timeline item for UI rendering
 */
export interface ProcessingTimelineItem {
  stage: ProcessingStage;
  status: StageStatus;
  label: string;
  timestamp?: string;
  duration_ms?: number;
  error_message?: string;
  isActive: boolean;
  isCompleted: boolean;
  isFailed: boolean;
}

/**
 * Aggregated processing statistics
 */
export interface ProcessingStats {
  total_episodes: number;
  by_stage: Record<ProcessingStage, number>;
  by_status: Record<StageStatus, number>;
  avg_duration_by_stage: Record<ProcessingStage, number>;
  failure_rate_by_stage: Record<ProcessingStage, number>;
}

/**
 * Stage display configuration
 */
export interface StageConfig {
  stage: ProcessingStage;
  label: string;
  description: string;
  icon?: string;
  color?: string;
}
