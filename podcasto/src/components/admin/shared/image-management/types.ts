/**
 * Shared types for image management operations across podcast and episode components
 */

export interface ImageState {
  current: string | null;
  preview: string | null;
  hasModifications: boolean;
}

export interface LoadingStates {
  isUploading: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  isDeleting?: boolean;
}

export interface UploadConfig {
  maxSize: number;
  acceptedTypes: string[];
  endpoint?: string;
}

export interface ImageActions {
  onUpload?: (file: File) => void | Promise<void>;
  onGenerate?: () => void | Promise<void>;
  onSave?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onDiscard?: () => void;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}
