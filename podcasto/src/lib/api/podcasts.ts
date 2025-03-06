'use server';

import { createClient } from '@/lib/supabase/server';

export type Podcast = {
  id: string;
  title: string;
  description: string;
  language: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  episodes_count?: number;
};

export type Episode = {
  id: string;
  podcast_id: string;
  title: string;
  audio_url: string;
  duration?: number;
  created_at: string;
  published_at: string;
  description?: string;
  language?: string;
};

/**
 * Server-side functions
 */

export async function getPodcasts(): Promise<Podcast[]> {
  const supabase = await createClient();
  
  // Use a single query with count to get podcasts and their episode counts
  const { data, error } = await supabase
    .from('podcasts')
    .select(`
      *,
      episodes:episodes(count)
    `);
  
  if (error) {
    console.error('Error fetching podcasts:', error);
    return [];
  }
  
  // Transform the data to match the expected format
  const podcasts = data.map(podcast => ({
    ...podcast,
    episodes_count: podcast.episodes?.[0]?.count || 0,
    episodes: undefined // Remove the episodes property as it's not part of our Podcast type
  })) as Podcast[];
  
  return podcasts;
}

export async function getPodcastById(id: string): Promise<Podcast | null> {
  const supabase = await createClient();
  
  // Use a single query with count to get the podcast and its episode count
  const { data, error } = await supabase
    .from('podcasts')
    .select(`
      *,
      episodes:episodes(count)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching podcast ${id}:`, error);
    return null;
  }
  
  // Transform the data to match the expected format
  const podcast = {
    ...data,
    episodes_count: data.episodes?.[0]?.count || 0,
    episodes: undefined // Remove the episodes property as it's not part of our Podcast type
  } as Podcast;
  
  return podcast;
}

export async function getEpisodesByPodcastId(podcastId: string): Promise<Episode[]> {
  const supabase = await createClient();
  
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('podcast_id', podcastId)
    .order('published_at', { ascending: false });
  
  if (error) {
    console.error(`Error fetching episodes for podcast ${podcastId}:`, error);
    return [];
  }
  
  return episodes || [];
}

