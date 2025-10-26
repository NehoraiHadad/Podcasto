/**
 * Stats Calculator Utility
 *
 * Provides reusable functions for calculating statistics on episode generation attempts.
 * Centralizes the calculation logic to avoid code duplication across report actions.
 */

/**
 * Statistics object returned by calculation functions
 */
export interface AttemptStats {
  /** Total number of attempts */
  total: number;
  /** Number of successful attempts */
  successful: number;
  /** Number of failed attempts */
  failed: number;
  /** Success rate as percentage (0-100, rounded to 2 decimal places) */
  successRate: number;
}

/**
 * Calculate statistics from an array of attempts
 *
 * Takes an array of objects with a status field and calculates
 * total, successful, failed counts and success rate.
 *
 * @param attempts - Array of objects with status property
 * @param successStatus - The status value that indicates success (default: 'success')
 * @returns Statistics object
 *
 * @example
 * ```typescript
 * const attempts = [
 *   { status: 'success' },
 *   { status: 'failed' },
 *   { status: 'success' }
 * ];
 * const stats = calculateAttemptStats(attempts);
 * // Returns: { total: 3, successful: 2, failed: 1, successRate: 66.67 }
 * ```
 */
export function calculateAttemptStats(
  attempts: Array<{ status: string }>,
  successStatus: string = 'success'
): AttemptStats {
  const total = attempts.length;
  const successful = attempts.filter(a => a.status === successStatus).length;
  const failed = total - successful;

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? Math.round((successful / total) * 10000) / 100 : 0,
  };
}

/**
 * Calculate statistics from aggregated data
 *
 * Takes an array of pre-aggregated data (status + count) and calculates
 * total, successful, failed counts and success rate.
 *
 * This is useful when working with data that's already been grouped
 * by status (e.g., from a GROUP BY query).
 *
 * @param data - Array of objects with status and count properties
 * @param successStatus - The status value that indicates success (default: 'success')
 * @returns Statistics object
 *
 * @example
 * ```typescript
 * const data = [
 *   { status: 'success', count: 10 },
 *   { status: 'failed', count: 3 },
 *   { status: 'failed_no_messages', count: 2 }
 * ];
 * const stats = aggregateStats(data);
 * // Returns: { total: 15, successful: 10, failed: 5, successRate: 66.67 }
 * ```
 */
export function aggregateStats(
  data: Array<{ status: string; count: number }>,
  successStatus: string = 'success'
): AttemptStats {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const successful = data
    .filter(item => item.status === successStatus)
    .reduce((sum, item) => sum + item.count, 0);
  const failed = total - successful;

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? Math.round((successful / total) * 10000) / 100 : 0,
  };
}

/**
 * Aggregate data by status
 *
 * Converts an array of items with status and count into a Record mapping
 * status to total count for that status.
 *
 * @param data - Array of objects with status and count properties
 * @returns Record mapping status strings to their total counts
 *
 * @example
 * ```typescript
 * const data = [
 *   { status: 'success', count: 10, trigger_source: 'cron' },
 *   { status: 'success', count: 5, trigger_source: 'manual' },
 *   { status: 'failed', count: 3, trigger_source: 'cron' }
 * ];
 * const byStatus = aggregateByStatus(data);
 * // Returns: { success: 15, failed: 3 }
 * ```
 */
export function aggregateByStatus(
  data: Array<{ status: string; count: number }>
): Record<string, number> {
  return data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + item.count;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Aggregate data by field
 *
 * Generic function to aggregate data by any field (e.g., trigger_source, status).
 * Converts an array of items into a Record mapping field values to their total counts.
 *
 * @param data - Array of objects with count property
 * @param field - The field to aggregate by
 * @returns Record mapping field values to their total counts
 *
 * @example
 * ```typescript
 * const data = [
 *   { status: 'success', trigger_source: 'cron', count: 10 },
 *   { status: 'success', trigger_source: 'manual', count: 5 },
 *   { status: 'failed', trigger_source: 'cron', count: 3 }
 * ];
 * const bySource = aggregateByField(data, 'trigger_source');
 * // Returns: { cron: 13, manual: 5 }
 * ```
 */
export function aggregateByField<T extends Record<string, unknown>>(
  data: Array<T & { count: number }>,
  field: keyof T
): Record<string, number> {
  return data.reduce((acc, item) => {
    const key = String(item[field]);
    acc[key] = (acc[key] || 0) + item.count;
    return acc;
  }, {} as Record<string, number>);
}
