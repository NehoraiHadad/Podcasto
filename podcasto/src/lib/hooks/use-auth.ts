'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, AuthError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getURL } from '@/lib/utils/url';

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
 * Uses getUser() for secure authentication against the Supabase Auth server
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
  const supabase = createClient();

  useEffect(() => {
    // Skip initial user fetch if we already have data from the server
    if (initialUser) {
      return;
    }

    // Get initial authenticated user
    const getInitialUser = async () => {
      try {
        // Use getUser() for security - this authenticates against the Supabase Auth server
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          setAuthState(prev => ({ ...prev, isLoading: false, error }));
          return;
        }
        
        setAuthState({
          user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setAuthState(prev => ({ ...prev, isLoading: false, error: error as AuthError }));
      }
    };

    getInitialUser();
  }, [initialUser, supabase.auth]);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // When auth state changes, verify the user with getUser() for security
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { data: { user }, error } = await supabase.auth.getUser();
          
          setAuthState(prev => ({
            ...prev,
            user: error ? null : user,
            isLoading: false,
            error: error || null,
          }));
        } else if (event === 'SIGNED_OUT') {
          setAuthState(prev => ({
            ...prev,
            user: null,
            isLoading: false,
            error: null,
          }));
        }
        
        // Refresh the page to ensure server-side state is updated
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          router.refresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error }));
        return { error };
      }

      // Verify the user with getUser() after sign in
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        setAuthState(prev => ({ ...prev, error: userError }));
        return { error: userError };
      }
      
      setAuthState(prev => ({
        ...prev,
        user,
        error: null,
      }));

      router.push('/');
      return { data };
    } catch (error) {
      setAuthState(prev => ({ ...prev, error: error as AuthError }));
      return { error };
    }
  }, [router, supabase.auth]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getURL()}auth/callback`,
        },
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error }));
        return { error };
      }

      return { data };
    } catch (error) {
      setAuthState(prev => ({ ...prev, error: error as AuthError }));
      return { error };
    }
  }, [supabase.auth]);

  const signUp = useCallback(async ({ email, password }: { email: string; password: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/callback`,
        },
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error }));
        return { error };
      }

      return { data };
    } catch (error) {
      setAuthState(prev => ({ ...prev, error: error as AuthError }));
      return { error };
    }
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setAuthState(prev => ({ ...prev, error }));
        return { error };
      }
      
      setAuthState(prev => ({
        ...prev,
        user: null,
        error: null,
      }));
      
      router.push('/');
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, error: error as AuthError }));
      return { error };
    }
  }, [router, supabase.auth]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/reset-password`,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error }));
        return { error };
      }

      return { data };
    } catch (error) {
      setAuthState(prev => ({ ...prev, error: error as AuthError }));
      return { error };
    }
  }, [supabase.auth]);

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