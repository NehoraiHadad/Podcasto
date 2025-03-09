'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Server action to get the current auth state
 * This is used by the client to check auth state without needing a client-side subscription
 * Handles AuthSessionMissingError gracefully
 * 
 * @returns The current auth state (user and session)
 */
export async function getAuthState() {
  const supabase = await createServerSupabaseClient();
  
  try {
    // First try to get the session - this might throw AuthSessionMissingError
    let session = null;
    let sessionError = null;
    
    try {
      const sessionResult = await supabase.auth.getSession();
      session = sessionResult.data.session;
      sessionError = sessionResult.error;
    } catch (error) {
      // Handle AuthSessionMissingError gracefully
      console.log('Session retrieval error:', error);
      
      // If it's an AuthSessionMissingError, return a clean response
      if (error instanceof Error && error.message.includes('Auth session missing')) {
        return { 
          user: null, 
          session: null, 
          error: null // Don't treat this as an error for the client
        };
      }
      
      sessionError = error instanceof Error ? error : new Error('Session error');
    }
    
    // If no session, return early with appropriate error
    if (!session || sessionError) {
      return { 
        user: null, 
        session: null, 
        error: {
          message: sessionError instanceof Error ? sessionError.message : 'No active session found'
        }
      };
    }
    
    // If we have a session, try to get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return { 
        user: null, 
        session, 
        error: {
          message: userError.message || 'Failed to get user data'
        }
      };
    }
    
    return { 
      user, 
      session,
      error: null 
    };
  } catch (error) {
    console.error('Error getting auth state:', error);
    return { 
      user: null, 
      session: null, 
      error: {
        message: error instanceof Error ? error.message : 'Unknown authentication error'
      }
    };
  }
}

/**
 * Creates a Server-Sent Events (SSE) endpoint for auth state changes
 * This allows the client to receive real-time auth state updates without client-side subscriptions
 * 
 * @param req The Next.js request object
 * @returns A streaming response with auth state updates
 */
export async function authStateStream(req: NextRequest) {
  const cookieStore = cookies();
  
  // Create response object with appropriate headers for SSE
  const response = new NextResponse(new ReadableStream({
    start(controller) {
      // Send initial auth state
      const sendAuthState = async () => {
        try {
          const supabase = await createServerSupabaseClient();
          
          // First try to get the session safely
          let user = null;
          let error = null;
          
          try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionData.session) {
              // Only try to get user if we have a valid session
              const { data: userData, error: userError } = await supabase.auth.getUser();
              user = userData.user;
              error = userError;
            } else {
              error = sessionError || new Error('No active session');
            }
          } catch (err) {
            console.error('Error in auth state stream:', err);
            error = err instanceof Error ? err : new Error('Authentication error');
          }
          
          // Format data for SSE
          const data = JSON.stringify({ 
            user,
            error: error ? { message: error.message } : null,
            timestamp: Date.now() // Add timestamp to help client detect changes
          });
          
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error('Error in auth state stream:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to get auth state';
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
            error: { message: errorMessage },
            timestamp: Date.now()
          })}\n\n`));
        }
      };
      
      // Send initial state
      sendAuthState();
      
      // Set up interval to check for auth changes
      // Reduced from 15 seconds to 3 seconds for better responsiveness
      // This is a reasonable compromise between responsiveness and server load
      const interval = setInterval(sendAuthState, 3000);
      
      // Clean up on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  }), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
  
  return response;
} 