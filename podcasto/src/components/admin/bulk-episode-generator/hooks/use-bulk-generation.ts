'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { generateBulkEpisodes, previewBulkEpisodes } from '@/lib/actions/episode/bulk';
import type { GenerationStep, DateRange, PreviewData, GenerationResults } from '../types';

export function useBulkGeneration(podcastId: string) {
  const router = useRouter();

  const [step, setStep] = useState<GenerationStep>('selection');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<GenerationResults | null>(null);

  const actions = {
    selectDateRange: (startDate: Date, endDate: Date) => {
      setDateRange({ startDate, endDate });
      setPreviewData(null);
    },

    clearDateRange: () => {
      setDateRange(null);
      setPreviewData(null);
    },

    preview: async () => {
      if (!dateRange) {
        toast.error('Please select a date range');
        return;
      }

      try {
        const result = await previewBulkEpisodes(
          podcastId,
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
    },

    generate: async () => {
      if (!dateRange) {
        toast.error('Please select a date range');
        return;
      }

      try {
        setIsGenerating(true);
        setStep('generating');

        const result = await generateBulkEpisodes(
          podcastId,
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
    },

    reset: () => {
      setStep('selection');
      setDateRange(null);
      setPreviewData(null);
      setGenerationResults(null);
    },

    goToStep: (newStep: GenerationStep) => {
      setStep(newStep);
    },
  };

  const canPreview = dateRange !== null;
  const canGenerate = Boolean(previewData && step === 'preview');

  return {
    step,
    dateRange,
    previewData,
    isGenerating,
    generationResults,
    actions,
    canPreview,
    canGenerate,
  };
}
