'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
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

interface GenerateEpisodeButtonProps {
  podcastId: string;
  defaultHours?: number;
}

export function GenerateEpisodeButton({ podcastId, defaultHours = 24 }: GenerateEpisodeButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const handleGenerateEpisode = async () => {
    try {
      setIsGenerating(true);
      setShowDialog(false);

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
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button disabled={isGenerating} className="gap-1">
          <PlusCircle className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Generate Episode Now'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate New Episode</DialogTitle>
          <DialogDescription>
            Choose a time range for collecting content. By default, the last {defaultHours} hours will be used.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <EpisodeDateRangePicker
            onRangeSelect={handleDateRangeSelect}
            onClear={handleClearDateRange}
            defaultHours={defaultHours}
          />

          {dateRange && (
            <div className="mt-4 rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Selected Range:</p>
              <p className="text-muted-foreground">
                {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowDialog(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerateEpisode} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Episode'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 