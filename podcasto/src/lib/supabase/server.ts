/**
 * Supabase Server Client
 *
 * Legacy exports for backward compatibility.
 * New code should import from @/lib/auth instead.
 *
 * @deprecated Use @/lib/auth for new code
 */

// Expose the core Supabase helpers implemented in the auth session layer
export {
  getCachedServerClient,
  createServerClient,
  createServerClient as createClient,
} from '@/lib/auth/session/getters';

export { createSupabaseServerClient } from './server-client';
export { createSupabaseMiddlewareClient as createMiddlewareClient } from './middleware-client';
export { updateSession } from '@/lib/auth/session/middleware';
