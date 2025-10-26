/**
 * SQL Result Handler Utility
 *
 * Provides utilities for handling results from Drizzle's db.execute() which
 * can return results in different formats (direct array or object with rows property).
 *
 * This utility centralizes the result extraction logic to avoid code duplication
 * across the codebase.
 */

/**
 * Extract rows from Drizzle db.execute() result
 *
 * Drizzle's db.execute() can return results in two formats:
 * 1. Direct array of rows: [row1, row2, ...]
 * 2. Object with rows property: { rows: [row1, row2, ...] }
 *
 * This function handles both formats and returns a typed array of rows.
 *
 * @param result - The result from db.execute()
 * @param context - Optional context string for logging (e.g., 'ProblematicPodcasts')
 * @returns Typed array of rows
 *
 * @example
 * ```typescript
 * const result = await db.execute(sql`SELECT * FROM users`);
 * const users = extractRowsFromSqlResult<User>(result, 'UserQuery');
 * ```
 */
export function extractRowsFromSqlResult<T>(
  result: unknown,
  context: string = 'SQL'
): T[] {
  // Handle direct array of rows
  if (Array.isArray(result)) {
    return result as unknown as T[];
  }

  // Handle object with rows property
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown }).rows;
    if (Array.isArray(rows)) {
      return rows as T[];
    }
  }

  // Unexpected format - log error and return empty array
  console.error(`[${context}] Unexpected SQL result format:`, result);
  return [];
}
