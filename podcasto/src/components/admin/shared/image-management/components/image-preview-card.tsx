'use client';

import Image from 'next/image';

interface ImagePreviewCardProps {
  /** Image URL to display */
  imageUrl: string;

  /** Alt text for the image */
  alt?: string;

  /** Optional description to display below the image */
  description?: string | null;

  /** Optional AI prompt to display below the image */
  prompt?: string | null;

  /** Action buttons to render (e.g., Save, Discard) */
  actions?: React.ReactNode;

  /** Maximum length for description truncation */
  maxDescriptionLength?: number;

  /** Custom className for the container */
  className?: string;
}

/**
 * Displays an image preview with optional description, prompt, and action buttons
 * Used for showing generated or uploaded images before final confirmation
 *
 * @example
 * <ImagePreviewCard
 *   imageUrl={previewUrl}
 *   alt="AI generated preview"
 *   description={episodeDescription}
 *   prompt={generatedPrompt}
 *   actions={
 *     <>
 *       <Button onClick={handleSave}>Save</Button>
 *       <Button onClick={handleDiscard} variant="outline">Discard</Button>
 *     </>
 *   }
 * />
 */
export function ImagePreviewCard({
  imageUrl,
  alt = 'Generated image',
  description,
  prompt,
  actions,
  maxDescriptionLength = 200,
  className = ''
}: ImagePreviewCardProps) {
  const handleCopyPrompt = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Display */}
      <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-md">
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>

      {/* Description Section */}
      {description && (
        <div className="text-sm text-muted-foreground mt-2 max-h-24 overflow-auto">
          <p className="font-semibold">Source description:</p>
          <p className="italic">
            {description.substring(0, maxDescriptionLength)}
            {description.length > maxDescriptionLength ? '...' : ''}
          </p>
        </div>
      )}

      {/* Prompt Section */}
      {prompt && (
        <div className="text-sm text-muted-foreground mt-2 max-h-80 overflow-auto border-t border-dashed border-gray-300 pt-2">
          <p className="font-semibold text-xs uppercase tracking-wide">AI prompt used:</p>
          <div className="mt-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
            <p className="whitespace-pre-wrap text-xs font-mono">{prompt}</p>
          </div>
          <div className="text-right mt-1">
            <button
              onClick={handleCopyPrompt}
              className="text-xs text-blue-600 hover:underline"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {actions && (
        <div className="flex space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
}
