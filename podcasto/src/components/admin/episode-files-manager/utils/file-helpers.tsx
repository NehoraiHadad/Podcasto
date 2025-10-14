import {
  File,
  FileText,
  FileAudio,
  Image as ImageIcon,
  FileJson
} from 'lucide-react';
import type { S3FileInfo } from '@/lib/services/s3-service-types';

/**
 * Get the appropriate icon component for a file type
 */
export function getFileIcon(type: S3FileInfo['type']) {
  switch (type) {
    case 'content':
      return <FileJson className="h-5 w-5 text-blue-500" />;
    case 'audio':
      return <FileAudio className="h-5 w-5 text-purple-500" />;
    case 'transcript':
      return <FileText className="h-5 w-5 text-green-500" />;
    case 'image':
      return <ImageIcon className="h-5 w-5 text-orange-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
}

/**
 * Get Tailwind CSS classes for badge color based on file type
 */
export function getTypeBadgeColor(type: S3FileInfo['type']) {
  switch (type) {
    case 'content':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'audio':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'transcript':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'image':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

/**
 * Format bytes to human-readable file size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
