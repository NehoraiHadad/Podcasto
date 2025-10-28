import 'server-only';

/**
 * Profiles API Module
 *
 * This module provides a clean API for interacting with user profile data.
 * It's organized into:
 * - Types: TypeScript type definitions
 * - Queries: Read operations (SELECT)
 * - Mutations: Write operations (INSERT, UPDATE)
 * - Utils: Helper functions for profile management
 */

// ============================================================================
// Types
// ============================================================================
export type {
  Profile,
  NewProfile,
  UpdateProfile,
} from './types';

// ============================================================================
// Queries (Read Operations)
// ============================================================================
export {
  getProfileById,
  getProfileByUnsubscribeToken,
  getProfilesWithEmailNotifications,
  getProfileCount,
} from './queries';

// ============================================================================
// Mutations (Write Operations)
// ============================================================================
export {
  createProfile,
  updateEmailNotifications,
  updateUnsubscribeToken,
} from './mutations';

// ============================================================================
// Utilities (Helper Functions)
// ============================================================================
export {
  updateProfile,
  hasEmailNotificationsEnabled,
} from './utils';
