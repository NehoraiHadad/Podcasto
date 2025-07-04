import Link from 'next/link';
import { format } from 'date-fns';
import { unstable_noStore as noStore } from 'next/cache';
import { podcastsApi } from '@/lib/db/api';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PodcastActionsMenu } from './podcast-actions-menu';

// Define the expected podcast type for the component
interface Podcast {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string;
  timestamp?: string;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Server component that fetches and displays a list of podcasts
 * Updated to pass status information to PodcastActionsMenu
 */
export async function ServerPodcastsList() {
  // Opt out of caching for this component
  // In Next.js 15, fetch requests are not cached by default, but this makes it explicit
  noStore();
  
  try {
    // Fetch podcasts from the database using Drizzle API
    const drizzlePodcasts = await podcastsApi.getAllPodcasts();
    
    // Convert Drizzle podcasts to the expected format, preserving status info
    const podcasts: Podcast[] = drizzlePodcasts.map(podcast => ({
      id: podcast.id,
      title: podcast.title,
      description: podcast.description,
      cover_image: podcast.cover_image,
      created_at: podcast.created_at ? podcast.created_at.toISOString() : null,
      updated_at: podcast.updated_at ? podcast.updated_at.toISOString() : null,
      status: podcast.status, // Include status
      timestamp: podcast.timestamp, // Include timestamp for status tracking
    }));
    
    if (!podcasts || podcasts.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No podcasts found.</p>
          <Link href="/admin/podcasts/create">
            <Button className="mt-4">Create Your First Podcast</Button>
          </Link>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Podcasts</h2>
          <Link href="/admin/podcasts/create">
            <Button>Create New Podcast</Button>
          </Link>
        </div>
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podcasts.map((podcast) => (
                <TableRow key={podcast.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/podcasts/${podcast.id}`} className="hover:underline">
                      {podcast.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {podcast.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    {podcast.created_at && format(new Date(podcast.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <PodcastActionsMenu podcast={podcast} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ServerPodcastsList:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-600">Failed to load podcasts. Please try again later.</p>
        <p className="text-xs text-red-500 mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
} 