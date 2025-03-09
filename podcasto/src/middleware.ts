import { NextRequest, NextResponse } from 'next/server';
import { updateSession, createMiddlewareClient } from '@/lib/supabase/middleware';

// Define protected routes that require authentication
const protectedRoutes = ['/profile', '/settings', '/podcasts/my'];

// Define admin routes that require admin role
const adminRoutes = ['/admin'];

// Debug mode - only enable in development
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Checks if a route requires authentication
 * 
 * @param pathname The current pathname
 * @returns Boolean indicating if the route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Checks if a route requires admin role
 * 
 * @param pathname The current pathname
 * @returns Boolean indicating if the route requires admin role
 */
function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => pathname.startsWith(route));
}

/**
 * Logs debug information if debug mode is enabled
 * 
 * @param message The message to log
 * @param data Optional data to log
 */
function debugLog(message: string, data?: any): void {
  if (DEBUG) {
    console.log(`[Middleware] ${message}`, data ? data : '');
  }
}

/**
 * Middleware function for Next.js
 * Handles authentication and protected routes
 * 
 * @param request The Next.js request object
 * @returns A response, possibly redirecting to login if accessing protected routes without authentication
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  try {
    // First update the session - this refreshes the auth token if needed
    const response = await updateSession(request);
    
    // Create a Supabase client using the middleware helper
    const supabase = createMiddlewareClient(request, response);
    
    // Check if the route is protected or admin
    const routeRequiresAuth = isProtectedRoute(pathname);
    const routeRequiresAdmin = isAdminRoute(pathname);
    
    debugLog(`Path: ${pathname}`);
    debugLog(`Requires auth: ${routeRequiresAuth}`);
    debugLog(`Requires admin: ${routeRequiresAdmin}`);
    
    // Skip middleware for admin-debug route
    if (pathname.startsWith('/admin-debug')) {
      return response;
    }
    
    // Use getUser() for better security on the server
    // This authenticates against the Supabase Auth server
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      debugLog(`User authenticated: ${!!user}`);
      if (userError && DEBUG) {
        console.error(`[Middleware] Auth error: ${userError.message}`);
      }
      
      // If no user and trying to access a protected or admin route, redirect to login
      if (!user && (routeRequiresAuth || routeRequiresAdmin)) {
        debugLog(`Redirecting to login: No authenticated user`);
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }
      
      // If user is trying to access an admin route, check if they have admin role
      if (user && routeRequiresAdmin) {
        // Check if user has admin role
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        debugLog(`User roles:`, userRoles);
        if (rolesError && DEBUG) {
          console.error(`[Middleware] Roles error: ${rolesError.message}`);
          console.error(`[Middleware] Roles error code: ${rolesError.code}`);
          console.error(`[Middleware] Roles error details: ${rolesError.details}`);
        }
        
        // If user is not an admin, redirect to unauthorized page
        if (rolesError || !userRoles || userRoles.role !== 'admin') {
          debugLog(`Redirecting to unauthorized: Not an admin`);
          debugLog(`User ID: ${user.id}`);
          debugLog(`Role check: ${!rolesError && userRoles ? userRoles.role : 'No role found'}`);
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        
        debugLog(`Admin access granted for user: ${user.id}`);
      }
    } catch (authError) {
      // Handle auth errors gracefully
      if (authError instanceof Error && 
          authError.message.includes('Auth session missing') && 
          (routeRequiresAuth || routeRequiresAdmin)) {
        // If session is missing and route requires auth, redirect to login
        debugLog(`Auth error: ${authError.message}`);
        debugLog(`Redirecting to login: Session missing`);
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }
      
      // For other errors, log but continue
      if (DEBUG) {
        console.error(`[Middleware] Auth error:`, authError);
      }
    }
    
    return response;
  } catch (error) {
    // For critical errors, log and continue with a new response
    if (DEBUG) {
      console.error(`[Middleware] Critical error:`, error);
    }
    return NextResponse.next();
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 