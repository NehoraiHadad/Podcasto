'use server';

import { createActionClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * Server action to check if the current user has admin role
 * This is cached to avoid multiple database calls for the same user
 * 
 * @returns Boolean indicating if the user has admin role
 */
export const checkIsAdmin = cache(async (): Promise<boolean> => {
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
 * Server action to require admin role for a route
 * Redirects to unauthorized page if user is not an admin
 * 
 * @returns The user object if the user is an admin
 */
export const requireAdmin = async () => {
  const supabase = await createActionClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/login?callbackUrl=/admin');
  }
  
  // Check if user has admin role
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (rolesError || !userRoles || userRoles.role !== 'admin') {
    redirect('/unauthorized');
  }
  
  return user;
};

/**
 * Server action to get the current user's role
 * 
 * @returns The user's role or null if not found
 */
export const getUserRole = async (): Promise<string | null> => {
  const supabase = await createActionClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  // Get user role
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (rolesError || !userRoles) {
    return null;
  }
  
  return userRoles.role;
}; 