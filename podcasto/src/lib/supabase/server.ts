/**
 * Supabase Server Client
 *
 * Legacy exports for backward compatibility.
 * New code should import from @/lib/auth instead.
 *
 * @deprecated Use @/lib/auth for new code
 */

// Re-export from new auth module for backward compatibility
export { createServerClient as createClient } from '@/lib/auth/server';
export { createMiddlewareClient, updateSession } from '@/lib/auth/server';
