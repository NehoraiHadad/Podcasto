'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Images } from 'lucide-react';

interface ActionButtonsProps {
  isGenerating: boolean;
  isLoadingGallery: boolean;
  variationCount: number;
  selectedVariationLabel?: string;
  onGenerate: () => void;
  onLoadGallery: () => void;
}

export function ActionButtons({
  isGenerating,
  isLoadingGallery,
  variationCount,
  selectedVariationLabel,
  onGenerate,
  onLoadGallery
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex-1 w-full sm:w-auto"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating {variationCount > 1 ? `${variationCount} variations` : 'image'}...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI {selectedVariationLabel && `(${selectedVariationLabel})`}
          </>
        )}
      </Button>

      <Button
        type="button"
        onClick={onLoadGallery}
        disabled={isLoadingGallery}
        variant="outline"
        className="flex-1 w-full sm:w-auto"
      >
        {isLoadingGallery ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Images className="mr-2 h-4 w-4" />
            Browse Gallery
          </>
        )}
      </Button>
    </div>
  );
}
