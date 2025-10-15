import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { episodes } from '@/lib/db/schema';

/**
 * Episode model - represents an episode record from the database
 */
export type Episode = InferSelectModel<typeof episodes>;

/**
 * New episode data for insertion
 */
export type NewEpisode = InferInsertModel<typeof episodes>;

/**
 * Episode processing stage information
 */
export type StageInfo = {
  stage: string;
  status: string;
  timestamp: string;
  duration_ms?: number;
};

/**
 * Query options for fetching episodes
 */
export type EpisodeQueryOptions = {
  includeInactive?: boolean;
  statuses?: string[];
  podcastId?: string;
  limit?: number;
  offset?: number;
};
