import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

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
  
  const { data: podcasts, error } = await supabase
    .from('podcasts')
    .select('*');
  
  if (error) {
    console.error('Error fetching podcasts:', error);
    return [];
  }
  
  const podcastsWithEpisodeCounts = await Promise.all(
    podcasts.map(async (podcast) => {
      const { count, error: countError } = await supabase
        .from('episodes')
        .select('*', { count: 'exact', head: true })
        .eq('podcast_id', podcast.id);
      
      if (countError) {
        console.error(`Error counting episodes for podcast ${podcast.id}:`, countError);
        return { ...podcast, episodes_count: 0 };
      }
      
      return { ...podcast, episodes_count: count || 0 };
    })
  );
  
  return podcastsWithEpisodeCounts;
}

export async function getPodcastById(id: string): Promise<Podcast | null> {
  const supabase = await createClient();
  
  const { data: podcast, error } = await supabase
    .from('podcasts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching podcast ${id}:`, error);
    return null;
  }
  
  const { count, error: countError } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .eq('podcast_id', id);
  
  if (countError) {
    console.error(`Error counting episodes for podcast ${id}:`, countError);
    return { ...podcast, episodes_count: 0 };
  }
  
  return { ...podcast, episodes_count: count || 0 };
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

