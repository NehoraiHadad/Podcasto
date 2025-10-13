/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * Please import from '@/lib/actions/admin' instead.
 *
 * This file re-exports all admin actions from the new modular structure.
 *
 * Old structure (201 lines):
 * - All functions in one file
 * - Mixed concerns (stats, auth, cron operations)
 *
 * New structure (5 files, each < 100 lines):
 * - admin/types.ts: Shared type definitions
 * - admin/stats-actions.ts: Dashboard statistics
 * - admin/auth-actions.ts: Admin authentication and role checking
 * - admin/cron-actions.ts: CRON job management
 * - admin/index.ts: Consolidated exports
 *
 * @deprecated Import from '@/lib/actions/admin' for better maintainability
 *
 * Note: This file does not have "use server" at the top because it only re-exports.
 * The actual server actions already have "use server" in their respective modules.
 */

export {
  getAdminDashboardStats,
  checkIsAdmin,
  getUserRole,
  runEpisodeChecker,
  runPodcastScheduler,
  runAllCronJobs,
  runGoogleAudioGenerator
} from './admin';

export type {
  AdminDashboardStats,
  CronOperationResult
} from './admin';
