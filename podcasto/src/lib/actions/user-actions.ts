'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * Server action to get the current user
 * This is a secure way to get the user in server components
 * Cached to avoid multiple database calls
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Don't log session missing errors as they're expected for unauthenticated users
      if (!error.message.includes('Auth session missing')) {
        console.error('Error getting current user:', error.message);
      }
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Unexpected error getting current user:', error);
    return null;
  }
});

/**
 * Server action to check if user is authenticated
 * Redirects to login if not authenticated
 * 
 * @param redirectTo Optional path to redirect to after login
 * @returns The authenticated user
 */
export const requireAuth = async (redirectTo?: string) => {
  const supabase = await createClient();
  
  // Get the user directly from Supabase Auth
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    const loginPath = redirectTo 
      ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/auth/login';
    
    redirect(loginPath);
  }
  
  return user;
}; 