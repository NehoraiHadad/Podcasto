import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { profiles } from '@/lib/db/schema';

/**
 * Profile model - represents a profiles record from the database
 */
export type Profile = InferSelectModel<typeof profiles>;

/**
 * New profile data for insertion
 */
export type NewProfile = InferInsertModel<typeof profiles>;

/**
 * Partial profile data for updates
 */
export type UpdateProfile = Partial<NewProfile>;
