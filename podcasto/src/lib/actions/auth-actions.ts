'use server';

import { getURL } from '@/lib/utils/url';
import { validateLogin, validateRegistration } from '@/lib/auth';
import { errorResult, runAuthAction } from './shared';

const VALIDATION_ERROR_CODE = 'validation_error';

function buildValidationErrors(
  error?: {
    message: string;
    issues?: Array<{ path: string[]; message: string }>;
  }
) {
  if (!error) return undefined;

  if (error.issues?.length) {
    return error.issues.map((issue) => ({
      message: issue.message,
      field: issue.path.join('.'),
      code: VALIDATION_ERROR_CODE,
    }));
  }

  return [
    {
      message: error.message,
      code: VALIDATION_ERROR_CODE,
    },
  ];
}

/**
 * Server action to sign in with password
 *
 * @param email User's email
 * @param password User's password
 * @returns Result of the sign in operation
 */
export const signInWithPassword = async (email: string, password: string) => {
  const validation = validateLogin({ email, password });

  if (!validation.success || !validation.data) {
    const message = validation.error?.message ?? 'Invalid login credentials';
    return errorResult(message, buildValidationErrors(validation.error));
  }

  return runAuthAction(
    async (supabase) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.data!.email,
        password: validation.data!.password,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    {
      logContext: {
        action: 'signInWithPassword',
        email,
      },
    }
  );
};

/**
 * Server action to sign in with Google OAuth using PKCE flow
 * This returns a URL that the client should redirect to
 *
 * @param redirectTo Optional path to redirect to after login
 * @returns URL to redirect to for Google authentication
 */
export const signInWithGoogle = async (redirectTo?: string) => {
  const redirectURL = `${getURL()}auth/callback${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`;

  return runAuthAction(
    async (supabase) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectURL,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    {
      logContext: {
        action: 'signInWithGoogle',
        redirectTo,
      },
    }
  );
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
  if (confirmPassword !== undefined) {
    const validation = validateRegistration({ email, password, confirmPassword });

    if (!validation.success || !validation.data) {
      const message = validation.error?.message ?? 'Invalid registration data';
      return errorResult(message, buildValidationErrors(validation.error));
    }

    return runAuthAction(
      async (supabase) => {
        const { data, error } = await supabase.auth.signUp({
          email: validation.data!.email,
          password: validation.data!.password,
          options: {
            emailRedirectTo: `${getURL()}auth/callback`,
          },
        });

        if (error) {
          throw error;
        }

        return data;
      },
      {
        logContext: {
          action: 'signUpWithPassword',
          email,
        },
      }
    );
  }

  return runAuthAction(
    async (supabase) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    {
      logContext: {
        action: 'signUpWithPassword',
        email,
        legacyValidation: true,
      },
    }
  );
};

/**
 * Server action to sign out
 *
 * @returns Result of the sign out operation
 */
export const signOut = async () => {
  return runAuthAction(
    async (supabase) => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    },
    {
      logContext: {
        action: 'signOut',
      },
    }
  );
};