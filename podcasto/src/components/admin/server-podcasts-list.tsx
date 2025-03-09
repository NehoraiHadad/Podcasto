import Link from 'next/link';
import { format } from 'date-fns';
import { createActionClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PodcastActionsMenu } from './podcast-actions-menu';

/**
 * Server component that fetches and displays a list of podcasts
 * Updated to follow Next.js 15 best practices for data fetching
 */
export async function ServerPodcastsList() {
  // Opt out of caching for this component
  // In Next.js 15, fetch requests are not cached by default, but this makes it explicit
  noStore();
  
  try {
    // Fetch podcasts from the database
    const supabase = await createActionClient();
    const { data: podcasts, error } = await supabase
      .from('podcasts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch podcasts: ${error.message}`);
    }
    
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
                <TableHead>Language</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podcasts.map((podcast) => (
                <TableRow key={podcast.id}>
                  <TableCell className="font-medium">{podcast.title}</TableCell>
                  <TableCell>{podcast.language}</TableCell>
                  <TableCell>{format(new Date(podcast.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      Active
                    </Badge>
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