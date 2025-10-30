'use client';

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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EpisodeDateRangePicker } from './episode-date-range-picker';
import { generatePodcastEpisode, DateRange } from '@/lib/actions/podcast/generate';
import { formatUserDate } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';

// TODO: Support scheduling/delayed episode publishing so creators can decide when to make episodes public.

export interface GenerateEpisodeButtonProps {
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
          ? 'Episode generation started for your chosen timeframe.'
          : 'Episode generation started.';
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
          <Button disabled={isGenerating} className="gap-1">
            <PlusCircle className="h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Episode'}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Generate a new episode
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-muted-foreground transition hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label="Learn how episode generation works"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Episodes publish automatically once processing finishes.
              </TooltipContent>
            </Tooltip>
          </DialogTitle>
          <DialogDescription>
            Choose how much recent content to include. By default, we'll review the last {defaultHours} hours.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isPaused && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">This podcast is currently paused</p>
                <p className="text-sm text-amber-700 mt-1">
                  Automatic episode generation is disabled. You can still create episodes manually at any time.
                </p>
              </div>
            </div>
          )}

          <EpisodeDateRangePicker
            onRangeSelect={handleDateRangeSelect}
            onClear={handleClearDateRange}
            defaultHours={defaultHours}
          />

          {dateRange && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Selected range</p>
              <p className="text-muted-foreground">
                {formatUserDate(dateRange.startDate, DATE_FORMATS.DISPLAY_DATE)} -{' '}
                {formatUserDate(dateRange.endDate, DATE_FORMATS.DISPLAY_DATE)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerateEpisode} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Start generation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
