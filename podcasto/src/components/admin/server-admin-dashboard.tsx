import { unstable_noStore as noStore } from 'next/cache';
import { getAdminDashboardStats } from '@/lib/actions/admin';
import { verifyAdminAccess } from '@/lib/utils/admin-utils';
import {
  Radio,
  FileAudio,
  Users,
  Activity
} from 'lucide-react';
import { StatCard } from './dashboard/statistics/stat-card';
import { StatusBreakdownCard } from './dashboard/statistics/status-breakdown-card';
import { ActivityFeed } from './dashboard/activity/activity-feed';
import { QuickActionsGrid } from './dashboard/quick-actions/quick-actions-grid';

/**
 * Server component for the admin dashboard
 * This component fetches data server-side and renders the dashboard
 * It also verifies that the user is an admin before rendering
 */
export async function ServerAdminDashboard() {
  noStore();
  await verifyAdminAccess();

  try {
    const stats = await getAdminDashboardStats();

    return (
      <div className="space-y-6">
        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Podcasts"
            value={stats.totalPodcasts}
            description="All podcasts in system"
            icon={Radio}
            iconColor="text-blue-500"
          />
          <StatCard
            title="Active Podcasts"
            value={stats.activePodcasts}
            description="Currently active"
            icon={Activity}
            iconColor="text-green-500"
          />
          <StatCard
            title="Total Episodes"
            value={stats.totalEpisodes}
            description="All episodes generated"
            icon={FileAudio}
            iconColor="text-purple-500"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            description="Registered users"
            icon={Users}
            iconColor="text-orange-500"
          />
        </div>

        {/* Second Row: Status Breakdown + Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <StatusBreakdownCard statusBreakdown={stats.statusBreakdown} />
          <QuickActionsGrid />
        </div>

        {/* Recent Activity */}
        <ActivityFeed activities={stats.recentActivity} />
      </div>
    );
  } catch (error) {
    console.error('Error in ServerAdminDashboard:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-600">Failed to load dashboard data. Please try again later.</p>
        <p className="text-xs text-red-500 mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }
} 