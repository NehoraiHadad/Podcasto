'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { useAuth } from '@/lib/hooks/use-auth';

// Disable the no-explicit-any rule for this type definition
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signIn: ({ email, password }: { email: string; password: string }) => Promise<{ data?: any; error?: any }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signInWithGoogle: () => Promise<{ data?: any; error?: any }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signUp: ({ email, password }: { email: string; password: string }) => Promise<{ data?: any; error?: any }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signOut: () => Promise<{ success?: boolean; error?: any }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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