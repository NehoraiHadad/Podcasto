'use server';

import { createServerClient } from '@/lib/auth';
import { getURL } from '@/lib/utils/url';
import {
  handleSupabaseAuthError,
  authErrorToResult,
  logAuthError,
} from '@/lib/auth';

/**
 * Server action to reset password
 *
 * @param email - User's email address
 * @returns Result with error if failed
 */
export const resetPassword = async (email: string) => {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getURL()}auth/update-password`,
    });

    if (error) {
      const authError = handleSupabaseAuthError(error);
      logAuthError(authError, { action: 'resetPassword', email });
      return authErrorToResult(authError);
    }

    return { success: true };
  } catch (error) {
    const authError = handleSupabaseAuthError(error);
    logAuthError(authError, { action: 'resetPassword', email });
    return authErrorToResult(authError);
  }
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
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      const authError = handleSupabaseAuthError(error);
      logAuthError(authError, { action: 'updatePassword' });
      return authErrorToResult(authError);
    }

    return { success: true };
  } catch (error) {
    const authError = handleSupabaseAuthError(error);
    logAuthError(authError, { action: 'updatePassword' });
    return authErrorToResult(authError);
  }
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
  try {
    const supabase = await createServerClient();

    // Verify the code and exchange it for a session
    // This is a crucial step - it validates the reset code and creates a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const authError = handleSupabaseAuthError(error);
      logAuthError(authError, {
        action: 'updatePasswordWithCode',
        context: 'exchange_code',
      });
      return authErrorToResult(authError);
    }

    // Now that we have a valid session, update the password
    // The session is automatically used by the Supabase client
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      const authError = handleSupabaseAuthError(updateError);
      logAuthError(authError, {
        action: 'updatePasswordWithCode',
        context: 'update_password',
      });
      return authErrorToResult(authError);
    }

    console.log('[Auth] Password updated successfully');
    return { success: true };
  } catch (error) {
    const authError = handleSupabaseAuthError(error);
    logAuthError(authError, { action: 'updatePasswordWithCode' });
    return authErrorToResult(authError);
  }
}; 