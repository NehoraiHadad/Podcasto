'use client';

import { useEffect, useState } from 'react';
import { Check, Circle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEpisodeProcessingLogs } from '@/lib/actions/episode/tracking';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  StageStatus,
  STAGE_CONFIGS,
  type ProcessingLogEntry
} from '@/types/processing';

export interface ProcessingTimelineProps {
  episodeId: string;
  className?: string;
}

/**
 * Timeline component visualizing episode processing progress
 */
export function ProcessingTimeline({ episodeId, className }: ProcessingTimelineProps) {
  const [logs, setLogs] = useState<ProcessingLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      setError(null);

      const result = await getEpisodeProcessingLogs(episodeId);

      if (result.success && result.data) {
        setLogs(result.data);
      } else {
        setError(result.error || 'Failed to load processing logs');
      }

      setIsLoading(false);
    }

    fetchLogs();
  }, [episodeId]);

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No processing logs available for this episode.
      </div>
    );
  }

  // Filter logs to show only completed or failed logs (not started logs that weren't updated)
  // Show started logs only if they're the latest log for that stage
  const processedLogs: ProcessingLogEntry[] = [];

  // Group logs by stage to find the latest status for each
  const stageMap = new Map<string, ProcessingLogEntry[]>();
  logs.forEach(log => {
    const existing = stageMap.get(log.stage) || [];
    existing.push(log);
    stageMap.set(log.stage, existing);
  });

  // For each stage, pick the most relevant log
  stageMap.forEach((stageLogs) => {
    // Sort by created_at descending to get latest first
    stageLogs.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Priority: failed > completed > started
    const failed = stageLogs.find(l => l.status === StageStatus.FAILED);
    const completed = stageLogs.find(l => l.status === StageStatus.COMPLETED);
    const started = stageLogs.find(l => l.status === StageStatus.STARTED);

    if (failed) {
      processedLogs.push(failed);
    } else if (completed) {
      processedLogs.push(completed);
    } else if (started) {
      processedLogs.push(started);
    }
  });

  // Sort chronologically by created_at
  const timelineItems = processedLogs.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className={cn('space-y-0', className)}>
      {timelineItems.map((log, index) => (
        <StageItem
          key={log.id}
          log={log}
          isLast={index === timelineItems.length - 1}
        />
      ))}
    </div>
  );
}

/**
 * Individual stage item in the timeline
 */
interface StageItemProps {
  log: ProcessingLogEntry;
  isLast: boolean;
}

function StageItem({ log, isLast }: StageItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = STAGE_CONFIGS[log.stage];

  const isCompleted = log.status === StageStatus.COMPLETED;
  const isFailed = log.status === StageStatus.FAILED;
  const isActive = log.status === StageStatus.STARTED;

  // Format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Get icon based on status
  const getIcon = () => {
    if (isCompleted) return <Check className="h-4 w-4" />;
    if (isFailed) return <AlertCircle className="h-4 w-4" />;
    if (isActive) return <Loader2 className="h-4 w-4 animate-spin" />;
    return <Circle className="h-4 w-4" />;
  };

  // Get color classes
  const getColorClasses = () => {
    if (isCompleted) return 'bg-green-500 text-white';
    if (isFailed) return 'bg-red-500 text-white';
    if (isActive) return 'bg-blue-500 text-white';
    return 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400';
  };

  const hasError = isFailed && log.error_message;

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          getColorClasses()
        )}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium leading-none">{config?.label || log.stage}</p>
            <p className="text-sm text-muted-foreground">{config?.description}</p>
          </div>

          <div className="flex flex-col items-end gap-1 text-sm">
            {log.duration_ms && (
              <span className="font-medium text-muted-foreground">
                {formatDuration(log.duration_ms)}
              </span>
            )}
            {isActive && (
              <span className="text-blue-600 dark:text-blue-400">In progress...</span>
            )}
            {log.completed_at && (
              <span className="text-xs text-muted-foreground">
                {new Date(log.completed_at).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Error details */}
        {hasError && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mt-3">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide error details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show error details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm">
                <p className="font-medium text-red-800 dark:text-red-400 mb-1">
                  Error Message:
                </p>
                <p className="text-red-700 dark:text-red-300">{log.error_message}</p>
                {log.error_details?.error_type && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Type: {log.error_details.error_type}
                  </p>
                )}
                {log.error_details?.retry_count !== undefined && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Retry Count: {log.error_details.retry_count}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for timeline
 */
function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
