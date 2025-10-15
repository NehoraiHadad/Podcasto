/**
 * Shared types for admin actions
 */

/**
 * Activity entry for the admin dashboard
 */
export interface AdminActivity {
  id: string;
  type: 'podcast_created' | 'episode_generated' | 'episode_published' | 'episode_failed';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    podcastTitle?: string;
    episodeTitle?: string;
  };
}

/**
 * Episode status breakdown
 */
export interface StatusBreakdown {
  pending: number;
  processing: number;
  published: number;
  failed: number;
}

/**
 * Interface for admin dashboard statistics
 */
export interface AdminDashboardStats {
  totalPodcasts: number;
  totalEpisodes: number;
  totalUsers: number;
  activePodcasts: number;
  statusBreakdown: StatusBreakdown;
  recentActivity: AdminActivity[];
}

/**
 * Generalized result type for CRON operations
 */
export interface CronOperationResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}
