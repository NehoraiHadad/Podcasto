'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CalendarRange, AlertCircle, Loader2, CheckCircle, Info } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EpisodeDateRangePicker } from './episode-date-range-picker';
import {
  generateBulkEpisodes,
  previewBulkEpisodes,
} from '@/lib/actions/episode-actions';
import { formatDateRange, type BatchConfiguration } from '@/lib/utils/episode-date-calculator';

interface BulkEpisodeGeneratorProps {
  podcasts: Array<{
    id: string;
    title: string;
    is_paused: boolean;
  }>;
}

type GenerationStep = 'selection' | 'preview' | 'generating' | 'completed';

export function BulkEpisodeGenerator({ podcasts }: BulkEpisodeGeneratorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<GenerationStep>('selection');
  const [selectedPodcastId, setSelectedPodcastId] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null);
  const [previewData, setPreviewData] = useState<{
    totalEpisodes: number;
    estimatedTime: string;
    episodeDates: Array<{ startDate: Date; endDate: Date; episodeNumber: number }>;
    batchConfiguration?: BatchConfiguration;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<{
    successCount: number;
    failureCount: number;
    totalRequested: number;
  } | null>(null);

  const selectedPodcast = podcasts.find((p) => p.id === selectedPodcastId);

  const handleDateRangeSelect = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
    setPreviewData(null); // Clear preview when date changes
  };

  const handleClearDateRange = () => {
    setDateRange(null);
    setPreviewData(null);
  };

  const handlePreview = async () => {
    if (!selectedPodcastId || !dateRange) {
      toast.error('Please select a podcast and date range');
      return;
    }

    try {
      const result = await previewBulkEpisodes(
        selectedPodcastId,
        dateRange.startDate,
        dateRange.endDate
      );

      if (result.success && result.episodeDates && result.totalEpisodes) {
        setPreviewData({
          totalEpisodes: result.totalEpisodes,
          estimatedTime: result.estimatedTime || 'Unknown',
          episodeDates: result.episodeDates,
          batchConfiguration: result.batchConfiguration,
        });
        setStep('preview');
      } else {
        toast.error(result.error || 'Failed to preview episodes');
      }
    } catch (error) {
      console.error('Error previewing episodes:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleGenerate = async () => {
    if (!selectedPodcastId || !dateRange) {
      toast.error('Please select a podcast and date range');
      return;
    }

    try {
      setIsGenerating(true);
      setStep('generating');

      const result = await generateBulkEpisodes(
        selectedPodcastId,
        dateRange.startDate,
        dateRange.endDate
      );

      setGenerationResults({
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalRequested: result.totalRequested,
      });

      setStep('completed');

      if (result.success) {
        toast.success(
          `Successfully created ${result.successCount} episode${result.successCount !== 1 ? 's' : ''}`
        );
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to generate episodes');
      }
    } catch (error) {
      console.error('Error generating episodes:', error);
      toast.error('An unexpected error occurred');
      setStep('selection');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setStep('selection');
    setSelectedPodcastId('');
    setDateRange(null);
    setPreviewData(null);
    setGenerationResults(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset after close animation
    setTimeout(() => {
      handleReset();
    }, 300);
  };

  const canPreview = selectedPodcastId && dateRange;
  const canGenerate = previewData && step === 'preview';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CalendarRange className="h-4 w-4" />
          Generate Multiple Episodes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Episode Generator</DialogTitle>
          <DialogDescription>
            Create multiple episodes for a date range based on podcast frequency settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1: Selection */}
          {(step === 'selection' || step === 'preview') && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Podcast</label>
                <Select
                  value={selectedPodcastId}
                  onValueChange={setSelectedPodcastId}
                  disabled={step === 'preview'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a podcast" />
                  </SelectTrigger>
                  <SelectContent>
                    {podcasts.map((podcast) => (
                      <SelectItem key={podcast.id} value={podcast.id}>
                        {podcast.title}
                        {podcast.is_paused && ' (Paused)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPodcast?.is_paused && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This podcast is paused. Episodes will be created but automatic scheduling is disabled.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date Range</label>
                <EpisodeDateRangePicker
                  onRangeSelect={handleDateRangeSelect}
                  onClear={handleClearDateRange}
                  defaultHours={24}
                />
              </div>

              {dateRange && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Selected: {dateRange.startDate.toLocaleDateString()} -{' '}
                    {dateRange.endDate.toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Episode Preview</CardTitle>
                <CardDescription>
                  {previewData.totalEpisodes} episode{previewData.totalEpisodes !== 1 ? 's' : ''}{' '}
                  will be created
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap text-sm">
                  <Badge variant="secondary">
                    Estimated time: {previewData.estimatedTime}
                  </Badge>
                  {previewData.batchConfiguration && previewData.batchConfiguration.requiresBatching && (
                    <Badge variant="outline">
                      {previewData.batchConfiguration.totalBatches} batch{previewData.batchConfiguration.totalBatches > 1 ? 'es' : ''} needed
                    </Badge>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {previewData.batchConfiguration && previewData.batchConfiguration.requiresBatching ? (
                      <>
                        This will be processed in <strong>{previewData.batchConfiguration.totalBatches} batches</strong> of up to{' '}
                        <strong>{previewData.batchConfiguration.episodesPerBatch} episodes</strong> each, with a short delay between requests to respect API rate limits.
                        Total time: <strong>{previewData.estimatedTime}</strong>.
                      </>
                    ) : (
                      <>
                        Episodes will be created in a single batch with a short delay between each to respect API rate limits.
                      </>
                    )}
                    {' '}Please do not close this window during generation.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Episodes to be created:</p>
                  <div className="max-h-[200px] overflow-y-auto space-y-1 text-sm">
                    {previewData.episodeDates.map((episode) => (
                      <div
                        key={episode.episodeNumber}
                        className="flex items-center gap-2 p-2 bg-muted rounded-md"
                      >
                        <span className="font-mono text-xs text-muted-foreground">
                          #{episode.episodeNumber}
                        </span>
                        <span>{formatDateRange(episode)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="font-medium">Generating Episodes...</p>
                <p className="text-sm text-muted-foreground">
                  This may take several minutes. Please wait.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Completed */}
          {step === 'completed' && generationResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {generationResults.failureCount === 0 ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Generation Completed Successfully
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Generation Completed with Issues
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-md">
                    <p className="text-2xl font-bold">{generationResults.totalRequested}</p>
                    <p className="text-xs text-muted-foreground">Requested</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <p className="text-2xl font-bold text-green-600">
                      {generationResults.successCount}
                    </p>
                    <p className="text-xs text-green-700">Succeeded</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-md">
                    <p className="text-2xl font-bold text-red-600">
                      {generationResults.failureCount}
                    </p>
                    <p className="text-xs text-red-700">Failed</p>
                  </div>
                </div>

                {generationResults.failureCount > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Some episodes failed to generate. Check the episodes list for details.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {step === 'selection' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handlePreview} disabled={!canPreview}>
                Preview Episodes
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('selection')}>
                Back
              </Button>
              <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Episodes'}
              </Button>
            </>
          )}

          {step === 'completed' && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Generate More
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
