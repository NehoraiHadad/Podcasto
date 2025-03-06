import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Route handler for auth callback
 * This is called after a user signs in with an OAuth provider or confirms their email
 * 
 * @param request The Next.js request object
 * @returns A redirect to the home page or a specified redirect URL
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  
  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }
  
  // Redirect to the home page or a specified redirect URL
  return NextResponse.redirect(new URL(next, request.url));
} 