/**
 * Episode Generation Attempts API
 * Provides functions for logging and querying episode generation attempts
 *
 * This API layer handles all database operations related to tracking
 * episode generation attempts, including both successful and failed attempts.
 * It supports reporting, monitoring, and notification workflows.
 */

export {
  logGenerationAttempt,
  getAttemptsByPodcast,
  getDailySummary,
  getProblematicPodcasts,
  markNotificationSent,
  getUnnotifiedFailures,
} from './queries';

export type {
  LogGenerationAttemptParams,
  GenerationAttemptRecord,
  DailySummaryRecord,
  ProblematicPodcastRecord,
} from './queries';
