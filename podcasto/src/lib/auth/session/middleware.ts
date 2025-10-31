/**
 * Session Middleware Helpers
 *
 * Functions for handling sessions in Next.js middleware context.
 * These are specifically designed for middleware use cases.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { UserResponse } from '@supabase/supabase-js';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware-client';

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
) {
  return createSupabaseMiddlewareClient(request, response);
}

/**
 * Update the Supabase session in middleware context
 *
 * This refreshes the auth token if needed and properly sets cookies.
 * IMPORTANT: This calls getUser() to validate and refresh the session.
 *
 * @param request - The Next.js request object
 * @returns An object containing the response with updated cookies and the
 * user fetch result
 *
 * @example
 * ```typescript
 * export async function middleware(request: NextRequest) {
 *   const { response } = await updateSession(request);
 *   return response;
 * }
 * ```
 */
export type UpdateSessionResult = {
  response: NextResponse;
  userResult: UserResponse | null;
};

export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  const { client, response } = createMiddlewareClient(request);

  // IMPORTANT: DO NOT REMOVE auth.getUser() - This refreshes the session if needed
  // This is the 2025 Supabase SSR best practice for middleware
  let userResult: UserResponse | null = null;

  try {
    userResult = await client.auth.getUser();

    if (userResult.error) {
      // Only log errors that are NOT "session missing" (which is normal for unauthenticated requests)
      if (userResult.error.name !== 'AuthSessionMissingError') {
        console.error('[Middleware] Failed to fetch user during session update', {
          pathname: request.nextUrl.pathname,
          errorName: userResult.error.name,
          errorMessage: userResult.error.message,
          error: userResult.error,
        });
      } else {
        // Log session missing only in debug mode with pathname for investigation
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Middleware] No session found for path:', request.nextUrl.pathname);
        }
      }
    }
  } catch (error) {
    console.error('[Middleware] Unexpected error during session update', {
      pathname: request.nextUrl.pathname,
      error,
    });
  }

  return {
    response: response as NextResponse,
    userResult,
  };
}
