import 'server-only';

/**
 * Podcasts API Module
 *
 * This module provides a clean API for interacting with podcast data.
 * It's organized into:
 * - Types: TypeScript type definitions
 * - Queries: Read operations (SELECT)
 * - Mutations: Write operations (INSERT, UPDATE, DELETE)
 * - Episodes: Episode-related queries
 * - Enrichment: Podcast + config merging logic
 * - Relations: Complex queries involving related tables
 * - Utils: Helper functions for data manipulation
 */

// ============================================================================
// Types
// ============================================================================
export type {
  Podcast,
  NewPodcast,
  ContentSource,
  PodcastWithConfig,
  PodcastQueryOptions,
} from './types';

// ============================================================================
// Queries (Read Operations)
// ============================================================================
export {
  getPodcastById,
  getPodcastByIdWithConfig,
  getAllPodcastsBasic,
  getPodcastsPaginatedBasic,
  getPodcastCount,
  podcastExistsByTitle,
} from './queries';

// ============================================================================
// Mutations (Write Operations)
// ============================================================================
export {
  createPodcast,
  updatePodcast,
  deletePodcast,
} from './mutations';

// ============================================================================
// Episodes (Episode-related queries)
// ============================================================================
export {
  getPodcastEpisodes,
  getPublishedPodcastEpisodes,
} from './episodes';

// ============================================================================
// Enrichment (Podcast + Config merging)
// ============================================================================
export {
  enrichPodcastWithConfig,
  getPodcastWithConfig,
} from './enrichment';

// ============================================================================
// Relations (Complex Queries with Joins/Relations)
// ============================================================================
export {
  getPodcastByIdWithCounts,
  getAllPodcastsWithCounts,
  getPodcastsPaginatedWithCounts,
} from './relations';

// ============================================================================
// Utilities (Helper Functions)
// ============================================================================
export {
  hasPublishedEpisodes,
  getPodcastStatusLabel,
  isPodcastProcessing,
} from './utils';

// ============================================================================
// Legacy Exports (for backwards compatibility)
// ============================================================================

/**
 * @deprecated Use getAllPodcastsWithCounts instead
 */
export { getAllPodcastsWithCounts as getAllPodcasts } from './relations';

/**
 * @deprecated Use getPodcastsPaginatedWithCounts instead
 */
export { getPodcastsPaginatedWithCounts as getPodcastsPaginated } from './relations';
