/**
 * Session Middleware Helpers
 *
 * Functions for handling sessions in Next.js middleware context.
 * These are specifically designed for middleware use cases.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createSupabaseClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * Create a Supabase client for middleware usage
 *
 * This version is optimized for middleware and properly handles
 * cookie operations in the middleware context.
 *
 * @param request - The Next.js request object
 * @param response - The Next.js response object (optional)
 * @returns An object containing the Supabase client and response
 *
 * @example
 * ```typescript
 * const { client, response } = createMiddlewareClient(request);
 * const { data: { user } } = await client.auth.getUser();
 * ```
 */
export function createMiddlewareClient(
  request: NextRequest,
  response?: NextResponse
): { client: SupabaseClient<Database>; response: NextResponse } {
  const isUpdateSession = !response;
  const supabaseResponse =
    response ??
    NextResponse.next({
      request: { headers: request.headers },
    });

  return {
    client: createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return isUpdateSession
              ? request.cookies.getAll()
              : request.cookies.getAll().map((cookie) => ({
                  name: cookie.name,
                  value: cookie.value,
                }));
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, ...options }) => {
              if (isUpdateSession) {
                request.cookies.set(name, value);
              }

              supabaseResponse.cookies.set({
                name,
                value,
                ...options,
              });
            });
          },
        },
      }
    ),
    response: supabaseResponse,
  };
}

/**
 * Update the Supabase session in middleware context
 *
 * This refreshes the auth token if needed and properly sets cookies.
 * IMPORTANT: This calls getUser() to validate and refresh the session.
 *
 * @param request - The Next.js request object
 * @returns An object with the Supabase client and response containing updated cookies
 *
 * @example
 * ```typescript
 * export async function middleware(request: NextRequest) {
 *   const { client, response } = await updateSession(request);
 *   const {
 *     data: { user },
 *   } = await client.auth.getUser();
 *
 *   return response;
 * }
 * ```
 */
export async function updateSession(
  request: NextRequest
): Promise<{ client: SupabaseClient<Database>; response: NextResponse }> {
  const result = createMiddlewareClient(request);

  // IMPORTANT: DO NOT REMOVE auth.getUser() - This refreshes the session if needed
  // This is the 2025 Supabase SSR best practice for middleware
  await result.client.auth.getUser();

  return result;
}
