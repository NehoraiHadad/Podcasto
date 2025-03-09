import { NextRequest, NextResponse } from 'next/server';
import { updateSession, createMiddlewareClient } from '@/lib/supabase/middleware';

// Define protected routes that require authentication
const protectedRoutes = ['/profile', '/settings', '/podcasts/my'];

// Define admin routes that require admin role
const adminRoutes = ['/admin'];

// Debug mode - set to false in production
const DEBUG = true;

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
  
  // Create a Supabase client using the middleware helper
  const supabase = createMiddlewareClient(request, response);
  
  // Check if the route is protected or admin
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  const isAdminRoute = adminRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (DEBUG) {
    console.log(`[Middleware] Path: ${request.nextUrl.pathname}`);
    console.log(`[Middleware] Is protected route: ${isProtectedRoute}`);
    console.log(`[Middleware] Is admin route: ${isAdminRoute}`);
  }
  
  // Skip middleware for admin-debug route
  if (request.nextUrl.pathname.startsWith('/admin-debug')) {
    return response;
  }
  
  // Use getUser() for better security on the server
  // This authenticates against the Supabase Auth server
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (DEBUG) {
    console.log(`[Middleware] User authenticated: ${!!user}`);
    if (userError) {
      console.error(`[Middleware] Auth error: ${userError.message}`);
    }
  }
  
  // If no user and trying to access a protected or admin route, redirect to login
  if (!user && (isProtectedRoute || isAdminRoute)) {
    if (DEBUG) {
      console.log(`[Middleware] Redirecting to login: No authenticated user`);
    }
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If user is trying to access an admin route, check if they have admin role
  if (user && isAdminRoute) {
    // Check if user has admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (DEBUG) {
      console.log(`[Middleware] User roles: ${JSON.stringify(userRoles)}`);
      if (rolesError) {
        console.error(`[Middleware] Roles error: ${rolesError.message}`);
        console.error(`[Middleware] Roles error code: ${rolesError.code}`);
        console.error(`[Middleware] Roles error details: ${rolesError.details}`);
      }
    }
    
    // If user is not an admin, redirect to unauthorized page
    if (rolesError || !userRoles || userRoles.role !== 'admin') {
      if (DEBUG) {
        console.log(`[Middleware] Redirecting to unauthorized: Not an admin`);
        console.log(`[Middleware] User ID: ${user.id}`);
        console.log(`[Middleware] Role check: ${!rolesError && userRoles ? userRoles.role : 'No role found'}`);
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    if (DEBUG) {
      console.log(`[Middleware] Admin access granted for user: ${user.id}`);
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