'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PodcastImageProps {
  imageUrl?: string | null;
  title: string;
  className?: string;
  priority?: boolean;
}

export function PodcastImage({ imageUrl, title, className = '', priority = false }: PodcastImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <svg
          className="w-12 h-12 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clipRule="evenodd"
          ></path>
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
    />
  );
} 