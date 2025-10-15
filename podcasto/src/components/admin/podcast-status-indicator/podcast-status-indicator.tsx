'use client';

import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useStatusPolling } from './hooks/use-status-polling';
import { useElapsedTime } from './hooks/use-elapsed-time';
import { useStatusDetails } from './hooks/use-status-details';
import { StatusBadge } from './components/status-badge';
import { StatusTooltip } from './components/status-tooltip';
import type { PodcastStatusIndicatorProps } from './types';

/**
 * Component that displays the podcast generation status
 * and automatically refreshes to check for updates
 */
export function PodcastStatusIndicator({
  podcastId,
  episodeId,
  timestamp,
  initialStatus = 'pending',
  onStatusChange
}: PodcastStatusIndicatorProps) {
  // Use custom hooks for state management
  const { status, isLoading, lastChecked } = useStatusPolling({
    podcastId,
    episodeId,
    timestamp,
    initialStatus,
    onStatusChange
  });

  const elapsedTime = useElapsedTime(status);
  const statusDetails = useStatusDetails(status);

  // Early return if no identifiers
  if (!podcastId || (!episodeId && !timestamp)) {
    return null;
  }

  const isPending = status.toLowerCase() === 'pending';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2">
            <StatusBadge
              label={statusDetails.label}
              color={statusDetails.color}
              icon={statusDetails.icon}
              isLoading={isLoading}
              isPending={isPending}
            />
          </div>
        </TooltipTrigger>
        <StatusTooltip
          message={statusDetails.message}
          status={status}
          elapsedTime={elapsedTime}
          lastChecked={lastChecked}
        />
      </Tooltip>
    </TooltipProvider>
  );
}
