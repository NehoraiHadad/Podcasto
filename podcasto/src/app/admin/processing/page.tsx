import { requireAdmin } from '@/lib/actions/auth-actions';
import { Suspense } from 'react';
import { getProcessingStatistics, getFailedEpisodes } from '@/lib/actions/episode/tracking';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ProcessingStatsCard, StageBadge } from '@/components/admin/processing';
import { ProcessingStage } from '@/types/processing';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Processing Analytics | Admin Dashboard | Podcasto',
  description: 'View episode processing analytics and troubleshoot failures',
};

export const dynamic = 'force-dynamic';

function ProcessingAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

async function ProcessingAnalyticsContent() {
  const [statsResult, failedResult] = await Promise.all([
    getProcessingStatistics(),
    getFailedEpisodes(20)
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Processing Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Monitor episode processing performance and troubleshoot failures
        </p>
      </div>

      {/* Statistics Card */}
      {statsResult.success && statsResult.data ? (
        <ProcessingStatsCard stats={statsResult.data} />
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {statsResult.error || 'Failed to load processing statistics'}
          </AlertDescription>
        </Alert>
      )}

      {/* Failed Episodes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Failed Episodes</CardTitle>
          <CardDescription>
            Last 20 episodes that encountered processing errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failedResult.success && failedResult.data ? (
            failedResult.data.length > 0 ? (
              <div className="space-y-4">
                {failedResult.data.map(({ log, episode }) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/episodes/${episode.id}`}
                            className="font-medium hover:underline"
                          >
                            {episode.title}
                          </Link>
                          <StageBadge stage={log.stage as ProcessingStage} variant="compact" />
                        </div>

                        {log.error_message && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {log.error_message}
                          </p>
                        )}

                        {log.error_details?.error_type && (
                          <p className="text-xs text-muted-foreground">
                            Error Type: {log.error_details.error_type}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Failed at: {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/episodes/${episode.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No failed episodes found. Great work!
              </div>
            )
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {failedResult.error || 'Failed to load failed episodes'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ProcessingAnalyticsPage() {
  await requireAdmin();

  return (
    <Suspense fallback={<ProcessingAnalyticsSkeleton />}>
      <ProcessingAnalyticsContent />
    </Suspense>
  );
}
