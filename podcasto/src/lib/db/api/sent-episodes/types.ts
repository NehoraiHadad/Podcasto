import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { sentEpisodes } from '@/lib/db/schema';

/**
 * Sent episode model - represents a sent_episodes record from the database
 */
export type SentEpisode = InferSelectModel<typeof sentEpisodes>;

/**
 * New sent episode data for insertion
 */
export type NewSentEpisode = InferInsertModel<typeof sentEpisodes>;
