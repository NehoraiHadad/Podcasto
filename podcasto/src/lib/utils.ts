import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export * from './utils/date-utils';
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
