/**
 * Supabase Server Client
 *
 * Legacy exports for backward compatibility.
 * New code should import from @/lib/auth instead.
 *
 * @deprecated Use @/lib/auth for new code
 */

import { unstable_noStore as noStore } from 'next/cache';

// Re-export from new auth module for backward compatibility
export { createServerClient as createClient } from '@/lib/auth/session/getters';
export { createMiddlewareClient, updateSession } from '@/lib/auth/session/middleware';

/**
 * Legacy createClient wrapper that includes noStore()
 *
 * @deprecated Import createServerClient from @/lib/auth instead
 */
export async function createClientWithNoStore() {
  noStore();
  const { createServerClient } = await import('@/lib/auth/session/getters');
  return createServerClient();
}
