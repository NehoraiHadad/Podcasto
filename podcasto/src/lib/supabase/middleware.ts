import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';
import { createServerSupabaseClient } from './server';

/**
 * Creates a Supabase client specifically for middleware context
 * 
 * @param request The Next.js request object
 * @param response The Next.js response object
 * @returns A Supabase client configured for middleware usage
 */
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, ...options }) => {
            // Set the cookie on the response
            response.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );
}

/**
 * Middleware function to handle Supabase authentication
 * This updates the session and refreshes the auth token if needed
 * 
 * @param request The Next.js request object
 * @returns A response with updated cookies
 */
export async function updateSession(request: NextRequest) {
  // Create a response object that we can modify
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client using the request cookies
  const supabase = createMiddlewareClient(request, response);

  // Refresh the session - this will set new cookies on the response if the session was expired
  // Always use getUser() for security - this authenticates against the Supabase Auth server
  await supabase.auth.getUser();

  return response;
} 