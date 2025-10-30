'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { useSupabase } from './supabase-provider';

type SupabaseListenerProps = {
  accessToken?: Session['access_token'];
};

export function SupabaseListener({ accessToken }: SupabaseListenerProps) {
  const router = useRouter();
  const { supabase, setSession, setUser } = useSupabase();

  useEffect(() => {
    const {
      data: { subscription },
      error,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);

      if (session?.access_token !== accessToken) {
        router.refresh();
      }
    });

    if (error) {
      console.error('[SupabaseListener] Failed to subscribe to auth changes', error);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [accessToken, router, setSession, setUser, supabase]);

  return null;
}
