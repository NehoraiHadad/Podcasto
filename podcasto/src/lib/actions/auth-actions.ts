'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getURL } from '@/lib/utils/url';

/**
 * Utility function to handle auth errors consistently
 * 
 * @param error The error to handle
 * @returns A standardized error object
 */
const handleAuthError = (error: unknown) => {
  if (!error) return null;
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : (typeof error === 'object' && error !== null && 'message' in error)
      ? String(error.message)
      : 'An unknown error occurred';
      
  return { message: errorMessage };
};

/**
 * Server action to check if the current user has admin role
 * This is cached to avoid multiple database calls for the same user
 * 
 * @returns Boolean indicating if the user has admin role
 */
export const checkIsAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createServerSupabaseClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return false;
  }
  
  // Check if user has admin role
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (rolesError || !userRoles) {
    return false;
  }
  
  return userRoles.role === 'admin';
});

/**
 * Server action to require admin role for a route
 * Redirects to unauthorized page if user is not an admin
 * 
 * @returns The user object if the user is an admin
 */
export const requireAdmin = async () => {
  const supabase = await createServerSupabaseClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/login?callbackUrl=/admin');
  }
  
  // Check if user has admin role
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (rolesError || !userRoles || userRoles.role !== 'admin') {
    redirect('/unauthorized');
  }
  
  return user;
};

/**
 * Server action to get the current user's role
 * 
 * @returns The user's role or null if not found
 */
export const getUserRole = async (): Promise<string | null> => {
  const supabase = await createServerSupabaseClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  // Get user role
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (rolesError || !userRoles) {
    return null;
  }
  
  return userRoles.role;
};

/**
 * Server action to sign in with email and password
 * 
 * @param email User's email
 * @param password User's password
 * @returns Result of the sign in operation
 */
export const signInWithPassword = async (email: string, password: string) => {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error: handleAuthError(error) };
  } catch (error) {
    return { data: null, error: handleAuthError(error) };
  }
};

/**
 * Server action to sign in with Google OAuth using PKCE flow
 * This returns a URL that the client should redirect to
 * 
 * @returns URL to redirect to for Google authentication
 */
export const signInWithGoogle = async () => {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getURL()}auth/callback`,
        // Request offline access to get a refresh token
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    return { data, error: handleAuthError(error) };
  } catch (error) {
    return { data: null, error: handleAuthError(error) };
  }
};

/**
 * Server action to sign up with email and password
 * 
 * @param email User's email
 * @param password User's password
 * @returns Result of the sign up operation
 */
export const signUpWithPassword = async (email: string, password: string) => {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`,
      },
    });
    
    return { data, error: handleAuthError(error) };
  } catch (error) {
    return { data: null, error: handleAuthError(error) };
  }
};

/**
 * Server action to sign out the current user
 * Handles AuthSessionMissingError gracefully
 * 
 * @returns Result of the sign out operation
 */
export const signOut = async () => {
  try {
    const supabase = await createServerSupabaseClient();
    
    try {
      // Try to sign out normally
      const { error } = await supabase.auth.signOut();
      return { success: !error, error: handleAuthError(error) };
    } catch (signOutError) {
      // Check if it's an AuthSessionMissingError
      if (signOutError instanceof Error && 
          signOutError.message.includes('Auth session missing')) {
        // If the session is already missing, consider it a successful logout
        console.log('Session already cleared, considering logout successful');
        return { success: true, error: null };
      }
      
      // For other errors, handle normally
      return { success: false, error: handleAuthError(signOutError) };
    }
  } catch (error) {
    return { success: false, error: handleAuthError(error) };
  }
};

/**
 * Server action to reset a user's password
 * 
 * @param email User's email
 * @returns Result of the password reset operation
 */
export const resetPassword = async (email: string) => {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getURL()}auth/reset-password`,
    });
    
    return { data, error: handleAuthError(error) };
  } catch (error) {
    return { data: null, error: handleAuthError(error) };
  }
};

/**
 * Server action to get the current user
 * 
 * @returns The current user or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    return { user, error: handleAuthError(error) };
  } catch (error) {
    return { user: null, error: handleAuthError(error) };
  }
}; 