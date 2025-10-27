'use server';

/**
 * Session Getters
 *
 * Functions for retrieving session and user information.
 * CRITICAL: Always use getUser() for server-side validation, not getSession().
 *
 * Following 2025 Supabase SSR best practices:
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient as createSupabaseClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { User, Session, AuthState } from './types';

/**
 * Cached Supabase server client creator (SSR-compatible)
 *
 * Uses React's cache() to ensure a single Supabase client instance is reused
 * per request, preventing duplicate instantiations while maintaining cookie
 * awareness. The cookies store is captured on first invocation.
 */
export const getCachedServerClient = cache(async (): Promise<SupabaseClient<Database>> => {
  const cookieStore = cookies();

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(
                '[SessionGetters] Unable to set auth cookies in server component context:',
                error
              );
            }
            // Server Component - can't set cookies
            // This is expected and handled by middleware
          }
        },
      },
    }
  );
});

/**
 * Create Supabase server client (SSR-compatible)
 *
 * This helper returns the cached Supabase client instance for the current
 * request. See getCachedServerClient() for implementation details.
 *
 * @returns Configured Supabase client for server use
 */
export async function createServerClient(): Promise<SupabaseClient<Database>> {
  return getCachedServerClient();
}

/**
 * Get authenticated user (✅ ALWAYS use this in server code)
 *
 * CRITICAL SECURITY: This validates the JWT token with Supabase Auth server.
 * Never use getSession() for authentication checks in server code!
 *
 * This method is cached per request to avoid multiple database calls.
 *
 * @returns The authenticated user or null if not authenticated
 *
 * @example
 * ```typescript
 * const user = await getUser();
 * if (user) {
 *   console.log(`Authenticated as ${user.email}`);
 * }
 * ```
 */
export const getUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createServerClient();

    // ✅ CORRECT: Use getUser() - validates JWT token server-side
    // ❌ WRONG: getSession() only reads from storage, doesn't validate
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Only log unexpected errors, not "no session" errors
      if (!error.message.includes('Auth session missing')) {
        console.error('[SessionGetters] Error getting user:', error.message);
      }
      return null;
    }

    return user;
  } catch (error) {
    console.error('[SessionGetters] Unexpected error in getUser:', error);
    return null;
  }
});

/**
 * Get session (⚠️ USE WITH CAUTION - not validated)
 *
 * WARNING: This returns the session from storage without server-side validation.
 * For authentication checks in server code, ALWAYS use getUser() instead.
 *
 * Only use this when you need session metadata (like expiry time) and have
 * already validated the user with getUser().
 *
 * @returns The current session or null if not authenticated
 *
 * @example
 * ```typescript
 * // ✅ CORRECT: Use after getUser() for metadata only
 * const user = await getUser();
 * if (user) {
 *   const session = await getSession();
 *   console.log(`Session expires at ${session?.expires_at}`);
 * }
 *
 * // ❌ WRONG: Don't use for authentication checks
 * const session = await getSession();
 * if (session) { // INSECURE!
 *   // Grant access
 * }
 * ```
 */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await createServerClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('[SessionGetters] Error getting session:', error.message);
      return null;
    }

    // Log warning in development to catch misuse
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[SessionGetters] getSession() called - ensure you are using getUser() for auth checks'
      );
    }

    return session;
  } catch (error) {
    console.error('[SessionGetters] Unexpected error in getSession:', error);
    return null;
  }
}

/**
 * Get the complete authentication state
 *
 * Returns both user and session information along with authentication status.
 * Uses getUser() for validation, ensuring the session is valid.
 *
 * @returns AuthState object containing user, session, and authentication status
 *
 * @example
 * ```typescript
 * const authState = await getAuthState();
 * if (authState.isAuthenticated) {
 *   console.log(`User: ${authState.user?.email}`);
 * }
 * ```
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    const supabase = await createServerClient();

    // ✅ Use getUser() for validation
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        user: null,
        session: null,
        isAuthenticated: false,
      };
    }

    // Get session for additional metadata (safe because user is validated)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      user,
      session,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('[SessionGetters] Unexpected error in getAuthState:', error);
    return {
      user: null,
      session: null,
      isAuthenticated: false,
    };
  }
  }
}
