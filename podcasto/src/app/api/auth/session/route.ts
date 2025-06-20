import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API route to get the current user session
 * This is used by client components to get the current user
 * Using getUser() instead of getSession() for better security
 * as recommended by Supabase documentation
 * 
 * @returns The current user data
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    try {
      // Use getUser instead of getSession for better security
      // getUser revalidates the Auth token with Supabase Auth server every time
      const { data, error } = await supabase.auth.getUser();

      // For auth-related errors (like missing session), return 200 with null user
      // This is expected for unauthenticated users
      if (error) {
        if (error.message.includes('auth') || error.message.includes('session')) {
          console.log('Auth error (expected for unauthenticated users):', error.message);
          return NextResponse.json(
            { user: null, error: null },
            { status: 200 }
          );
        }
        
        // For other errors, log but still return 200 with null user
        // This prevents client-side errors for non-critical issues
        console.error('Error fetching user:', error.message);
        return NextResponse.json(
          { user: null, error: null },
          { status: 200 }
        );
      }

      // If no user data or user is null, return null user (not an error)
      if (!data || !data.user) {
        return NextResponse.json(
          { user: null, error: null },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { user: data.user, error: null },
        { status: 200 }
      );
    } catch (supabaseError) {
      // Handle any errors from Supabase operations
      console.error('Supabase operation error:', supabaseError);
      return NextResponse.json(
        { user: null, error: null },
        { status: 200 }
      );
    }
  } catch (error) {
    // This is for critical errors like failing to create the Supabase client
    // Even in this case, return 200 with null user to prevent client errors
    console.error('Critical error in session API:', error);
    return NextResponse.json(
      { user: null, error: null },
      { status: 200 }
    );
  }
} 