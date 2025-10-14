import type { BatchConfiguration } from '@/lib/utils/episode-date-calculator';

export interface BulkEpisodeGeneratorProps {
  podcastId: string;
  podcastTitle: string;
  isPaused: boolean;
}

export type GenerationStep = 'selection' | 'preview' | 'generating' | 'completed';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface EpisodeDateInfo {
  startDate: Date;
  endDate: Date;
  episodeNumber: number;
}

export interface PreviewData {
  totalEpisodes: number;
  estimatedTime: string;
  episodeDates: EpisodeDateInfo[];
  batchConfiguration?: BatchConfiguration;
}

export interface GenerationResults {
  successCount: number;
  failureCount: number;
  totalRequested: number;
}
