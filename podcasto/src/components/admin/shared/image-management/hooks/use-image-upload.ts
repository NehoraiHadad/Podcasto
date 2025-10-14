'use client';

import { useState, useCallback } from 'react';
import { validateImageFile } from '../utils/file-validation';
import { imageToasts } from '../utils/toast-messages';

export interface UseImageUploadReturn {
  selectedFile: File | null;
  filePreview: string | null;
  selectFile: (file: File | null) => void;
  validateAndSelectFile: (file: File) => boolean;
  clearFile: () => void;
  convertToBase64: (file: File) => Promise<string>;
}

/**
 * Manages file selection, validation, and base64 conversion for image uploads
 */
export function useImageUpload(): UseImageUploadReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const selectFile = useCallback((file: File | null) => {
    // Clean up previous preview
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }

    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    setSelectedFile(file);

    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
    }
  }, [filePreview]);

  const validateAndSelectFile = useCallback((file: File): boolean => {
    const validation = validateImageFile(file);

    if (!validation.valid) {
      imageToasts.error(validation.error!);
      return false;
    }

    selectFile(file);
    return true;
  }, [selectFile]);

  const clearFile = useCallback(() => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
  }, [filePreview]);

  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  return {
    selectedFile,
    filePreview,
    selectFile,
    validateAndSelectFile,
    clearFile,
    convertToBase64
  };
}
