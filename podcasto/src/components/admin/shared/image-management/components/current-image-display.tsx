'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface CurrentImageDisplayProps {
  /** Image URL to display */
  imageUrl: string;

  /** Alt text for the image */
  alt?: string;

  /** Label to show above the image */
  label?: string;

  /** Whether to show the remove button */
  showRemove?: boolean;

  /** Handler for remove button click */
  onRemove?: () => void;

  /** Whether to show a link to view full image */
  showViewLink?: boolean;

  /** Custom className for the container */
  className?: string;
}

/**
 * Displays the current saved image with optional remove button and view link
 * Used for showing the currently active image before any modifications
 *
 * @example
 * <CurrentImageDisplay
 *   imageUrl={currentImage}
 *   alt="Episode cover"
 *   label="Current Cover Image"
 *   showRemove
 *   onRemove={handleRemove}
 * />
 */
export function CurrentImageDisplay({
  imageUrl,
  alt = 'Current image',
  label = 'Current Cover Image',
  showRemove = false,
  onRemove,
  showViewLink = false,
  className = ''
}: CurrentImageDisplayProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with label and optional remove button */}
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {showRemove && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {/* Image Display */}
      <div className="relative w-full aspect-square max-w-xs rounded-lg overflow-hidden border">
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>

      {/* Optional View Link */}
      {showViewLink && (
        <div className="mt-2">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View Full Image
          </a>
        </div>
      )}
    </div>
  );
}
