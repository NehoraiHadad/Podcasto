'use client';

import { Sparkles, Images } from 'lucide-react';
import { LoadingButton } from '@/components/admin/shared/image-management';

interface ActionButtonsProps {
  isGenerating: boolean;
  isLoadingGallery: boolean;
  variationCount: number;
  selectedVariationLabel?: string;
  onGenerate: () => void;
  onLoadGallery?: () => void;
}

export function ActionButtons({
  isGenerating,
  isLoadingGallery,
  variationCount,
  selectedVariationLabel,
  onGenerate,
  onLoadGallery
}: ActionButtonsProps) {
  const generateLabel = selectedVariationLabel
    ? `Generate with AI (${selectedVariationLabel})`
    : 'Generate with AI';

  const generatingLabel = variationCount > 1
    ? `Generating ${variationCount} variations...`
    : 'Generating image...';

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <LoadingButton
        type="button"
        isLoading={isGenerating}
        loadingText={generatingLabel}
        idleText={generateLabel}
        idleIcon={<Sparkles className="mr-2 h-4 w-4" />}
        onClick={onGenerate}
        className="flex-1 w-full sm:w-auto"
      />

      {onLoadGallery && (
        <LoadingButton
          type="button"
          isLoading={isLoadingGallery}
          loadingText="Loading..."
          idleText="Browse Gallery"
          idleIcon={<Images className="mr-2 h-4 w-4" />}
          onClick={onLoadGallery}
          variant="outline"
          className="flex-1 w-full sm:w-auto"
        />
      )}
    </div>
  );
}
