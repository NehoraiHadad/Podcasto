/**
 * Date and Time Constants
 * Central location for all date/time related constants
 */

/**
 * Default timezone for the application
 * This is used as a fallback when user timezone is not available
 */
export const DEFAULT_TIMEZONE = 'Asia/Jerusalem';

/**
 * Standard date formats used throughout the application
 */
export const DATE_FORMATS = {
  // Display formats (for UI)
  DISPLAY_DATE: 'dd/MM/yyyy',
  DISPLAY_DATE_LONG: 'dd MMMM yyyy',
  DISPLAY_DATETIME: 'dd/MM/yyyy HH:mm',
  DISPLAY_TIME: 'HH:mm',

  // ISO formats (for API/Database)
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss'Z'",

  // Relative time
  RELATIVE: 'relative', // Special marker for relative time formatting
} as const;

/**
 * Supported locales for date formatting
 */
export const SUPPORTED_LOCALES = {
  ENGLISH: 'en-US',
  HEBREW: 'he-IL',
} as const;

/**
 * Common timezone identifiers
 */
export const TIMEZONES = {
  UTC: 'UTC',
  JERUSALEM: 'Asia/Jerusalem',
  NEW_YORK: 'America/New_York',
  LONDON: 'Europe/London',
} as const;
