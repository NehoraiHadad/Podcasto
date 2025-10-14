/**
 * File validation utilities for image upload operations
 */

import { IMAGE_VALIDATION } from '../constants';
import type { FileValidationResult } from '../types';

/**
 * Validates an image file for type and size constraints
 *
 * @param file - The file to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateImageFile(file: File): FileValidationResult {
  // Check file type
  if (!file.type.startsWith(IMAGE_VALIDATION.ACCEPTED_MIME_PREFIX)) {
    return {
      valid: false,
      error: 'Please upload an image file'
    };
  }

  // Check file size
  if (file.size > IMAGE_VALIDATION.MAX_SIZE) {
    return {
      valid: false,
      error: `Image must be smaller than ${IMAGE_VALIDATION.MAX_SIZE_MB}MB`
    };
  }

  return { valid: true };
}

/**
 * Validates an image file with custom size limit
 *
 * @param file - The file to validate
 * @param maxSizeBytes - Maximum file size in bytes
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateImageFileWithSize(
  file: File,
  maxSizeBytes: number
): FileValidationResult {
  // Check file type
  if (!file.type.startsWith(IMAGE_VALIDATION.ACCEPTED_MIME_PREFIX)) {
    return {
      valid: false,
      error: 'Please upload an image file'
    };
  }

  // Check file size
  if (file.size > maxSizeBytes) {
    const sizeMB = (maxSizeBytes / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `Image must be smaller than ${sizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Formats file size in human-readable format
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "156 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}

/**
 * Checks if a file is an accepted image type
 *
 * @param file - The file to check
 * @returns True if file is an accepted image type
 */
export function isAcceptedImageType(file: File): boolean {
  return file.type.startsWith(IMAGE_VALIDATION.ACCEPTED_MIME_PREFIX);
}

/**
 * Gets a human-readable string of accepted formats
 *
 * @returns String like "JPG, PNG, WebP"
 */
export function getAcceptedFormatsString(): string {
  return IMAGE_VALIDATION.ACCEPTED_TYPES
    .map(type => type.split('/')[1].toUpperCase())
    .join(', ');
}
