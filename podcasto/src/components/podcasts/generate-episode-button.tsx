'use client';

import { formatUserDate } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PlusCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { generatePodcastEpisode, DateRange } from '@/lib/actions/podcast/generate';
import { EpisodeDateRangePicker } from './episode-date-range-picker';

// TODO: Support scheduling/delayed episode publishing so creators can decide when to make episodes public.

interface GenerateEpisodeButtonProps {
  podcastId: string;
  isPaused?: boolean;
  defaultHours?: number;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideButton?: boolean;
}

export function GenerateEpisodeButton({
  podcastId,
  isPaused = false,
  defaultHours = 24,
  triggerOpen,
  onOpenChange,
  hideButton = false,
}: GenerateEpisodeButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [internalShowDialog, setInternalShowDialog] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  // Use external control if provided, otherwise use internal state
  const showDialog = triggerOpen !== undefined ? triggerOpen : internalShowDialog;
  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalShowDialog(open);
    }
  };

  const handleGenerateEpisode = async () => {
    try {
      setIsGenerating(true);
      handleOpenChange(false);

      const result = await generatePodcastEpisode(podcastId, dateRange || undefined);

      if (result.success) {
        const message = dateRange
          ? `Episode generation started for custom date range`
          : 'Episode generation started';
        toast.success(message);
        router.refresh();
        setDateRange(null);
      } else {
        toast.error(result.error || 'Failed to generate episode');
      }
    } catch (error) {
      console.error('Error generating episode:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDateRangeSelect = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
  };

  const handleClearDateRange = () => {
    setDateRange(null);
  };

  return (
    <Dialog open={showDialog} onOpenChange={handleOpenChange}>
      {!hideButton && (
        <DialogTrigger asChild>
          <Button disabled={isGenerating} className="gap-1 w-full">
            <PlusCircle className="h-4 w-4" />
            {isGenerating ? 'Creating...' : 'Generate Episode'}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Podcast Episode</DialogTitle>
          <DialogDescription>
            Select a time range to choose which updates or messages will be included in your next episode.
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              Episodes use your channel posts or updates for the selected timeframe. The more recent, the more timely the episode.
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isPaused && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">Podcast is paused</p>
                <p className="text-sm text-amber-700 mt-1">
                  Automatic generation is off. You can still create episodes manually here.
                </p>
              </div>
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <EpisodeDateRangePicker
                    onRangeSelect={handleDateRangeSelect}
                    onClear={handleClearDateRange}
                    defaultHours={defaultHours}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                Pick a period of recent channel updates/messages to include in the new episode.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {dateRange && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Selected Range:</p>
              <p className="text-muted-foreground">
                {formatUserDate(dateRange.startDate, DATE_FORMATS.DISPLAY_DATE)} - {formatUserDate(dateRange.endDate, DATE_FORMATS.DISPLAY_DATE)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isGenerating}
            aria-label="Cancel episode generation"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateEpisode}
            disabled={isGenerating}
            aria-label="Generate podcast episode now"
          >
            {isGenerating ? 'Creating...' : 'Create Episode'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
