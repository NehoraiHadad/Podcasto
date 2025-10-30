'use server';

import { getURL } from '@/lib/utils/url';
import { validateLogin, validateRegistration } from '@/lib/auth';
import { errorResult, runAuthAction } from './shared';
import type { SignUpWithPasswordCredentials } from '@supabase/supabase-js';

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

type SignUpLogContext = {
  email: string;
  legacyValidation?: boolean;
};

async function executeSignUp(
  payload: SignUpWithPasswordCredentials,
  logContext: SignUpLogContext
) {
  return runAuthAction(
    async (supabase) => {
      const { data, error } = await supabase.auth.signUp(payload);

      if (error) {
        throw error;
      }

      return data;
    },
    {
      logContext: {
        action: 'signUpWithPassword',
        ...logContext,
      },
    }
  );
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
  const emailRedirectTo = `${getURL()}auth/callback`;
  let credentials: SignUpWithPasswordCredentials;
  let logContext: SignUpLogContext;

  if (confirmPassword !== undefined) {
    const validation = validateRegistration({ email, password, confirmPassword });

    if (!validation.success || !validation.data) {
      const message = validation.error?.message ?? 'Invalid registration data';
      return errorResult(message, buildValidationErrors(validation.error));
    }

    const { email: validatedEmail, password: validatedPassword } = validation.data;
    credentials = {
      email: validatedEmail,
      password: validatedPassword,
      options: {
        emailRedirectTo,
      },
    };
    logContext = { email };
  } else {
    credentials = {
      email,
      password,
      options: {
        emailRedirectTo,
      },
    };
    logContext = { email, legacyValidation: true };
  }

  return executeSignUp(credentials, logContext);
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