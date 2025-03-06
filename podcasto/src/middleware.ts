import { NextRequest, NextResponse } from 'next/server';
import { updateSession, createMiddlewareClient } from '@/lib/supabase/middleware';

// Define protected routes that require authentication
const protectedRoutes = ['/profile', '/settings', '/podcasts/my'];

/**
 * Middleware function for Next.js
 * Handles authentication and protected routes
 * 
 * @param request The Next.js request object
 * @returns A response, possibly redirecting to login if accessing protected routes without authentication
 */
export async function middleware(request: NextRequest) {
  // First update the session - this refreshes the auth token if needed
  const response = await updateSession(request);
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    // Create a Supabase client using the middleware helper
    const supabase = createMiddlewareClient(request, response);
    
    // Use getUser() for better security on the server
    // This authenticates against the Supabase Auth server
    const { data: { user } } = await supabase.auth.getUser();
    
    // If no user and trying to access a protected route, redirect to login
    if (!user) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  return response;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 