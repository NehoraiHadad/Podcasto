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
import { AlertTriangle, MessageSquareWarning } from 'lucide-react';
import { formatUserDate } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';

interface ProblematicPodcast {
  podcast_id: string;
  total_attempts: number;
  failed_attempts: number;
  failure_rate: number;
  podcast_title: string;
  created_by: string;
  recent_failure_reason: string | null;
  recent_error_details: Record<string, unknown> | null;
  last_failure_at: Date | null;
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

  /**
   * Format failure reason for display - extract the most important info
   */
  const formatFailureReason = (
    reason: string | null,
    errorDetails: Record<string, unknown> | null
  ): string => {
    if (!reason && !errorDetails) {
      return 'Unknown error';
    }

    // If we have error_details, try to extract useful info
    if (errorDetails) {
      const channelName = errorDetails.channel_name as string | undefined;
      const latestMessageDate = errorDetails.latest_message_date as string | undefined;
      const errorMessage = errorDetails.error_message as string | undefined;

      if (channelName && reason?.includes('No new messages')) {
        if (latestMessageDate) {
          const lastMessage = formatUserDate(latestMessageDate, DATE_FORMATS.DISPLAY_DATE);
          if (lastMessage) {
            return `No new messages in ${channelName} (last: ${lastMessage})`;
          }
        }
        return `No new messages in ${channelName}`;
      }

      if (errorMessage) {
        return errorMessage.length > 60 ? errorMessage.substring(0, 60) + '...' : errorMessage;
      }
    }

    // Fallback to the reason string
    if (reason) {
      return reason.length > 60 ? reason.substring(0, 60) + '...' : reason;
    }

    return 'Unknown error';
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
                  <TableHead>Recent Error</TableHead>
                  <TableHead>Creator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {podcasts.map((podcast) => {
                  const lastFailureAt = formatUserDate(
                    podcast.last_failure_at,
                    DATE_FORMATS.DISPLAY_DATETIME
                  );

                  return (
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
                      <TableCell className="max-w-md">
                        <div className="flex items-start gap-2">
                          <MessageSquareWarning className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {formatFailureReason(
                              podcast.recent_failure_reason,
                              podcast.recent_error_details
                            )}
                          </span>
                        </div>
                        {lastFailureAt && (
                          <div className="text-xs text-muted-foreground mt-1 ml-6">
                            {lastFailureAt}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {podcast.created_by}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
