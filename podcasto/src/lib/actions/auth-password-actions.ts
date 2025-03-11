'use server';

import { createClient } from '@/lib/supabase/server';
import { getURL } from '@/lib/utils/url';

/**
 * Utility function to handle auth errors consistently
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
 * Server action to reset password
 */
export const resetPassword = async (email: string) => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getURL()}auth/update-password`,
    });
    
    return { error: handleAuthError(error) };
  } catch (error) {
    return { error: handleAuthError(error) };
  }
};

/**
 * Server action to update password
 * Note: This should only be used when the user is already authenticated
 * For password reset flow, use updatePasswordWithCode
 */
export const updatePassword = async (password: string) => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    return { error: handleAuthError(error) };
  } catch (error) {
    return { error: handleAuthError(error) };
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
 */
export const updatePasswordWithCode = async ({ 
  password, 
  code 
}: { 
  password: string; 
  code: string;
}) => {
  try {
    const supabase = await createClient();
    
    // Verify the code and exchange it for a session
    // This is a crucial step - it validates the reset code and creates a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return { error: handleAuthError(error) };
    }
    
    // Now that we have a valid session, update the password
    // The session is automatically used by the Supabase client
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    
    if (updateError) {
      console.error('Error updating password:', updateError);
    } else {
      console.log('Password updated successfully');
    }
    
    return { error: handleAuthError(updateError) };
  } catch (error) {
    console.error('Unexpected error in updatePasswordWithCode:', error);
    return { error: handleAuthError(error) };
  }
}; 