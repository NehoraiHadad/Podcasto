'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteAllCostData, getCostDataStats } from '@/lib/actions/cost';
import { useToast } from '@/hooks/use-toast';

interface CostDataStats {
  totalEvents: number;
  totalEpisodeCosts: number;
  totalDailySummaries: number;
  totalMonthlySummaries: number;
  oldestEvent: Date | null;
  newestEvent: Date | null;
  podcastLevelEvents: number;
  episodeLevelEvents: number;
}

export function CostDataManagement() {
  const [stats, setStats] = useState<CostDataStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const loadStats = async () => {
    setLoading(true);
    const result = await getCostDataStats();
    if (result.success && result.stats) {
      setStats(result.stats);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to load statistics',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteAllCostData();

    if (result.success) {
      toast({
        title: 'Success',
        description: `Deleted ${result.deletedCounts?.events} cost events, ${result.deletedCounts?.episodeCosts} episode costs`,
      });
      setStats(null);
      setShowDeleteDialog(false);
      // Refresh the page to update the tables
      window.location.reload();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete cost data',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Cost Data Management
        </CardTitle>
        <CardDescription>
          Delete historical cost data that may be inaccurate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Box */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Why delete?</strong> Previous cost data may be inaccurate because
                we weren't tracking all AI API calls.
              </p>
              <p>
                <strong>What happens?</strong> The system will delete all historical cost data.
                From now on, all AI calls are tracked accurately.
              </p>
              <p className="text-destructive font-medium">
                <strong>Warning:</strong> This action is irreversible!
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {!stats && (
          <Button onClick={loadStats} disabled={loading} variant="outline">
            {loading ? 'Loading...' : 'Show Statistics Before Deleting'}
          </Button>
        )}

        {stats && (
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold text-sm">Existing Data Statistics:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Total cost events:</span>{' '}
                <strong>{stats.totalEvents.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Episode costs:</span>{' '}
                <strong>{stats.totalEpisodeCosts.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Podcast-level costs:</span>{' '}
                <strong>{stats.podcastLevelEvents.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Episode-level costs:</span>{' '}
                <strong>{stats.episodeLevelEvents.toLocaleString()}</strong>
              </div>
              {stats.oldestEvent && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Time range:</span>{' '}
                  <strong>
                    {new Date(stats.oldestEvent).toLocaleDateString('en-US')} -{' '}
                    {stats.newestEvent
                      ? new Date(stats.newestEvent).toLocaleDateString('en-US')
                      : 'Now'}
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Button */}
        <Button
          onClick={() => setShowDeleteDialog(true)}
          disabled={loading || !stats}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete All Cost Data
        </Button>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Are you sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  This action will delete <strong>all cost data</strong> from the system:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>{stats?.totalEvents.toLocaleString()} cost events</li>
                  <li>{stats?.totalEpisodeCosts.toLocaleString()} episode cost records</li>
                  <li>{stats?.totalDailySummaries.toLocaleString()} daily summaries</li>
                  <li>{stats?.totalMonthlySummaries.toLocaleString()} monthly summaries</li>
                </ul>
                <p className="text-destructive font-medium mt-2">
                  This data cannot be recovered!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {loading ? 'Deleting...' : 'Yes, Delete Everything'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
