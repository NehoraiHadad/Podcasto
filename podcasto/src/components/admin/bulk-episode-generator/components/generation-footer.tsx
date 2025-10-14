'use client';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import type { GenerationStep } from '../types';

interface GenerationFooterProps {
  step: GenerationStep;
  canPreview: boolean;
  canGenerate: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onPreview: () => void;
  onGenerate: () => void;
  onReset: () => void;
  onBack: () => void;
}

export function GenerationFooter({
  step,
  canPreview,
  canGenerate,
  isGenerating,
  onClose,
  onPreview,
  onGenerate,
  onReset,
  onBack,
}: GenerationFooterProps) {
  switch (step) {
    case 'selection':
      return (
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onPreview} disabled={!canPreview}>
            Preview Episodes
          </Button>
        </DialogFooter>
      );

    case 'preview':
      return (
        <DialogFooter>
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onGenerate} disabled={!canGenerate || isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Episodes'}
          </Button>
        </DialogFooter>
      );

    case 'completed':
      return (
        <DialogFooter>
          <Button variant="outline" onClick={onReset}>
            Generate More
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      );

    default:
      return null;
  }
}
