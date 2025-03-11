import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient, updateSession } from '@/lib/supabase/server';

// Route configuration
const protectedRoutes = ['/profile', '/settings', '/podcasts/my'];
const adminRoutes = ['/admin'];
const skipMiddlewarePatterns = ['/_next', '/api/public', '.', '/favicon.ico'];

// Debug mode - only enable in development
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Middleware function for Next.js
 * Handles authentication and protected routes
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static assets and non-auth API routes
  if (skipMiddlewarePatterns.some(pattern => 
    pattern === pathname || pathname.startsWith(pattern))) {
    return NextResponse.next();
  }
  
  // First update the session - this refreshes the auth token if needed
  const response = await updateSession(request);
  
  // Check if the route requires authentication
  const routeRequiresAuth = protectedRoutes.some(route => pathname.startsWith(route));
  const routeRequiresAdmin = adminRoutes.some(route => pathname.startsWith(route));
  
  if (DEBUG) {
    console.log(`[Middleware] Path: ${pathname}, Auth: ${routeRequiresAuth}, Admin: ${routeRequiresAdmin}`);
  }
  
  // Skip auth check for non-protected routes
  if (!routeRequiresAuth && !routeRequiresAdmin) {
    return response;
  }
  
  // Check authentication for protected routes
  const { client } = createMiddlewareClient(request, response);
  const { data: { user } } = await client.auth.getUser();
  
  // If no user and trying to access a protected route, redirect to login
  if (!user && (routeRequiresAuth || routeRequiresAdmin)) {
    if (DEBUG) console.log(`[Middleware] Redirecting to login: No authenticated user`);
    
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  return response;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}; 