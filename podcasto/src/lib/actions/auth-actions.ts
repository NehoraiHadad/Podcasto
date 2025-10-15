'use server';

import { createClient } from '@/lib/supabase/server';
import { getURL } from '@/lib/utils/url';
import {
  handleSupabaseAuthError,
  authErrorToResult,
  logAuthError,
  validateLogin,
  validateRegistration,
} from '@/lib/auth';

/**
 * Server action to sign in with password
 *
 * @param email User's email
 * @param password User's password
 * @returns Result of the sign in operation
 */
export const signInWithPassword = async (email: string, password: string) => {
  try {
    // Validate input
    const validation = validateLogin({ email, password });
    if (!validation.success || !validation.data) {
      return {
        data: null,
        error: {
          message: validation.error?.message || 'Invalid input',
          code: 'validation_error',
          status: 400
        }
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) {
      const authError = handleSupabaseAuthError(error);
      logAuthError(authError, { action: 'signInWithPassword', email });
      const result = authErrorToResult(authError);
      return { data: null, error: result.error };
    }

    return { data, error: null };
  } catch (error) {
    const authError = handleSupabaseAuthError(error);
    logAuthError(authError, { action: 'signInWithPassword', email });
    const result = authErrorToResult(authError);
    return { data: null, error: result.error };
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

    if (error) {
      const authError = handleSupabaseAuthError(error);
      logAuthError(authError, { action: 'signInWithGoogle' });
      const result = authErrorToResult(authError);
      return { data: null, error: result.error };
    }

    return { data, error: null };
  } catch (error) {
    const authError = handleSupabaseAuthError(error);
    logAuthError(authError, { action: 'signInWithGoogle' });
    const result = authErrorToResult(authError);
    return { data: null, error: result.error };
  }
};

/**
 * Server action to sign up with email and password
 *
 * @param email User's email
 * @param password User's password
 * @param confirmPassword Password confirmation (optional for backward compatibility)
 * @returns Result of the sign up operation
 */
export const signUpWithPassword = async (email: string, password: string, confirmPassword?: string) => {
  try {
    // Validate input (with confirmation if provided)
    if (confirmPassword !== undefined) {
      const validation = validateRegistration({ email, password, confirmPassword });
      if (!validation.success || !validation.data) {
        return {
          data: null,
          error: {
            message: validation.error?.message || 'Invalid input',
            code: 'validation_error',
            status: 400
          }
        };
      }

      const supabase = await createClient();

      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: `${getURL()}auth/callback`,
        },
      });

      if (error) {
        const authError = handleSupabaseAuthError(error);
        logAuthError(authError, { action: 'signUpWithPassword', email });
        const result = authErrorToResult(authError);
        return { data: null, error: result.error };
      }

      return { data, error: null };
    }

    // Fallback to basic validation (backward compatibility)
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`,
      },
    });

    if (error) {
      const authError = handleSupabaseAuthError(error);
      logAuthError(authError, { action: 'signUpWithPassword', email });
      const result = authErrorToResult(authError);
      return { data: null, error: result.error };
    }

    return { data, error: null };
  } catch (error) {
    const authError = handleSupabaseAuthError(error);
    logAuthError(authError, { action: 'signUpWithPassword', email });
    const result = authErrorToResult(authError);
    return { data: null, error: result.error };
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

    if (error) {
      const authError = handleSupabaseAuthError(error);
      logAuthError(authError, { action: 'signOut' });
      return authErrorToResult(authError);
    }

    return { success: true };
  } catch (error) {
    const authError = handleSupabaseAuthError(error);
    logAuthError(authError, { action: 'signOut' });
    return authErrorToResult(authError);
  }
}; 