'use client';

import { useCallback, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  signInWithPassword as serverSignInWithPassword,
  signInWithGoogle as serverSignInWithGoogle,
  signUpWithPassword as serverSignUpWithPassword,
  signOut as serverSignOut,
  resetPassword as serverResetPassword
} from '@/lib/actions/auth-actions';
import { useAuthEvents } from './use-auth-events';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
};

type UseAuthProps = {
  initialUser?: User | null;
};

/**
 * Hook for authentication in client components
 * Can be used with or without initial server-fetched data
 * Uses server actions for secure authentication operations
 * Uses Server-Sent Events for auth state changes instead of client-side subscriptions
 * Now with immediate UI updates for better UX
 * 
 * @param initialUser Optional user data fetched from the server
 * @returns Authentication state and methods
 */
export function useAuth({ initialUser = null }: UseAuthProps = {}) {
  const [authState, setAuthState] = useState<AuthState>({
    user: initialUser,
    isLoading: !initialUser,
    error: null,
  });
  const router = useRouter();
  
  // Use our SSE-based auth events hook for real-time auth state updates
  const { user: eventUser, error: eventError } = useAuthEvents({ initialUser });

  // Update auth state when event user changes
  useEffect(() => {
    if (eventUser !== undefined) {
      setAuthState(prev => ({
        ...prev,
        user: eventUser,
        isLoading: false,
        error: eventError ? eventError as AuthError : null,
      }));
      
      // Refresh the page to ensure server-side state is updated
      // Only do this when auth state actually changes
      if (eventUser?.id !== authState.user?.id) {
        router.refresh();
      }
    }
  }, [eventUser, eventError, router, authState.user?.id]);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    try {
      // Set loading state immediately for better UX
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use server action for sign in
      const { data, error } = await serverSignInWithPassword(email, password);

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error as AuthError 
        }));
        return { error };
      }

      // Immediately update UI with user data if available
      if (data?.user) {
        setAuthState(prev => ({
          ...prev,
          user: data.user,
          isLoading: false,
          error: null
        }));
      } else {
        // Just mark as not loading if no user data
        setAuthState(prev => ({
          ...prev,
          isLoading: false
        }));
      }

      // Navigate to home page
      router.push('/');
      router.refresh();
      
      return { data };
    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: authError 
      }));
      return { error: authError };
    }
  }, [router]);

  const signInWithGoogle = useCallback(async () => {
    try {
      // Set loading state immediately
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use server action for Google sign in with PKCE flow
      const { data, error } = await serverSignInWithGoogle();

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error as AuthError 
        }));
        return { error };
      }

      // For OAuth, we don't get user data immediately, just mark as not loading
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }));

      return { data };
    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: authError 
      }));
      return { error: authError };
    }
  }, []);

  const signUp = useCallback(async ({ email, password }: { email: string; password: string }) => {
    try {
      // Set loading state immediately
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use server action for sign up
      const { data, error } = await serverSignUpWithPassword(email, password);

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error as AuthError 
        }));
        return { error };
      }

      // Update UI with confirmation message
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }));

      return { data };
    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: authError 
      }));
      return { error: authError };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Immediately clear local state for better UX
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: true,
        error: null,
      }));
      
      // Use server action for sign out
      const { error } = await serverSignOut();
      
      // Mark as not loading regardless of result
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }));
      
      if (error) {
        // If it's an AuthSessionMissingError, ignore it
        if (error.message?.includes('Auth session missing')) {
          router.push('/');
          router.refresh();
          return { success: true };
        }
        
        setAuthState(prev => ({ ...prev, error: error as AuthError }));
        return { error };
      }
      
      router.push('/');
      router.refresh();
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: authError 
      }));
      return { error: authError };
    }
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      // Set loading state immediately
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use server action for password reset
      const { data, error } = await serverResetPassword(email);

      // Mark as not loading regardless of result
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error ? error as AuthError : null
      }));

      return { data, error };
    } catch (error) {
      const authError = error as AuthError;
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: authError 
      }));
      return { error: authError };
    }
  }, []);

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
  };
} 