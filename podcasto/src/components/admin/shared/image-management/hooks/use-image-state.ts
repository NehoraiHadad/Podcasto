'use client';

import { useState, useCallback } from 'react';

export interface UseImageStateReturn {
  currentImage: string | null;
  previewImage: string | null;
  hasPreview: boolean;
  setCurrentImage: (url: string | null) => void;
  setPreviewImage: (url: string | null) => void;
  clearPreview: () => void;
  promotePreviewToCurrent: () => void;
}

/**
 * Manages current and preview image states for image management operations
 * Provides utilities for switching between preview and current states
 */
export function useImageState(initialImage?: string | null): UseImageStateReturn {
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage || null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const hasPreview = previewImage !== null;

  const clearPreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const promotePreviewToCurrent = useCallback(() => {
    if (previewImage) {
      setCurrentImage(previewImage);
      setPreviewImage(null);
    }
  }, [previewImage]);

  return {
    currentImage,
    previewImage,
    hasPreview,
    setCurrentImage,
    setPreviewImage,
    clearPreview,
    promotePreviewToCurrent
  };
}
