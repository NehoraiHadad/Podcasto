import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

import { podcastsApi } from '@/lib/db/api';
import { requireAdmin } from '@/lib/actions/auth-actions';
import { PodcastEditForm } from '@/components/admin/podcast-edit-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit } from 'lucide-react';
import { GenerateEpisodeButton } from '@/components/admin/generate-episode-button';
import { BulkEpisodeGenerator } from '@/components/admin/bulk-episode-generator';

export const metadata = {
  title: 'Podcast Details | Admin Dashboard | Podcasto',
  description: 'View and edit podcast details',
};

function PodcastDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export default async function PodcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Ensure user is an admin
  await requireAdmin();
  
  // Wait for params to be resolved
  const { id } = await params;
  
  const podcast = await podcastsApi.getPodcastById(id);
  
  if (!podcast) {
    notFound();
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Podcast Details</h1>
        <div className="flex gap-2">
          <Link href={`/admin/podcasts/${id}/episodes`}>
            <Button variant="outline" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Episodes
            </Button>
          </Link>
          <GenerateEpisodeButton podcastId={id} isPaused={podcast.is_paused} />
          <BulkEpisodeGenerator
            podcastId={id}
            podcastTitle={podcast.title}
            isPaused={podcast.is_paused || false}
          />
        </div>
      </div>
      
      <Suspense fallback={<PodcastDetailsSkeleton />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {podcast.cover_image ? (
                  <div className="relative w-full aspect-square rounded-md overflow-hidden">
                    <Image
                      src={podcast.cover_image}
                      alt={podcast.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    No cover image
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Episodes:</span>
                  <span className="font-medium">{podcast.episodes_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {podcast.created_at && format(new Date(podcast.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">
                    {podcast.updated_at && format(new Date(podcast.updated_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Podcast Details
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Edit the podcast information below</CardDescription>
              </CardHeader>
              <CardContent>
                <PodcastEditForm podcast={podcast} />
              </CardContent>
            </Card>
          </div>
        </div>
      </Suspense>
    </div>
  );
} 