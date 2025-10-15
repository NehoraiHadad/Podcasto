/**
 * Sent Episodes API Module
 *
 * This module provides a clean API for tracking which episodes have been
 * sent to which users (email notification tracking).
 * It's organized into:
 * - Types: TypeScript type definitions
 * - Queries: Read operations (SELECT)
 * - Mutations: Write operations (INSERT, DELETE)
 * - Utils: Helper functions for duplicate prevention
 */

// ============================================================================
// Types
// ============================================================================
export type {
  SentEpisode,
  NewSentEpisode,
} from './types';

// ============================================================================
// Queries (Read Operations)
// ============================================================================
export {
  getAllSentEpisodes,
  getSentEpisodeById,
  getUserSentEpisodes,
  getEpisodeSentUsers,
  getRecentSentEpisodes,
  getSentEpisodeCount,
} from './queries';

// ============================================================================
// Mutations (Write Operations)
// ============================================================================
export {
  createSentEpisode,
  deleteSentEpisode,
} from './mutations';

// ============================================================================
// Utilities (Helper Functions)
// ============================================================================
export {
  hasEpisodeBeenSentToUser,
} from './utils';
