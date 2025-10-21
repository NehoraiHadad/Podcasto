/**
 * Generate a URL-friendly slug from a string
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens and alphanumeric
    .replace(/[^\w-]+/g, '')
    // Remove multiple consecutive hyphens
    .replace(/--+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length to 50 characters
    .substring(0, 50);
}

/**
 * Validate that a string is a valid slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50;
}

/**
 * Get a user-friendly error message for invalid slugs
 */
export function getSlugErrorMessage(slug: string): string | null {
  if (slug.length < 3) {
    return 'Technical name must be at least 3 characters';
  }
  if (slug.length > 50) {
    return 'Technical name must be at most 50 characters';
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return 'Technical name can only contain lowercase letters, numbers, and hyphens';
  }
  return null;
}
