import type { BatchConfiguration, EpisodeDateRange } from '@/lib/utils/episode-date-calculator';

/**
 * Result for a single episode generation attempt
 */
export interface EpisodeGenerationResult {
  episodeNumber: number;
  dateRange: {
    start: string;
    end: string;
  };
  success: boolean;
  episodeId?: string;
  error?: string;
}

/**
 * Result of bulk episode generation
 */
export interface BulkGenerationResult {
  success: boolean;
  totalRequested: number;
  successCount: number;
  failureCount: number;
  results: EpisodeGenerationResult[];
  error?: string;
  estimatedTime?: string;
}

/**
 * Result of bulk episode preview
 */
export interface BulkGenerationPreview {
  success: boolean;
  episodeDates?: EpisodeDateRange[];
  totalEpisodes?: number;
  estimatedTime?: string;
  batchConfiguration?: BatchConfiguration;
  error?: string;
}
