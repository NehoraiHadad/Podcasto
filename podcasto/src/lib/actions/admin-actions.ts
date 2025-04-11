'use server';

import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './user-actions';
import { podcastsApi, episodesApi, userRolesApi } from '@/lib/db/api';
import { revalidatePath } from 'next/cache';

/**
 * Interface for admin dashboard statistics
 */
export interface AdminDashboardStats {
  totalPodcasts: number;
  totalEpisodes: number;
  totalUsers: number;
}

// Generalized result type for CRON operations
export interface CronOperationResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
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
 * Helper function to call a CRON endpoint with proper authentication
 * @param endpoint The API endpoint to call (e.g., '/api/cron/episode-checker')
 * @param logPrefix Prefix for console logs
 * @returns Result of the CRON operation
 */
async function callCronEndpoint(endpoint: string, logPrefix: string): Promise<CronOperationResult> {
  // Ensure the user is an admin
  await checkIsAdmin({ redirectOnFailure: true });
  
  try {
    // Construct the API URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const apiUrl = new URL(endpoint, baseUrl).toString();
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      return {
        success: false,
        message: 'CRON_SECRET environment variable is not configured'
      };
    }
    
    console.log(`[${logPrefix}] Triggering endpoint at: ${apiUrl}`);
    
    // Call the API with the CRON secret
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
    
    console.log(`[${logPrefix}] Endpoint completed with result:`, result);
    
    // Revalidate admin pages
    revalidatePath('/admin/episodes');
    revalidatePath('/admin/podcasts');
    
    return {
      success: true,
      message: `Successfully ran ${logPrefix.toLowerCase()}`,
      details: result
    };
  } catch (error) {
    console.error(`[${logPrefix}] Error running endpoint:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Manually triggers the CRON episode checker process
 * This is a server action that requires admin permissions
 */
export async function runEpisodeChecker(): Promise<CronOperationResult> {
  return callCronEndpoint('/api/cron/episode-checker', 'MANUAL_EPISODE_CHECKER');
}

/**
 * Manually triggers the podcast scheduler process
 * This is a server action that requires admin permissions
 */
export async function runPodcastScheduler(): Promise<CronOperationResult> {
  return callCronEndpoint('/api/cron/podcast-scheduler', 'MANUAL_PODCAST_SCHEDULER');
}

/**
 * Manually triggers the main CRON job which runs all scheduled tasks
 * This simulates what happens when the external CRON scheduler runs
 */
export async function runAllCronJobs(): Promise<CronOperationResult> {
  return callCronEndpoint('/api/cron/start-jobs', 'MANUAL_FULL_CRON');
} 