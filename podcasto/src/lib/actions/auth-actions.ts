'use server';

import { createClient } from '@/lib/supabase/server';
import { getURL } from '@/lib/utils/url';
import { getCurrentUser as getUserFromUserActions, requireAuth as requireAuthFromUserActions } from './user-actions';
import { checkIsAdmin as checkIsAdminFromAdminActions, getUserRole as getUserRoleFromAdminActions } from './admin-actions';
import { resetPassword as resetPasswordFromPasswordActions, updatePassword as updatePasswordFromPasswordActions } from './auth-password-actions';

// Wrapper functions for backward compatibility
export async function getCurrentUser() {
  return getUserFromUserActions();
}

export async function requireAuth(redirectTo?: string) {
  return requireAuthFromUserActions(redirectTo);
}

export async function checkIsAdmin(options?: { redirectOnFailure?: boolean, redirectTo?: string }) {
  return checkIsAdminFromAdminActions(options || {});
}

/**
 * Server action to require admin role for a route
 * Redirects to unauthorized page if user is not an admin
 * 
 * @returns The user object if the user is an admin
 */
export async function requireAdmin() {
  return checkIsAdmin({ redirectOnFailure: true });
}

export async function getUserRole() {
  return getUserRoleFromAdminActions();
}

export async function resetPassword(email: string) {
  return resetPasswordFromPasswordActions(email);
}

export async function updatePassword(password: string) {
  return updatePasswordFromPasswordActions(password);
}

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
 * Server action to sign in with password
 * 
 * @param email User's email
 * @param password User's password
 * @returns Result of the sign in operation
 */
export const signInWithPassword = async (email: string, password: string) => {
  try {
    const supabase = await createClient();
    
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
 * @param redirectTo Optional path to redirect to after login
 * @returns URL to redirect to for Google authentication
 */
export const signInWithGoogle = async (redirectTo?: string) => {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getURL()}auth/callback${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`,
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
    const supabase = await createClient();
    
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
 * Server action to sign out
 * 
 * @returns Result of the sign out operation
 */
export const signOut = async () => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.signOut();
    
    return { error: handleAuthError(error) };
  } catch (error) {
    return { error: handleAuthError(error) };
  }
}; 