import { nowUTC, toISOUTC } from '@/lib/utils/date/server';

/**
 * Structured logging utility to replace console.log across the application
 * Provides consistent logging format with context and log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Check if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Format a log message with context
 */
function formatLogMessage(
  level: LogLevel,
  context: string,
  message: string,
  data?: LogContext
): string {
  const timestamp = toISOUTC(nowUTC());
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
  const dataString = data ? ` ${JSON.stringify(data)}` : '';
  return `${prefix} ${message}${dataString}`;
}

/**
 * Log a debug message (only in development)
 */
export function logDebug(
  context: string,
  message: string,
  data?: LogContext
): void {
  if (isDevelopment) {
    console.log(formatLogMessage('debug', context, message, data));
  }
}

/**
 * Log an info message
 */
export function logInfo(
  context: string,
  message: string,
  data?: LogContext
): void {
  console.log(formatLogMessage('info', context, message, data));
}

/**
 * Log a warning message
 */
export function logWarn(
  context: string,
  message: string,
  data?: LogContext
): void {
  console.warn(formatLogMessage('warn', context, message, data));
}

/**
 * Log an error message
 */
export function logError(
  context: string,
  message: string,
  error?: unknown,
  data?: LogContext
): void {
  const errorData = error instanceof Error ? { error: error.message } : {};
  const combinedData = { ...errorData, ...data };

  console.error(formatLogMessage('error', context, message, combinedData));

  // In development, also log the full error for debugging
  if (isDevelopment && error) {
    console.error('Full error:', error);
  }
}

/**
 * Create a scoped logger for a specific context
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, data?: LogContext) =>
      logDebug(context, message, data),
    info: (message: string, data?: LogContext) =>
      logInfo(context, message, data),
    warn: (message: string, data?: LogContext) =>
      logWarn(context, message, data),
    error: (message: string, error?: unknown, data?: LogContext) =>
      logError(context, message, error, data),
  };
}
