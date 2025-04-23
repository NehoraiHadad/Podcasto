import { requireAdmin } from '@/lib/actions/auth-actions';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ServerAdminDashboard } from '@/components/admin/server-admin-dashboard';
import { CronRunner } from '@/components/admin/cron-runner';

export const metadata = {
  title: 'Admin Dashboard | Podcasto',
  description: 'Manage podcasts and application settings',
};

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
  // Use the requireAdmin server action to check if the user is an admin
  // This will automatically redirect to unauthorized page if not
  await requireAdmin();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Suspense fallback={<DashboardSkeleton />}>
            <ServerAdminDashboard />
          </Suspense>
        </div>
        
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <CronRunner />
          </div>
        </div>
      </div>
    </div>
  );
} 