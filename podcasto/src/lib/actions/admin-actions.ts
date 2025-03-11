'use server';

import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './user-actions';
import { podcastsApi, episodesApi, userRolesApi } from '@/lib/db/api';

/**
 * Interface for admin dashboard statistics
 */
export interface AdminDashboardStats {
  totalPodcasts: number;
  totalEpisodes: number;
  totalUsers: number;
}

/**
 * Fetches statistics for the admin dashboard
 * This is cached to avoid multiple database calls
 * 
 * @returns Object containing dashboard statistics
 */
export const getAdminDashboardStats = cache(async (): Promise<AdminDashboardStats> => {
  try {
    // Get counts using Drizzle APIs
    const totalPodcasts = await podcastsApi.getPodcastCount();
    const totalEpisodes = await episodesApi.getEpisodeCount();
    const totalUsers = await userRolesApi.getUserRoleCount();
    
    return {
      totalPodcasts,
      totalEpisodes,
      totalUsers
    };
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return {
      totalPodcasts: 0,
      totalEpisodes: 0,
      totalUsers: 0
    };
  }
});

/**
 * Server action to check if the current user has admin role
 * This is cached to avoid multiple database calls for the same user
 * 
 * @param redirectOnFailure If true, redirects to unauthorized page if not admin
 * @param redirectTo Optional path to redirect to after login if not authenticated
 * @returns The user object if admin, or boolean if not redirecting
 */
export const checkIsAdmin = cache(async ({ 
  redirectOnFailure = false, 
  redirectTo = '/admin' 
}: { 
  redirectOnFailure?: boolean, 
  redirectTo?: string 
} = {}) => {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    if (redirectOnFailure) {
      redirect(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`);
    }
    return false;
  }
  
  // Check if user has admin role using Drizzle API
  const isAdmin = await userRolesApi.isUserAdmin(user.id);
  
  if (!isAdmin && redirectOnFailure) {
    redirect('/unauthorized');
  }
  
  return redirectOnFailure ? user : isAdmin;
});

/**
 * Server action to require admin role for a route
 * Redirects to unauthorized page if user is not an admin
 * 
 * @returns The user object if the user is an admin
 */
export const requireAdmin = async () => {
  return checkIsAdmin({ redirectOnFailure: true });
};

/**
 * Server action to get the current user's role
 * 
 * @returns The user's role or null if not found
 */
export const getUserRole = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  
  if (!user) return null;
  
  // Get user role using Drizzle API
  const userRoles = await userRolesApi.getUserRoles(user.id);
  
  if (!userRoles || userRoles.length === 0) {
    return null;
  }
  
  return userRoles[0].role;
}; 