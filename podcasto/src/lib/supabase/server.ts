import { createServerClient } from '@supabase/ssr';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { Database } from '@/lib/supabase/types';
import { NextResponse } from 'next/server';
import { RequestCookies } from 'next/dist/server/web/spec-extension/cookies';

/**
 * Creates a Supabase client for server-side usage with flexible cookie handling
 * This unified function replaces the previous separate client creation functions
 * 
 * @param options Configuration options for the client
 * @returns A Supabase client configured for server usage
 */
export async function createServerSupabaseClient(options?: {
  cookieStore?: ReadonlyRequestCookies | RequestCookies;
  response?: NextResponse;
  useNextCookies?: boolean;
}) {
  // If no cookie store is provided and useNextCookies is true, use Next.js cookies
  if (!options?.cookieStore && (options?.useNextCookies !== false)) {
    // Dynamic import to avoid issues with Next.js middleware
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            try {
              return cookieStore.getAll();
            } catch (error) {
              console.error('Error getting cookies:', error);
              return [];
            }
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => 
                cookieStore.set({ name, value, ...options })
              );
            } catch (error) {
              console.error('Error setting cookies:', error);
            }
          }
        },
      }
    );
  }
  
  // If a cookie store is provided, use it
  if (options?.cookieStore) {
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return options.cookieStore!.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
              // Set cookie on the store
              options.cookieStore!.set({ name, value, ...cookieOptions });
              
              // If we have a response (middleware context), also set cookie there
              if (options.response) {
                options.response.cookies.set({ name, value, ...cookieOptions });
              }
            });
          }
        },
      }
    );
  }
  
  // Fallback to a client with no cookie handling
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

// Legacy functions for backward compatibility
// These will help with the transition to the new unified function

/**
 * @deprecated Use createServerSupabaseClient() instead
 */
export async function createClient() {
  return createServerSupabaseClient({ useNextCookies: true });
}

/**
 * @deprecated Use createServerSupabaseClient() instead
 */
export async function createActionClient() {
  return createServerSupabaseClient({ useNextCookies: true });
}

/**
 * @deprecated Use createServerSupabaseClient() instead
 */
export function createClientWithCookies(
  cookieStore: ReadonlyRequestCookies | RequestCookies,
  response?: NextResponse
) {
  return createServerSupabaseClient({ cookieStore, response });
} 