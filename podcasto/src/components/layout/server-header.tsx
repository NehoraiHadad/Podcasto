import { createActionClient } from '@/lib/supabase/server';
import { ClientHeader } from './client-header';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Server component wrapper for the header
 * This component fetches the user and admin status on the server
 * and passes it to the client header component
 */
export async function ServerHeader() {
  // Opt out of caching for this component
  noStore();
  
  const supabase = await createActionClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  let isAdmin = false;
  
  if (user && !error) {
    // Check if user has admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    isAdmin = !rolesError && userRoles?.role === 'admin';
  }
  
  // Pass the admin status and user to the client component
  return <ClientHeader initialIsAdmin={isAdmin} initialUser={user} />;
} 