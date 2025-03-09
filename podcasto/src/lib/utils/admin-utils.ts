/**
 * Server-side utilities for admin functionality
 * These functions should only be used in server components or server actions
 */

import { createActionClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * Checks if the current user has admin role
 * This is a server-side function that can be used in server components
 * It's cached to prevent redundant database queries
 * 
 * @returns Boolean indicating if the user is an admin
 */
export const isUserAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createActionClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return false;
  }
  
  // Check if user has admin role
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (rolesError || !userRoles) {
    return false;
  }
  
  return userRoles.role === 'admin';
});

/**
 * Gets the current user's admin status and user data
 * This is useful for components that need both the admin status and user data
 * 
 * @returns Object with isAdmin flag and user data
 */
export const getAdminStatus = cache(async () => {
  const supabase = await createActionClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { isAdmin: false, user: null };
  }
  
  // Check if user has admin role
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (rolesError || !userRoles) {
    return { isAdmin: false, user };
  }
  
  return { 
    isAdmin: userRoles.role === 'admin',
    user
  };
});

/**
 * Server component wrapper that redirects if the user is not an admin
 * This can be used as an alternative to the requireAdmin function
 * when you need to perform additional operations
 * 
 * @param redirectUrl URL to redirect to if user is not an admin
 * @returns The admin status and user data if the user is an admin
 */
export const verifyAdminAccess = async (redirectUrl = '/unauthorized') => {
  const { isAdmin, user } = await getAdminStatus();
  
  if (!isAdmin) {
    redirect(redirectUrl);
  }
  
  return { isAdmin, user };
}; 