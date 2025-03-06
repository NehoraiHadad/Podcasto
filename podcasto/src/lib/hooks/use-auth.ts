import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getURL } from '@/lib/utils/url';

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // First authenticate the user with getUser() for security
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          setAuthState(prev => ({ ...prev, isLoading: false, error: userError }));
          return;
        }
        
        // Then get the session data
        const { data: { session }, error } = await supabase.auth.getSession();
        
        setAuthState({
          user: user ?? session?.user ?? null,
          session,
          isLoading: false,
          error: error || userError,
        });
      } catch (error) {
        setAuthState(prev => ({ ...prev, isLoading: false, error: error as AuthError }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          error: null,
        });
        
        // Refresh the page to ensure server-side state is updated
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          router.refresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

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

      router.push('/');
      return { data };
    } catch (error) {
      setAuthState(prev => ({ ...prev, error: error as AuthError }));
      return { error };
    }
  }, [router]);

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
  }, []);

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
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setAuthState(prev => ({ ...prev, error }));
        return { error };
      }
      
      router.push('/');
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, error: error as AuthError }));
      return { error };
    }
  }, [router]);

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
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    isLoading: authState.isLoading,
    error: authState.error,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
  };
} 