/**
 * Episode Generation Attempts API
 * Provides functions for logging and querying episode generation attempts
 */

// Basic CRUD
export {
  logGenerationAttempt,
  getAttemptsByPodcast,
} from './queries';

// Analytics
export {
  getDailySummary,
  getProblematicPodcasts,
} from './analytics';

// Notifications
export {
  markNotificationSent,
  getUnnotifiedFailures,
} from './notifications';

// Types
export type {
  LogGenerationAttemptParams,
  GenerationAttemptRecord,
  DailySummaryRecord,
  ProblematicPodcastRecord,
} from './types';
