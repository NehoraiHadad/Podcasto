import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Date utilities - use specific imports for client/server separation
// export * from './utils/date';  // Don't export all - forces explicit client/server usage

export * from './utils/format-utils';

/**
 * Combines multiple class names into a single string, merging Tailwind CSS classes properly
 * 
 * @param inputs Class names to combine
 * @returns A merged string of class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
