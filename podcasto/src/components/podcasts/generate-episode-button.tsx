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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">Create New Podcast Episode</DialogTitle>
          <DialogDescription>
            Generate a new episode from your channel content. Choose a time period below to select which posts or updates to include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              Your episode will be generated from channel content within the selected time range. Recent content creates more timely episodes.
            </p>
          </div>

          {/* Paused Warning */}
          {isPaused && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Podcast is paused</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Automatic generation is disabled, but you can still create episodes manually.
                </p>
              </div>
            </div>
          )}

          {/* Date Range Picker */}
          <EpisodeDateRangePicker
            onRangeSelect={handleDateRangeSelect}
            onClear={handleClearDateRange}
            defaultHours={defaultHours}
          />

          {/* Selected Range Summary */}
          {dateRange && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">Ready to generate</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Content from {formatUserDate(dateRange.startDate, DATE_FORMATS.DISPLAY_DATE)} to {formatUserDate(dateRange.endDate, DATE_FORMATS.DISPLAY_DATE)}
                  </p>
                </div>
              </div>
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
