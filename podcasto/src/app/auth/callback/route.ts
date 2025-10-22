import { createServerClient } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { getUserCredits } from '@/lib/db/api/credits';
import { creditService } from '@/lib/services/credits';
import { hasSeenWelcome, markWelcomeAsSeen } from '@/lib/actions/user-actions';

/**
 * Route handler for auth callback
 * This is called after a user signs in with an OAuth provider or email confirmation
 * Automatically initializes credits for new users
 *
 * @param request The Next.js request object
 * @returns A redirect to the welcome page (new users) or specified redirect URL
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const redirect = requestUrl.searchParams.get('redirect') || '/';

  if (code) {
    const supabase = await createServerClient();

    // Exchange the code for a session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      // Check if user has seen welcome page
      const welcomeStatus = await hasSeenWelcome(user.id);
      const shouldShowWelcome = !welcomeStatus.hasSeen;

      // Check if this is a new user by looking for existing credits
      const existingCredits = await getUserCredits(user.id);

      if (!existingCredits) {
        console.log(`[AUTH_CALLBACK] New user detected: ${user.id}, initializing credits`);

        // Initialize credits for new user
        const result = await creditService.initializeUserCredits(user.id);

        if (result.success) {
          console.log(`[AUTH_CALLBACK] Credits initialized for user ${user.id}: ${result.newBalance} credits`);

          // Mark welcome as seen before redirecting
          await markWelcomeAsSeen(user.id);

          // Redirect to welcome page with credits notification
          return NextResponse.redirect(new URL('/welcome?credits=true', request.url));
        } else {
          console.error(`[AUTH_CALLBACK] Failed to initialize credits:`, result.error);
          // Continue anyway - credits can be initialized later via getUserCreditsAction
        }
      } else if (shouldShowWelcome) {
        // Existing user who hasn't seen welcome (edge case: users created before this feature)
        console.log(`[AUTH_CALLBACK] Existing user ${user.id} hasn't seen welcome page, showing it now`);

        // Mark welcome as seen before redirecting
        await markWelcomeAsSeen(user.id);

        // Redirect to welcome page without credits notification
        return NextResponse.redirect(new URL('/welcome', request.url));
      }
    }

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