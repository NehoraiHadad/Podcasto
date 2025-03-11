import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';

/**
 * Route handler for auth callback
 * This is called after a user signs in with an OAuth provider
 * 
 * @param request The Next.js request object
 * @returns A redirect to the home page or a specified redirect URL
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const redirect = requestUrl.searchParams.get('redirect') || '/';
  
  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
    
    // Redirect to the home page or a specified redirect URL
    return NextResponse.redirect(new URL(redirect, request.url));
  } else if (token_hash && type) {
    // For email confirmations, redirect to the confirm page
    const confirmUrl = new URL('/auth/confirm', request.url);
    confirmUrl.searchParams.set('token_hash', token_hash);
    confirmUrl.searchParams.set('type', type);
    if (redirect !== '/') confirmUrl.searchParams.set('next', redirect);
    
    return NextResponse.redirect(confirmUrl);
  }
  
  // If no code or token, redirect to the home page
  return NextResponse.redirect(new URL('/', request.url));
} 