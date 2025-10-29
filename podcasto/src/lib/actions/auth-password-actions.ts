'use server';

import { getURL } from '@/lib/utils/url';
import { createAuthError, AuthenticationError, logAuthError } from '@/lib/auth';
import { runAuthAction } from './shared';

function withStage(error: unknown, stage: string) {
  const authError = createAuthError(error);
  return new AuthenticationError(authError.code, authError.message, {
    ...authError.context,
    stage,
  });
}

/**
 * Server action to reset password
 *
 * @param email - User's email address
 * @returns Result with error if failed
 */
export const resetPassword = async (email: string) => {
  return runAuthAction(
    async (supabase) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/update-password`,
      });

      if (error) {
        throw error;
      }
    },
    {
      logContext: {
        action: 'resetPassword',
        email,
      },
    }
  );
};

/**
 * Server action to update password
 * Note: This should only be used when the user is already authenticated
 * For password reset flow, use updatePasswordWithCode
 *
 * @param password - New password
 * @returns Result with error if failed
 */
export const updatePassword = async (password: string) => {
  return runAuthAction(
    async (supabase) => {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }
    },
    {
      logContext: {
        action: 'updatePassword',
      },
    }
  );
};

/**
 * Server action to update password with a reset code
 * This is used in the password reset flow when the user clicks on the reset link
 *
 * The flow works as follows:
 * 1. User receives a reset link with a code parameter
 * 2. The code is extracted from the URL and sent to this server action
 * 3. We exchange the code for a session using Supabase's exchangeCodeForSession
 * 4. Once we have a valid session, we update the user's password
 *
 * This approach keeps all Supabase interactions on the server side
 *
 * @param params - Object containing password and code
 * @returns Result with error if failed
 */
export const updatePasswordWithCode = async ({
  password,
  code
}: {
  password: string;
  code: string;
}) => {
  return runAuthAction(
    async (supabase) => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        const authError = withStage(error, 'exchange_code');
        logAuthError(authError, {
          action: 'updatePasswordWithCode',
          stage: 'exchange_code',
        });
        throw authError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        const authError = withStage(updateError, 'update_password');
        logAuthError(authError, {
          action: 'updatePasswordWithCode',
          stage: 'update_password',
        });
        throw authError;
      }

      console.log('[Auth] Password updated successfully');
    },
    {}
  );
};