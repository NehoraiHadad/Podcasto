/**
 * Centralized error handling utilities for server actions.
 * Provides consistent error formatting and response creation.
 */

import type { ActionError, ActionResult } from './types';

/**
 * Convert unknown error to ActionError format
 */
export function handleActionError(error: unknown): ActionError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR'
  };
}

/**
 * Create a success result with data
 */
export function successResult<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * Create an error result with message
 */
export function errorResult(
  message: string,
  errors?: ActionError[]
): ActionResult<never> {
  return { success: false, error: message, errors };
}

/**
 * Wrap async action execution with error handling
 */
export async function executeAction<T>(
  action: () => Promise<T>,
  errorMessage?: string
): Promise<ActionResult<T>> {
  try {
    const data = await action();
    return successResult(data);
  } catch (error) {
    const actionError = handleActionError(error);
    return errorResult(
      errorMessage || actionError.message,
      [actionError]
    );
  }
}
