/**
 * Next.js Middleware
 *
 * Handles authentication, session refresh, and route protection.
 * Following 2025 Supabase SSR best practices with advanced patterns.
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/auth/session/middleware';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = ['/profile', '/settings', '/podcasts/my', '/credits'];

/**
 * Routes that require admin role
 */
const ADMIN_ROUTES = ['/admin'];

/**
 * Auth-related routes (redirect authenticated users)
 */
const AUTH_ROUTES = ['/auth/login', '/auth/signup'];

/**
 * Patterns to skip middleware processing
 */
const SKIP_MIDDLEWARE_PATTERNS = [
  '/_next',
  '/api/public',
  '/favicon.ico',
  '.',
];

/**
 * Debug mode - only enable in development
 */
const DEBUG = process.env.NODE_ENV === 'development';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a path should skip middleware
 */
function shouldSkipMiddleware(pathname: string): boolean {
  return SKIP_MIDDLEWARE_PATTERNS.some((pattern) =>
    pattern === pathname || pathname.startsWith(pattern)
  );
}

/**
 * Check if a path requires authentication
 */
function requiresAuth(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path requires admin role
 */
function requiresAdmin(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Build redirect URL with return path
 */
function buildRedirectUrl(
  request: NextRequest,
  targetPath: string,
  preserveReturn = true
): URL {
  const redirectUrl = new URL(targetPath, request.url);

  if (preserveReturn && request.nextUrl.pathname !== targetPath) {
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
  }

  return redirectUrl;
}

/**
 * Debug log helper
 */
function debugLog(message: string, data?: Record<string, unknown>): void {
  if (DEBUG) {
    console.log(`[Middleware] ${message}`, data ? JSON.stringify(data) : '');
  }
}

export function withSupabaseCookies(
  base: NextResponse,
  source: NextResponse
): NextResponse {
  for (const cookie of source.cookies.getAll()) base.cookies.set(cookie);
  return base;
}

// ============================================================================
// Middleware Function
// ============================================================================

/**
 * Main middleware function for Next.js
 *
 * Handles:
 * - Session refresh (via getUser() call in updateSession)
 * - Route protection (authentication required)
 * - Role-based access control (admin routes)
 * - Auth route redirection (logged-in users shouldn't see login page)
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  debugLog('Processing request', { pathname });

  // Skip middleware for static assets and non-auth API routes
  if (shouldSkipMiddleware(pathname)) {
    debugLog('Skipping middleware', { pathname });
    return NextResponse.next();
  }

  // First, update the session - this refreshes the auth token if needed
  // CRITICAL: This calls getUser() internally, which validates the JWT
  const { response, userResult } = await updateSession(request);

  // Check route requirements
  const needsAuth = requiresAuth(pathname);
  const needsAdmin = requiresAdmin(pathname);
  const isAuth = isAuthRoute(pathname);

  debugLog('Route analysis', {
    pathname,
    needsAuth,
    needsAdmin,
    isAuth,
  });

  // Skip additional checks for non-protected routes (unless auth route)
  if (!needsAuth && !needsAdmin && !isAuth) {
    return response;
  }

  // Get user information to check authentication status
  if (!userResult) {
    debugLog('User fetch result missing after session update', { pathname });
  }

  const user = userResult?.data.user ?? null;

  if (userResult?.error) {
    debugLog('User fetch returned an error after session update', {
      pathname,
      error: userResult.error.message,
    });
  }

  debugLog('User status', {
    authenticated: !!user,
    userId: user?.id,
  });

  // Handle auth routes - redirect if already logged in
  if (isAuth && user) {
    debugLog('Redirecting authenticated user from auth page', { pathname });

    // Check if there's a redirect parameter
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const redirectPath = redirectParam || '/';

    const redirectResponse = NextResponse.redirect(
      new URL(redirectPath, request.url)
    );
    return withSupabaseCookies(redirectResponse, response);
  }

  // Handle protected routes - redirect if not authenticated
  if ((needsAuth || needsAdmin) && !user) {
    debugLog('Redirecting unauthenticated user to login', { pathname });

    const redirectUrl = buildRedirectUrl(request, '/auth/login');
    const redirectResponse = NextResponse.redirect(redirectUrl);
    return withSupabaseCookies(redirectResponse, response);
  }

  // Handle admin routes - need to check role
  if (needsAdmin && user) {
    // Note: For admin check, we rely on server actions to validate
    // the role via requireAdmin(). Middleware only checks authentication.
    // This prevents an extra database query in middleware.
    //
    // If you need strict middleware-level role checking, you would:
    // 1. Query user_roles table here
    // 2. Check for admin role
    // 3. Redirect to /unauthorized if not admin
    //
    // For now, we trust that admin routes will use requireAdmin()
    // in their server actions/components.
    debugLog('Admin route access', {
      pathname,
      userId: user.id,
      note: 'Role check delegated to server actions',
    });
  }

  // All checks passed, return the response with updated session
  return response;
}

// ============================================================================
// Middleware Configuration
// ============================================================================

/**
 * Specify which routes this middleware should run on
 *
 * This matcher ensures middleware runs on all routes except:
 * - Static files in _next/static
 * - Image optimization files in _next/image
 * - Favicon
 * - Image files (svg, png, jpg, jpeg, gif, webp)
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
