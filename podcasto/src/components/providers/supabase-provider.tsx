'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';

type SupabaseContextValue = {
  supabase: SupabaseClient<Database>;
  session: Session | null;
  user: User | null;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(
  undefined
);

type SupabaseProviderProps = {
  children: ReactNode;
  initialSession: Session | null;
  initialUser: User | null;
};

export function SupabaseProvider({
  children,
  initialSession,
  initialUser,
}: SupabaseProviderProps) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(
    initialUser ?? initialSession?.user ?? null
  );

  useEffect(() => {
    setSession(initialSession);
    setUser(initialUser ?? initialSession?.user ?? null);
  }, [initialSession, initialUser]);

  const value = useMemo(
    () => ({
      supabase,
      session,
      user,
      setSession,
      setUser,
    }),
    [supabase, session, user]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }

  return context;
}
