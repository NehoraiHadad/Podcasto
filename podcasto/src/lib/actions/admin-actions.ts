'use server';

import { createActionClient } from '@/lib/supabase/server';
import { cache } from 'react';

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
  const supabase = await createActionClient();
  
  // Get total podcasts count
  const { count: totalPodcasts, error: podcastsError } = await supabase
    .from('podcasts')
    .select('*', { count: 'exact', head: true });
  
  // Get total episodes count
  const { count: totalEpisodes, error: episodesError } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true });
  
  // Get total users count
  const { count: totalUsers, error: usersError } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true });
  
  // Log any errors
  if (podcastsError) console.error('Error fetching podcasts count:', podcastsError);
  if (episodesError) console.error('Error fetching episodes count:', episodesError);
  if (usersError) console.error('Error fetching users count:', usersError);
  
  return {
    totalPodcasts: totalPodcasts || 0,
    totalEpisodes: totalEpisodes || 0,
    totalUsers: totalUsers || 0
  };
}); 