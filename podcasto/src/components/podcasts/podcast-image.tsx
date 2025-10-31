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
 * Images are served through proxy endpoints to hide infrastructure URLs.
 *
 * Architecture:
 * - Images come pre-transformed from database API layer with proxy URLs
 * - Format: /api/images/episodes/[id] or /api/images/podcasts/[id]
 * - No URL transformation needed in this component
 *
 * Features:
 * - Clean proxy URLs (infrastructure hidden)
 * - Automatic fallback on error
 * - Next.js Image optimization (if configured)
 */
export function PodcastImage({
  imageUrl,
  title,
  className = '',
  priority = false,
}: PodcastImageProps) {
  const [hasError, setHasError] = useState(false);

  // Show fallback if no URL or error occurred
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
      sizes="(max-width: 768px) 100vw, 50vw"
      priority={priority}
      className={`object-cover ${className}`}
      onError={() => setHasError(true)}
      unoptimized  // Use unoptimized mode since we're serving through proxy
    />
  );
} 