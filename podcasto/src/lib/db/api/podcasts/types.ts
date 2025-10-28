import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { podcasts } from '@/lib/db/schema';

/**
 * Podcast model - represents a podcast record from the database
 */
export type Podcast = InferSelectModel<typeof podcasts>;

/**
 * New podcast data for insertion
 */
export type NewPodcast = InferInsertModel<typeof podcasts>;

/**
 * Content source configuration
 */
export type ContentSource = {
  type: 'telegram' | 'urls';
  config?: {
    telegramChannel?: string;
    telegramHours?: number;
    urls?: string[];
  };
};

/**
 * Extended podcast with configuration fields merged
 * Used for API responses that include podcast config data
 */
export type PodcastWithConfig = Podcast & {
  episodes_count?: number;
  status?: string;
  timestamp?: string;

  // Configuration fields from podcast_configs
  content_source?: ContentSource;

  // Basic settings
  creator?: string;
  podcast_name?: string;
  output_language?: 'english' | 'hebrew';
  slogan?: string;
  creativity_level?: number;
  episode_frequency?: number;

  // Style and roles
  conversation_style?: string;
  podcast_format?: 'single-speaker' | 'multi-speaker';
  speaker1_role?: string;
  speaker2_role?: string;

  // Mixing techniques
  mixing_techniques?: string[];
  additional_instructions?: string;

  // Scheduling fields (from podcasts table)
  auto_generation_enabled?: boolean | null;
  last_auto_generated_at?: Date | null;
  next_scheduled_generation?: Date | null;
};

/**
 * Query options for fetching podcasts with relations
 */
export type PodcastQueryOptions = {
  includeInactive?: boolean;
  includeConfig?: boolean;
  includeEpisodes?: boolean;
  episodesLimit?: number;
  onlyPublished?: boolean;
};
