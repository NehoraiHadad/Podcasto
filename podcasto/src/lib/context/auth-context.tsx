'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useAuth } from '@/lib/hooks/use-auth';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
  signIn: ({ email, password }: { email: string; password: string }) => Promise<{ data?: any; error?: any }>;
  signInWithGoogle: () => Promise<{ data?: any; error?: any }>;
  signUp: ({ email, password }: { email: string; password: string }) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<{ success?: boolean; error?: any }>;
  resetPassword: (email: string) => Promise<{ data?: any; error?: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
} 