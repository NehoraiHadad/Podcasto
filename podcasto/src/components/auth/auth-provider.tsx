import { createClient } from '@/lib/supabase/server';
import { AuthStatus } from './auth-status';

/**
 * Server component that fetches the initial user data and passes it to the client component
 * Uses getUser() for secure authentication against the Supabase Auth server
 * 
 * @returns A client component with server-fetched authentication data
 */
export async function AuthProvider() {
  // Fetch user data on the server using getUser() for security
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Pass the server-fetched data to the client component
  return <AuthStatus initialUser={user} />;
} 