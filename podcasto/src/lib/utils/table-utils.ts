/**
 * Table utility functions for formatting and data extraction
 * Used across admin table components
 */

/**
 * Format duration from seconds to mm:ss format
 */
export function formatDuration(durationInSeconds: number | null): string {
  if (!durationInSeconds) return 'Unknown';
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Extract error message from episode metadata JSON
 */
export function getErrorMessage(metadata: string | null): string | null {
  if (!metadata) return null;
  try {
    const meta = JSON.parse(metadata);
    return meta.error || null;
  } catch {
    return null;
  }
}
