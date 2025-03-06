import { createServerClient } from '@supabase/ssr';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { Database } from '@/lib/supabase/types';
import { NextResponse } from 'next/server';
import { RequestCookies } from 'next/dist/server/web/spec-extension/cookies';

/**
 * Creates a Supabase client for use in Server Components
 * This should only be used in Server Components, API routes, or Server Actions
 */
export async function createClient() {
  // Dynamic import to avoid issues with Next.js middleware
  const { cookies } = await import('next/headers');
  
  // Get the cookie store - cookies() is async in Next.js 15
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

/**
 * Creates a Supabase client for use with cookies from a request
 * This is useful for middleware and other contexts where cookies() is not available
 * @param cookieStore The cookie store from the request
 * @param response Optional NextResponse object for middleware contexts
 */
export function createClientWithCookies(
  cookieStore: ReadonlyRequestCookies | RequestCookies,
  response?: NextResponse
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set cookie on the store
            cookieStore.set({ name, value, ...options });
            
            // If we have a response (middleware context), also set cookie there
            if (response) {
              response.cookies.set({ name, value, ...options });
            }
          });
        }
      },
    }
  );
} 