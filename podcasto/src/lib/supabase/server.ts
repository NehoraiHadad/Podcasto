import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';
import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a Supabase client for server-side usage
 * Following the official Supabase documentation for Next.js App Router
 * 
 * @returns A Supabase client configured for server usage
 */
export async function createClient() {
  // Opt out of caching for all data requests to Supabase
  noStore();

  const cookieStore = await cookies();

  return createServerClient<Database>(
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
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client for middleware usage
 * 
 * @param request The Next.js request object
 * @param response The Next.js response object (optional)
 * @returns An object containing the Supabase client and response
 */
export function createMiddlewareClient(request: NextRequest, response?: NextResponse) {
  const isUpdateSession = !response;
  let supabaseResponse: NextResponse | undefined;
  
  if (isUpdateSession) {
    supabaseResponse = NextResponse.next({
      request: { headers: request.headers },
    });
  }
  
  return {
    client: createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return isUpdateSession 
              ? request.cookies.getAll()
              : request.cookies.getAll().map(cookie => ({
                  name: cookie.name,
                  value: cookie.value,
                }));
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, ...options }) => {
              if (isUpdateSession && supabaseResponse) {
                request.cookies.set(name, value);
                supabaseResponse.cookies.set({
                  name,
                  value,
                  ...options,
                });
              } else if (response) {
                response.cookies.set({
                  name,
                  value,
                  ...options,
                });
              }
            });
          },
        },
      }
    ),
    response: isUpdateSession ? supabaseResponse : response,
  };
}

/**
 * Updates the Supabase session in middleware context
 * This refreshes the auth token if needed
 * 
 * @param request The Next.js request object
 * @returns A response with updated cookies
 */
export async function updateSession(request: NextRequest) {
  const { client, response } = createMiddlewareClient(request);
  
  // IMPORTANT: DO NOT REMOVE auth.getUser() - This refreshes the session if needed
  await client.auth.getUser();
  
  return response as NextResponse;
}
