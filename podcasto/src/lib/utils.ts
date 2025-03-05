import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export * from './utils/date-utils';
export * from './utils/format-utils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
