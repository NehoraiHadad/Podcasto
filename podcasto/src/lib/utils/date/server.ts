/**
 * Server-side Date Utilities
 * All functions here work with UTC exclusively
 * Use these in Server Components, Server Actions, and API Routes
 */

import { formatInTimeZone, toDate } from 'date-fns-tz';
import { format, parseISO, startOfDay as startOfDayFns, endOfDay as endOfDayFns } from 'date-fns';

/**
 * Get current date/time in UTC
 * ALWAYS use this instead of new Date() on the server
 */
export function nowUTC(): Date {
  return new Date();
}

/**
 * Convert a date to UTC ISO string
 * Format: "2024-01-15T14:30:00.000Z"
 */
export function toISOUTC(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d.toISOString();
}

/**
 * Parse ISO string to Date object
 * Assumes input is in UTC
 */
export function parseISOUTC(isoString: string): Date {
  return parseISO(isoString);
}

/**
 * Get start of day in a specific timezone, converted to UTC
 * This is critical for correct date range queries
 *
 * Example:
 * User in Israel selects "2024-01-15"
 * startOfDayInTimezone('2024-01-15', 'Asia/Jerusalem')
 * → 2024-01-14T22:00:00.000Z (which is 00:00 in Israel)
 */
export function startOfDayInTimezone(date: Date | string, timezone: string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;

  // Get the date string in the target timezone
  const dateStr = formatInTimeZone(d, timezone, 'yyyy-MM-dd');

  // Create start of day in that timezone
  const localStart = toDate(`${dateStr}T00:00:00`, { timeZone: timezone });

  return localStart;
}

/**
 * Get end of day in a specific timezone, converted to UTC
 *
 * Example:
 * User in Israel selects "2024-01-15"
 * endOfDayInTimezone('2024-01-15', 'Asia/Jerusalem')
 * → 2024-01-15T21:59:59.999Z (which is 23:59:59.999 in Israel)
 */
export function endOfDayInTimezone(date: Date | string, timezone: string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;

  // Get the date string in the target timezone
  const dateStr = formatInTimeZone(d, timezone, 'yyyy-MM-dd');

  // Create end of day in that timezone
  const localEnd = toDate(`${dateStr}T23:59:59.999`, { timeZone: timezone });

  return localEnd;
}

/**
 * Get start of day in UTC (midnight UTC)
 */
export function startOfDayUTC(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfDayFns(d);
}

/**
 * Get end of day in UTC (23:59:59.999 UTC)
 */
export function endOfDayUTC(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfDayFns(d);
}

/**
 * Format a date in a specific timezone (server-side)
 * Returns formatted string
 */
export function formatInTimezoneServer(
  date: Date | string,
  timezone: string,
  formatStr: string = 'yyyy-MM-dd'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, timezone, formatStr);
}

/**
 * Ensure a date is valid, throw error if not
 */
export function ensureValidDate(date: Date | string, fieldName = 'date'): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isNaN(d.getTime())) {
    throw new Error(`Invalid ${fieldName}: ${date}`);
  }

  return d;
}

/**
 * Create a date range for database queries
 * Converts user-selected dates (in their timezone) to UTC range
 *
 * Example usage in Server Action:
 * const { startUTC, endUTC } = createDateRangeUTC(
 *   userStartDate,
 *   userEndDate,
 *   userTimezone
 * );
 *
 * // Use in query:
 * .gte('created_at', startUTC.toISOString())
 * .lte('created_at', endUTC.toISOString())
 */
export function createDateRangeUTC(
  startDate: Date | string,
  endDate: Date | string,
  timezone: string
): { startUTC: Date; endUTC: Date } {
  return {
    startUTC: startOfDayInTimezone(startDate, timezone),
    endUTC: endOfDayInTimezone(endDate, timezone),
  };
}

/**
 * Calculate days between two dates
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const startD = typeof start === 'string' ? parseISO(start) : start;
  const endD = typeof end === 'string' ? parseISO(end) : end;

  const diffMs = endD.getTime() - startD.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
