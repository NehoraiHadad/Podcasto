import { NextRequest, NextResponse } from 'next/server';
import { createClientWithCookies } from '@/lib/supabase/server';

// Define protected routes that require authentication
const protectedRoutes = ['/profile', '/settings', '/podcasts/my'];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  
  // Create a Supabase client using our utility function
  const supabase = createClientWithCookies(request.cookies, res);
  
  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    // Use getUser() instead of getSession() for better security on the server
    const { data: { user } } = await supabase.auth.getUser();
    
    // If no user and trying to access a protected route, redirect to login
    if (!user) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
}; 