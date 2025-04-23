import { requireAdmin } from '@/lib/actions/auth-actions';
import { notFound } from 'next/navigation';
import { episodesApi } from '@/lib/db/api';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { EpisodeEditForm } from '@/components/admin/episode-edit-form';

export const metadata = {
  title: 'Edit Episode | Admin Dashboard | Podcasto',
  description: 'Edit podcast episode details',
};

// Loading skeleton for the episode edit form
function EpisodeEditFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full max-w-md" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-32 w-full max-w-md" />
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

async function EpisodeEditContent({ params }: { params: Promise<{ id: string }> }) {
  // Await params before using its properties
  const resolvedParams = await params;
  
  // Fetch episode data using the resolved id
  const episode = await episodesApi.getEpisodeById(resolvedParams.id);
  
  if (!episode) {
    notFound();
  }
  
  return <EpisodeEditForm episode={episode} />;
}

export default async function EditEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  // Ensure user is an admin
  await requireAdmin();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Episode</h1>
      
      <Suspense fallback={<EpisodeEditFormSkeleton />}>
        <EpisodeEditContent params={params} />
      </Suspense>
    </div>
  );
} 