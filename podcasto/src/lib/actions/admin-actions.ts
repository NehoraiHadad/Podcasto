'use server';

import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './user-actions';
import { podcastsApi, episodesApi, userRolesApi } from '@/lib/db/api';
import { revalidatePath } from 'next/cache';
import { CronResult } from "@/components/admin/cron-runner";

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

/**
 * Manually triggers the CRON episode checker process
 * This is a server action that requires admin permissions
 */
export async function runEpisodeChecker(): Promise<{
  success: boolean;
  message: string;
  details?: {
    results?: CronResult;
    timestamp?: string;
  };
}> {
  // Ensure the user is an admin
  await checkIsAdmin({ redirectOnFailure: true });
  
  try {
    // Construct the API URL for the episode checker
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const apiUrl = new URL('/api/cron/episode-checker', baseUrl).toString();
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      return {
        success: false,
        message: 'CRON_SECRET environment variable is not configured'
      };
    }
    
    console.log('[MANUAL_CRON] Triggering episode checker at:', apiUrl);
    
    // Call the episode checker API with the CRON secret
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('[MANUAL_CRON] Episode checker completed with result:', result);
    
    // Revalidate admin pages
    revalidatePath('/admin/episodes');
    revalidatePath('/admin/podcasts');
    
    return {
      success: true,
      message: 'Successfully ran episode checker',
      details: result
    };
  } catch (error) {
    console.error('[MANUAL_CRON] Error running episode checker:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
} 