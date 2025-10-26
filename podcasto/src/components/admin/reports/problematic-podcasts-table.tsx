'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';

interface ProblematicPodcast {
  podcast_id: string;
  total_attempts: number;
  failed_attempts: number;
  failure_rate: number;
  podcast_title: string;
  created_by: string;
}

interface ProblematicPodcastsTableProps {
  podcasts: ProblematicPodcast[];
}

/**
 * Client component displaying problematic podcasts
 * Shows podcasts with high failure rates
 */
export function ProblematicPodcastsTable({
  podcasts,
}: ProblematicPodcastsTableProps) {
  const getFailureRateColor = (rate: number) => {
    if (rate >= 0.9) {
      return 'text-red-600 dark:text-red-400 font-semibold';
    }
    if (rate >= 0.7) {
      return 'text-orange-600 dark:text-orange-400 font-medium';
    }
    return 'text-yellow-600 dark:text-yellow-400';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>Problematic Podcasts</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {podcasts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No problematic podcasts found. All systems operating normally.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Podcasts appear here when they have 3+ failed generation attempts with
              80%+ failure rate in the past 7 days.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Podcast Title</TableHead>
                  <TableHead className="text-right">Total Attempts</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Failure Rate</TableHead>
                  <TableHead>Creator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {podcasts.map((podcast) => (
                  <TableRow key={podcast.podcast_id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/podcasts?id=${podcast.podcast_id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      >
                        {podcast.podcast_title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {podcast.total_attempts}
                    </TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">
                      {podcast.failed_attempts}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={getFailureRateColor(podcast.failure_rate)}>
                        {(podcast.failure_rate * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {podcast.created_by}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
