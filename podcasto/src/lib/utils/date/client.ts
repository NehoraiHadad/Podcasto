/**
 * Client-side Date Utilities
 * Use these in Client Components (with "use client")
 * These functions handle user timezone and formatting for display
 */

'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { DATE_FORMATS, DEFAULT_TIMEZONE, SUPPORTED_LOCALES } from './constants';

/**
 * Get user's browser timezone
 * Falls back to DEFAULT_TIMEZONE if unable to detect
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Get user's browser locale
 * Falls back to English if unable to detect
 */
export function getUserLocale(): string {
  try {
    return navigator.language || SUPPORTED_LOCALES.ENGLISH;
  } catch {
    return SUPPORTED_LOCALES.ENGLISH;
  }
}

/**
 * Get date-fns locale object based on locale string
 */
function getDateFnsLocale(locale?: string) {
  const localeStr = locale || getUserLocale();

  if (localeStr.startsWith('he')) {
    return he;
  }

  return enUS;
}

function toTimezoneDateValue(date: Date, timezone: string): Date {
  const isoString = formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return parseISO(isoString);
}

/**
 * Format a date for display in user's timezone
 *
 * @param date - UTC date from database
 * @param formatStr - Format string (use DATE_FORMATS constants)
 * @param timezone - Override timezone (default: user's browser timezone)
 * @param locale - Override locale (default: user's browser locale)
 */
export function formatUserDate(
  date: Date | string | null | undefined,
  formatStr: string = DATE_FORMATS.DISPLAY_DATE,
  timezone?: string,
  locale?: string
): string {
  if (!date) return '';

  try {
    const d = typeof date === 'string' ? parseISO(date) : date;

    // Check if date is valid
    if (isNaN(d.getTime())) {
      return '';
    }

    const tz = timezone || getUserTimezone();
    const dateFnsLocale = getDateFnsLocale(locale);

    // Handle relative time format
    if (formatStr === DATE_FORMATS.RELATIVE) {
      return formatDistanceToNow(d, { addSuffix: true, locale: dateFnsLocale });
    }

    // Format in user's timezone
    return formatInTimeZone(d, tz, formatStr, { locale: dateFnsLocale });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format a date range for display
 *
 * Example: "01/01/2024 - 15/01/2024"
 */
export function formatDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  formatStr: string = DATE_FORMATS.DISPLAY_DATE,
  timezone?: string
): string {
  if (!startDate || !endDate) return '';

  const start = formatUserDate(startDate, formatStr, timezone);
  const end = formatUserDate(endDate, formatStr, timezone);

  if (!start || !end) return '';

  return `${start} - ${end}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "yesterday")
 *
 * @param date - UTC date from database
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  return formatUserDate(date, DATE_FORMATS.RELATIVE);
}

/**
 * Convert a user's local date input to UTC Date object
 * Used when user selects a date in a form
 *
 * Example:
 * User in Israel selects "15/01/2024" in a date picker
 * toUTCDate('2024-01-15', 'Asia/Jerusalem')
 * → Date object representing 2024-01-14T22:00:00.000Z
 */
export function toUTCDate(dateString: string, timezone?: string): Date {
  const tz = timezone || getUserTimezone();

  // Parse the date string as a date in the user's timezone
  const localDate = toDate(dateString, { timeZone: tz });

  return localDate;
}

/**
 * Get current date/time in user's timezone
 */
export function nowInUserTimezone(timezone?: string): Date {
  const tz = timezone || getUserTimezone();
  return toTimezoneDateValue(new Date(), tz);
}

/**
 * Check if a date is today (in user's timezone)
 */
export function isToday(date: Date | string, timezone?: string): boolean {
  if (!date) return false;

  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const tz = timezone || getUserTimezone();

    const today = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
    const dateStr = formatInTimeZone(d, tz, 'yyyy-MM-dd');

    return today === dateStr;
  } catch {
    return false;
  }
}

/**
 * Check if a date is in the past (in user's timezone)
 */
export function isPast(date: Date | string, timezone?: string): boolean {
  if (!date) return false;

  try {
    const tz = timezone || getUserTimezone();
    const target = typeof date === 'string' ? parseISO(date) : date;
    const targetInTz = toTimezoneDateValue(target, tz);
    const nowInTz = nowInUserTimezone(tz);

    return targetInTz < nowInTz;
  } catch {
    return false;
  }
}

/**
 * Check if a date is in the future (in user's timezone)
 */
export function isFuture(date: Date | string, timezone?: string): boolean {
  if (!date) return false;

  try {
    const tz = timezone || getUserTimezone();
    const target = typeof date === 'string' ? parseISO(date) : date;
    const targetInTz = toTimezoneDateValue(target, tz);
    const nowInTz = nowInUserTimezone(tz);

    return targetInTz > nowInTz;
  } catch {
    return false;
  }
}

/**
 * Format duration in milliseconds to human-readable string
 *
 * Example: 125000 → "2 minutes 5 seconds"
 */
export function formatDuration(durationMs: number, _locale?: string): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor(durationMs / (1000 * 60 * 60));

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (seconds > 0 && hours === 0) {
    // Only show seconds if less than an hour
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(' ') || '0 seconds';
}
