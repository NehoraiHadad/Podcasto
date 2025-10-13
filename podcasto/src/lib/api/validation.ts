import { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Successful validation result with parsed data
 */
interface ValidationSuccess<T> {
  success: true;
  data: T;
}

/**
 * Failed validation result with error message
 */
interface ValidationError {
  success: false;
  error: string;
}

/**
 * Result of validation operation
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

/**
 * Parse and validate JSON request body with optional Zod schema
 *
 * @param request - Next.js request object
 * @param schema - Optional Zod schema for validation
 * @returns Promise with validation result containing parsed data or error
 */
export async function validateJsonBody<T = unknown>(
  request: NextRequest,
  schema?: z.ZodType<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    if (!schema) return { success: true, data: body as T };

    const parseResult = schema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return { success: false, error: `Validation failed: ${errorMessage}` };
    }

    return { success: true, data: parseResult.data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON in request body' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse request body',
    };
  }
}

/**
 * Parse and validate URL search parameters with Zod schema
 *
 * @param request - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Validation result with parsed parameters or error
 */
export function validateSearchParams<T>(
  request: NextRequest,
  schema: z.ZodType<T>
): ValidationResult<T> {
  try {
    const params: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const parseResult = schema.safeParse(params);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return { success: false, error: `Invalid query parameters: ${errorMessage}` };
    }

    return { success: true, data: parseResult.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse query parameters',
    };
  }
}

/**
 * Validate required environment variables are present
 *
 * @param varNames - Array of environment variable names to check
 * @returns Validation result with env var values or error if any missing
 */
export function validateEnvVars(varNames: string[]): ValidationResult<Record<string, string>> {
  const missing: string[] = [];
  const values: Record<string, string> = {};

  for (const varName of varNames) {
    const value = process.env[varName];
    if (!value) missing.push(varName);
    else values[varName] = value;
  }

  if (missing.length > 0) {
    return { success: false, error: `Missing required environment variables: ${missing.join(', ')}` };
  }

  return { success: true, data: values };
}
