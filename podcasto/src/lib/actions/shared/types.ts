/**
 * Shared types for server actions across the application.
 * These types provide a consistent interface for all action results.
 */

/**
 * Standard error object for action failures
 */
export interface ActionError {
  message: string;
  field?: string;
  code?: string;
}

/**
 * Generic result type for all server actions.
 * Follows the RORO pattern (Receive an Object, Return an Object).
 *
 * @template T - The type of data returned on success
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: ActionError[] };

/**
 * Simplified result type for actions that don't return data
 */
export type SimpleActionResult = ActionResult<void>;
