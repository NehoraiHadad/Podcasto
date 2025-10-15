import { TooltipContent } from '@/components/ui/tooltip';
import { formatElapsedTime } from '../utils/time-formatter';
import type { StatusType } from '../types';

interface StatusTooltipProps {
  message: string;
  status: StatusType;
  elapsedTime: number;
  lastChecked: Date;
}

/**
 * Presentational component for displaying tooltip content with status information
 * Shows different content based on pending vs completed statuses
 */
export function StatusTooltip({
  message,
  status,
  elapsedTime,
  lastChecked
}: StatusTooltipProps) {
  const isPending = status.toLowerCase() === 'pending';

  const lastCheckedText = lastChecked
    ? `Last checked: ${lastChecked.toLocaleTimeString()}`
    : '';

  return (
    <TooltipContent>
      <p>{message}</p>
      {isPending && (
        <>
          <p className="text-xs mt-1">Processing time: {formatElapsedTime(elapsedTime)}</p>
          <p className="text-xs mt-1 italic">Average completion time: 2-5 minutes</p>
        </>
      )}
      {!isPending && lastCheckedText && (
        <p className="text-xs mt-1">{lastCheckedText}</p>
      )}
    </TooltipContent>
  );
}
