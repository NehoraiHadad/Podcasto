/**
 * Admin actions module
 *
 * This module handles all admin-related actions:
 * - Dashboard statistics
 * - Admin authentication and role checking
 * - CRON job management
 *
 * @module admin
 */

// Export types
export type {
  AdminDashboardStats,
  CronOperationResult
} from './types';

// Export stats actions
export { getAdminDashboardStats } from './stats-actions';

// Export auth actions
export {
  checkIsAdmin,
  getUserRole
} from './auth-actions';

// Export CRON actions
export {
  runEpisodeChecker,
  runPodcastScheduler,
  runAllCronJobs,
  runGoogleAudioGenerator
} from './cron-actions';
