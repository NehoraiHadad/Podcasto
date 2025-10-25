import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ServerAdminDashboard } from '@/components/admin/server-admin-dashboard';
import { CronRunner } from '@/components/admin/cron-runner';

export const metadata = {
  title: 'Admin Dashboard | Podcasto',
  description: 'Manage podcasts and application settings',
};

export const dynamic = 'force-dynamic';

// Loading skeleton for the dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full max-w-sm" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export default async function AdminPage() {
  // Use the checkIsAdmin server action to check if the user is an admin
  // This will automatically redirect to unauthorized page if not
  await checkIsAdmin({ redirectOnFailure: true });
  
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Admin Dashboard</h1>

      <div className="grid gap-4 sm:gap-8 md:grid-cols-1 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Suspense fallback={<DashboardSkeleton />}>
            <ServerAdminDashboard />
          </Suspense>
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-4 sm:space-y-6">
            <CronRunner />
          </div>
        </div>
      </div>
    </div>
  );
} 