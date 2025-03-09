import { authStateStream } from '@/lib/actions/auth-events';
import { NextRequest } from 'next/server';

/**
 * Route handler for auth state events
 * This creates a Server-Sent Events (SSE) stream for auth state changes
 * 
 * @param req The Next.js request object
 * @returns A streaming response with auth state updates
 */
export async function GET(req: NextRequest) {
  return authStateStream(req);
}

// Disable response body compression for SSE
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 