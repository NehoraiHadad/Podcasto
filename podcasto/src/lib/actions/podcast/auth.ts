'use server';

import { createClient } from '@/lib/supabase/server';
import { userRolesApi } from '@/lib/db/api';

/**
 * Helper function to check admin permissions and return the user
 * @returns The authenticated admin user if successful
 * @throws Error if authentication fails or user is not an admin
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  const isAdmin = await userRolesApi.isUserAdmin(user.id);
  
  if (!isAdmin) {
    throw new Error('Admin permissions required');
  }
  
  return user;
}

/**
 * Helper function to check if the current user is authenticated
 * @returns The authenticated user if successful
 * @throws Error if authentication fails
 */
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
} 