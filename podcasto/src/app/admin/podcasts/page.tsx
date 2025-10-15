import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { ServerPodcastsList } from '@/components/admin/server-podcasts-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Manage Podcasts | Admin Dashboard | Podcasto',
  description: 'Manage and create podcasts',
};

export const dynamic = 'force-dynamic';

// Loading skeleton for the podcasts list
function PodcastsListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full max-w-sm" />
      <div className="border rounded-md p-4">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default async function PodcastsPage() {
  // Ensure user is an admin
  await checkIsAdmin({ redirectOnFailure: true });
  
  return (
    <div className="space-y-6">
      <Suspense fallback={<PodcastsListSkeleton />}>
        <ServerPodcastsList />
      </Suspense>
    </div>
  );
} 