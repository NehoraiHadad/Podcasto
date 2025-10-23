import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import {
  getAnalyticsDashboardStatsAction,
  getUserGrowthDataAction,
  getTopPodcastsAction,
} from '@/lib/actions/admin/analytics-actions';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsOverview } from '@/components/admin/analytics/stats-overview';
import { UserGrowthChart } from '@/components/admin/analytics/user-growth-chart';
import { TopPodcastsTable } from '@/components/admin/analytics/top-podcasts-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Analytics Dashboard | Podcasto Admin',
  description: 'View platform analytics, user growth, and podcast performance metrics',
};

export const dynamic = 'force-dynamic';

// Loading skeletons
function StatsOverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-80 w-full" />;
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// Server components for data fetching
async function StatsOverviewSection() {
  const result = await getAnalyticsDashboardStatsAction();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {result.error || 'Failed to load analytics stats'}
        </AlertDescription>
      </Alert>
    );
  }

  return <StatsOverview stats={result.data} />;
}

async function UserGrowthSection() {
  const result = await getUserGrowthDataAction();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {result.error || 'Failed to load user growth data'}
        </AlertDescription>
      </Alert>
    );
  }

  return <UserGrowthChart data={result.data} />;
}

async function TopPodcastsSection() {
  const result = await getTopPodcastsAction(10);

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {result.error || 'Failed to load top podcasts'}
        </AlertDescription>
      </Alert>
    );
  }

  return <TopPodcastsTable podcasts={result.data} />;
}

export default async function AnalyticsPage() {
  await checkIsAdmin({ redirectOnFailure: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      <div className="space-y-8">
        {/* Stats Overview */}
        <section>
          <Suspense fallback={<StatsOverviewSkeleton />}>
            <StatsOverviewSection />
          </Suspense>
        </section>

        {/* User Growth Chart */}
        <section>
          <Suspense fallback={<ChartSkeleton />}>
            <UserGrowthSection />
          </Suspense>
        </section>

        {/* Top Podcasts */}
        <section>
          <Suspense fallback={<TableSkeleton />}>
            <TopPodcastsSection />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
