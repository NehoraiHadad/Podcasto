/**
 * Date Utilities - Central Export
 *
 * IMPORTANT USAGE GUIDELINES:
 *
 * 1. SERVER-SIDE (Server Components, Server Actions, API Routes):
 *    - Import from './server'
 *    - All dates are handled in UTC
 *    - Example: import { nowUTC, createDateRangeUTC } from '@/lib/utils/date/server';
 *
 * 2. CLIENT-SIDE (Client Components with "use client"):
 *    - Import from './client'
 *    - Dates are formatted for user's timezone
 *    - Example: import { formatUserDate, getUserTimezone } from '@/lib/utils/date/client';
 *
 * 3. CONSTANTS:
 *    - Can be imported anywhere
 *    - Example: import { DATE_FORMATS, DEFAULT_TIMEZONE } from '@/lib/utils/date/constants';
 *
 * GOLDEN RULE: Store UTC, Display Local, Process UTC
 *
 * - Database: Always UTC (with timezone: true in schema)
 * - Server processing: Always UTC
 * - Client display: User's timezone
 * - User input: Convert to UTC before sending to server
 */

// Re-export constants (safe for both client and server)
export * from './constants';

// Server-side utilities (DO NOT import in client components)
export * from './server';

// Client-side utilities (use only in client components)
export * from './client';
