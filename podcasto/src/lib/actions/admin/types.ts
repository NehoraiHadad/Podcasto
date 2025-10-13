/**
 * Shared types for admin actions
 */

/**
 * Interface for admin dashboard statistics
 */
export interface AdminDashboardStats {
  totalPodcasts: number;
  totalEpisodes: number;
  totalUsers: number;
}

/**
 * Generalized result type for CRON operations
 */
export interface CronOperationResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}
