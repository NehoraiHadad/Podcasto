'use client';

import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useBulkGeneration } from './hooks/use-bulk-generation';
import { SelectionStep } from './steps/selection-step';
import { PreviewStep } from './steps/preview-step';
import { GeneratingStep } from './steps/generating-step';
import { CompletedStep } from './steps/completed-step';
import { GenerationFooter } from './components/generation-footer';
import type { BulkEpisodeGeneratorProps } from './types';

export function BulkEpisodeGenerator({
  podcastId,
  podcastTitle,
  isPaused,
}: BulkEpisodeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    step,
    dateRange,
    previewData,
    isGenerating,
    generationResults,
    actions,
    canPreview,
    canGenerate,
  } = useBulkGeneration(podcastId);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => actions.reset(), 300);
  };

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
            Create multiple episodes for &quot;{podcastTitle}&quot; based on frequency settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {(step === 'selection' || step === 'preview') && (
            <SelectionStep
              isPaused={isPaused}
              dateRange={dateRange}
              onDateRangeSelect={actions.selectDateRange}
              onClearDateRange={actions.clearDateRange}
            />
          )}

          {step === 'preview' && previewData && (
            <PreviewStep previewData={previewData} />
          )}

          {step === 'generating' && <GeneratingStep />}

          {step === 'completed' && generationResults && (
            <CompletedStep results={generationResults} />
          )}
        </div>

        <GenerationFooter
          step={step}
          canPreview={canPreview}
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          onClose={handleClose}
          onPreview={actions.preview}
          onGenerate={actions.generate}
          onReset={actions.reset}
          onBack={() => actions.goToStep('selection')}
        />
      </DialogContent>
    </Dialog>
  );
}
