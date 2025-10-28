import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * System settings table
 * Stores configurable system-wide settings that admins can modify
 */
export const systemSettings = pgTable('system_settings', {
  // Setting key (primary key)
  key: text('key').primaryKey(),

  // Setting value (stored as text, parsed by application)
  value: text('value').notNull(),

  // Setting type for proper parsing
  value_type: text('value_type').notNull(), // 'string' | 'number' | 'boolean' | 'json'

  // Metadata
  description: text('description'),
  category: text('category'), // 'credits' | 'features' | 'limits' | 'pricing'

  // Audit trail
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updated_by: text('updated_by') // Admin user ID who last updated
});

/**
 * System setting keys
 * Centralized enum of all available settings
 */
export const SYSTEM_SETTING_KEYS = {
  // Credit-related settings
  PREMIUM_CREDIT_THRESHOLD: 'premium_credit_threshold',
  EPISODE_COST: 'episode_cost',
  SIGNUP_FREE_CREDITS: 'signup_free_credits',

  // Feature toggles
  ENABLE_MULTI_LANGUAGE: 'enable_multi_language',
  ENABLE_AUTO_SCHEDULING: 'enable_auto_scheduling',

  // Limits
  MAX_PODCASTS_PER_USER: 'max_podcasts_per_user',
  MAX_EPISODES_PER_PODCAST: 'max_episodes_per_podcast',
} as const;

/**
 * Default system settings
 * Used for initialization and fallback
 */
export const DEFAULT_SYSTEM_SETTINGS = {
  [SYSTEM_SETTING_KEYS.PREMIUM_CREDIT_THRESHOLD]: {
    value: '100',
    value_type: 'number',
    description: 'Minimum credits required for premium podcast creation access',
    category: 'credits'
  },
  [SYSTEM_SETTING_KEYS.EPISODE_COST]: {
    value: '10',
    value_type: 'number',
    description: 'Credit cost per episode generation',
    category: 'credits'
  },
  [SYSTEM_SETTING_KEYS.SIGNUP_FREE_CREDITS]: {
    value: '30',
    value_type: 'number',
    description: 'Free credits given to new users on signup',
    category: 'credits'
  },
  [SYSTEM_SETTING_KEYS.ENABLE_MULTI_LANGUAGE]: {
    value: 'true',
    value_type: 'boolean',
    description: 'Enable multi-language podcast support',
    category: 'features'
  },
  [SYSTEM_SETTING_KEYS.ENABLE_AUTO_SCHEDULING]: {
    value: 'true',
    value_type: 'boolean',
    description: 'Enable automatic podcast scheduling',
    category: 'features'
  },
  [SYSTEM_SETTING_KEYS.MAX_PODCASTS_PER_USER]: {
    value: '50',
    value_type: 'number',
    description: 'Maximum podcasts a user can create',
    category: 'limits'
  },
  [SYSTEM_SETTING_KEYS.MAX_EPISODES_PER_PODCAST]: {
    value: '1000',
    value_type: 'number',
    description: 'Maximum episodes per podcast',
    category: 'limits'
  },
} as const;
