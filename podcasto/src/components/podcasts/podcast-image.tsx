'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PodcastImageProps {
  imageUrl?: string | null;
  title: string;
  className?: string;
  priority?: boolean;
}

/**
 * Podcast Image Component
 *
 * Displays podcast cover images with automatic fallback handling.
 * Uses Next.js Image component with optimized settings from next.config.ts.
 *
 * The actual optimization happens through:
 * - minimumCacheTTL: 31 days (reduces transformations by 80-90%)
 * - formats: WebP only (reduces transformations by 50%)
 * - Optimized deviceSizes and imageSizes in next.config.ts
 */
export function PodcastImage({
  imageUrl,
  title,
  className = '',
  priority = false,
}: PodcastImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <svg
          className="w-12 h-12 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={title}
      fill
      // The sizes prop helps the browser select the right image size
      // This should match the actual rendered size of the image
      sizes="(max-width: 768px) 100vw, 50vw"
      priority={priority}
      className={`object-cover ${className}`}
      onError={() => setHasError(true)}
      // Lazy loading is automatic when priority=false
      // quality defaults to 75 from next.config.ts
    />
  );
} 