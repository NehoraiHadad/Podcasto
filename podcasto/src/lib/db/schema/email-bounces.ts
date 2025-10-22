import { pgTable, uuid, varchar, timestamp, text, index } from 'drizzle-orm/pg-core';

/**
 * Email Bounces and Complaints Tracking
 * Stores bounce and complaint events from AWS SES via SNS notifications
 */
export const emailBounces = pgTable('email_bounces', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(), // References auth.users
  email: varchar('email', { length: 255 }).notNull(),

  // Event type: 'bounce' or 'complaint'
  event_type: varchar('event_type', { length: 50 }).notNull(),

  // For bounces: 'Permanent' (hard bounce) or 'Transient' (soft bounce)
  // For complaints: null
  bounce_type: varchar('bounce_type', { length: 50 }),

  // For bounces: 'General', 'NoEmail', 'Suppressed', etc.
  // For complaints: 'abuse', 'fraud', etc.
  sub_type: varchar('sub_type', { length: 50 }),

  // Full SNS message payload (JSON) for debugging
  raw_message: text('raw_message'),

  // Timestamp of the event
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  // Index for looking up bounces by user
  userIdIdx: index('email_bounces_user_id_idx').on(table.user_id),
  // Index for filtering by event type
  eventTypeIdx: index('email_bounces_event_type_idx').on(table.event_type),
  // Index for finding recent bounces
  createdAtIdx: index('email_bounces_created_at_idx').on(table.created_at)
}));
