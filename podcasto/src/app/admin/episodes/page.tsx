import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ServerEpisodesList } from '@/components/admin/server-episodes-list';

export const metadata = {
  title: 'Manage Episodes | Admin Dashboard | Podcasto',
  description: 'Manage and view podcast episodes',
};

export const dynamic = 'force-dynamic';

// Loading skeleton for the episodes list
function EpisodesListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full max-w-sm" />
      <div className="border rounded-md p-4">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default async function EpisodesPage() {
  // Ensure user is an admin
  await checkIsAdmin({ redirectOnFailure: true });
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Episodes</h1>
      
      <Suspense fallback={<EpisodesListSkeleton />}>
        <ServerEpisodesList />
      </Suspense>
    </div>
  );
} 