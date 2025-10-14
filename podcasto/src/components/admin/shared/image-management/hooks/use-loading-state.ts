'use client';

import { useState } from 'react';

export interface UseLoadingStateReturn {
  isUploading: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  setIsUploading: (loading: boolean) => void;
  setIsGenerating: (loading: boolean) => void;
  setIsSaving: (loading: boolean) => void;
  setIsDeleting: (loading: boolean) => void;
  isAnyLoading: boolean;
  resetAll: () => void;
}

/**
 * Manages loading states for image management operations
 * Provides individual flags and a combined isAnyLoading flag
 */
export function useLoadingState(): UseLoadingStateReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAnyLoading = isUploading || isGenerating || isSaving || isDeleting;

  const resetAll = () => {
    setIsUploading(false);
    setIsGenerating(false);
    setIsSaving(false);
    setIsDeleting(false);
  };

  return {
    isUploading,
    isGenerating,
    isSaving,
    isDeleting,
    setIsUploading,
    setIsGenerating,
    setIsSaving,
    setIsDeleting,
    isAnyLoading,
    resetAll
  };
}
