'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { User } from '@supabase/supabase-js';

type AuthStatusProps = {
  initialUser?: User | null;
};

export const AuthStatus = ({ initialUser }: AuthStatusProps) => {
  const { user, isLoading, signOut } = useAuth({ initialUser });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <span className="text-sm">Signed in as {user.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Sign out
          </button>
        </>
      ) : (
        <span className="text-sm">Not signed in</span>
      )}
    </div>
  );
}; 