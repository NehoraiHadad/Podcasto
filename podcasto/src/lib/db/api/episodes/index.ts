/**
 * Episodes API Module
 *
 * This module provides a clean API for interacting with episode data.
 * It's organized into:
 * - Types: TypeScript type definitions
 * - Queries: Read operations (SELECT)
 * - Mutations: Write operations (INSERT, UPDATE, DELETE)
 * - Utils: Helper functions for episode-related operations
 */

// ============================================================================
// Types
// ============================================================================
export type {
  Episode,
  NewEpisode,
  StageInfo,
  EpisodeQueryOptions,
} from './types';

// ============================================================================
// Queries (Read Operations)
// ============================================================================
export {
  getAllEpisodes,
  getEpisodeById,
  getEpisodesPaginated,
  getEpisodesByPodcastId,
  getEpisodesByStatus,
  getEpisodeCount,
} from './queries';

// ============================================================================
// Mutations (Write Operations)
// ============================================================================
export {
  createEpisode,
  updateEpisode,
  deleteEpisode,
} from './mutations';

// ============================================================================
// Utilities (Helper Functions)
// ============================================================================
export {
  isEpisodeSentToUser,
  markEpisodeAsSent,
} from './utils';
