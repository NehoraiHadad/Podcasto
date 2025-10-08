import { db } from '../index';
import { podcasts, episodes } from '../schema';
import { eq, and, desc } from 'drizzle-orm';
import * as dbUtils from '../utils';

// Types
export type Podcast = {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  is_paused?: boolean;
  created_at: Date | null;
  updated_at: Date | null;
  episodes_count?: number;
  status?: string;
  timestamp?: string;
  
  // Extended configuration fields from podcast_configs
  content_source?: {
    type: 'telegram' | 'urls';
    config?: {
      telegramChannel?: string;
      telegramHours?: number;
      urls?: string[];
    }
  };
  
  // Basic settings
  creator?: string;
  podcast_name?: string;
  output_language?: 'english' | 'hebrew';
  slogan?: string;
  creativity_level?: number;
  
  // Advanced settings
  is_long_podcast?: boolean;
  discussion_rounds?: number;
  min_chars_per_round?: number;
  episode_frequency?: number;
  
  // Style and roles
  conversation_style?: string;
  speaker1_role?: string;
  speaker2_role?: string;
  
  // Mixing techniques
  mixing_techniques?: string[];
  additional_instructions?: string;
};

export type NewPodcast = typeof podcasts.$inferInsert;

/**
 * Returns all episodes for a specific podcast
 */
export async function getPodcastEpisodes(podcastId: string): Promise<typeof episodes.$inferSelect[]> {
  return await dbUtils.findBy(episodes, eq(episodes.podcast_id, podcastId));
}

/**
 * Returns only published episodes for a specific podcast (for user-facing pages)
 */
export async function getPublishedPodcastEpisodes(podcastId: string): Promise<typeof episodes.$inferSelect[]> {
  return await db.select()
    .from(episodes)
    .where(and(
      eq(episodes.podcast_id, podcastId),
      eq(episodes.status, 'published')
    ))
    .orderBy(desc(episodes.published_at)) as typeof episodes.$inferSelect[];
}

/**
 * Returns all podcasts with episode counts
 */
export async function getAllPodcasts(): Promise<Podcast[]> {
  const results = await dbUtils.getAll<typeof podcasts.$inferSelect>(podcasts);
  
  return await Promise.all(results.map(async (podcast) => {
    const podcastEpisodes = await getPodcastEpisodes(podcast.id);
    const publishedEpisodes = await getPublishedPodcastEpisodes(podcast.id);
    
    // Default podcast data - use published episodes count for user-facing display
    const podcastData: Podcast = {
      ...podcast,
      episodes_count: publishedEpisodes.length,
      status: undefined,
      timestamp: undefined
    };
    
    // Find the latest episode with status information
    if (podcastEpisodes.length > 0) {
      // Sort episodes by creation date, newest first
      const sortedEpisodes = [...podcastEpisodes].sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      
      // Get the newest episode, regardless of status
      const latestEpisode = sortedEpisodes[0];
      
      // Only include status information if the episode's status is 'pending'
      // or if the episode was created recently (within last 24 hours)
      if (latestEpisode.status) {
        const isRecent = latestEpisode.created_at && 
          (Date.now() - new Date(latestEpisode.created_at).getTime() < 24 * 60 * 60 * 1000);
        
        if (latestEpisode.status === 'pending' || isRecent) {
          podcastData.status = latestEpisode.status;
          
          // Get timestamp from metadata if available
          if (latestEpisode.metadata) {
            try {
              const metadata = JSON.parse(latestEpisode.metadata);
              podcastData.timestamp = metadata.generation_timestamp;
            } catch (err) {
              console.error('Error parsing episode metadata:', err);
            }
          }
        }
      }
    }
    
    return podcastData;
  }));
}

/**
 * Returns a podcast by ID with episode count and configuration
 */
export async function getPodcastById(id: string): Promise<Podcast | null> {
  const podcast = await dbUtils.findById<typeof podcasts.$inferSelect>(podcasts, podcasts.id, id);
  
  if (!podcast) {
    return null;
  }
  
  const publishedEpisodes = await getPublishedPodcastEpisodes(podcast.id);
  
  // Get podcast config if available
  const podcastConfig = await import('./podcast-configs').then(
    module => module.getPodcastConfigByPodcastId(id)
  );
  
  // Base podcast object - use published episodes count for user-facing display
  const podcastWithCount: Podcast = {
    ...podcast,
    episodes_count: publishedEpisodes.length
  };
  
  // Add configuration data if available
  if (podcastConfig) {
    // Map config fields to podcast object
    podcastWithCount.content_source = {
      type: podcastConfig.content_source as 'telegram' | 'urls',
      config: {
        telegramChannel: podcastConfig.telegram_channel || '',
        telegramHours: podcastConfig.telegram_hours || 24,
        urls: podcastConfig.urls || []
      }
    };
    
    // Basic settings
    podcastWithCount.creator = podcastConfig.creator;
    podcastWithCount.podcast_name = podcastConfig.podcast_name;
    podcastWithCount.output_language = podcastConfig.language as 'english' | 'hebrew';
    podcastWithCount.slogan = podcastConfig.slogan || '';
    podcastWithCount.creativity_level = podcastConfig.creativity_level ? podcastConfig.creativity_level / 100 : 0.7;
    
    // Advanced settings
    podcastWithCount.is_long_podcast = podcastConfig.is_long_podcast;
    podcastWithCount.discussion_rounds = podcastConfig.discussion_rounds;
    podcastWithCount.min_chars_per_round = podcastConfig.min_chars_per_round;
    podcastWithCount.episode_frequency = podcastConfig.episode_frequency ?? undefined;
    
    // Style and roles
    podcastWithCount.conversation_style = podcastConfig.conversation_style ?? undefined;
    podcastWithCount.speaker1_role = podcastConfig.speaker1_role ?? undefined;
    podcastWithCount.speaker2_role = podcastConfig.speaker2_role ?? undefined;
    
    // Mixing techniques
    podcastWithCount.mixing_techniques = podcastConfig.mixing_techniques ?? undefined;
    podcastWithCount.additional_instructions = podcastConfig.additional_instructions ?? undefined;
  }
  
  return podcastWithCount;
}

/**
 * Returns paginated podcasts
 */
export async function getPodcastsPaginated(page: number = 1, pageSize: number = 10): Promise<Podcast[]> {
  const results = await dbUtils.getPaginated<typeof podcasts.$inferSelect>(podcasts, page, pageSize);
  
  return await Promise.all(results.map(async (podcast) => {
    const publishedEpisodes = await getPublishedPodcastEpisodes(podcast.id);
    return {
      ...podcast,
      episodes_count: publishedEpisodes.length
    };
  }));
}

/**
 * Creates a new podcast
 */
export async function createPodcast(data: NewPodcast): Promise<Podcast> {
  return await dbUtils.create<Podcast, NewPodcast>(podcasts, data);
}

/**
 * Updates an existing podcast
 */
export async function updatePodcast(id: string, data: Partial<NewPodcast>): Promise<Podcast | null> {
  const podcast = await dbUtils.updateById<typeof podcasts.$inferSelect, NewPodcast>(podcasts, podcasts.id, id, data);
  if (!podcast) {
    return null;
  }
  
  const publishedEpisodes = await getPublishedPodcastEpisodes(podcast.id);
  return {
    ...podcast,
    episodes_count: publishedEpisodes.length
  };
}

/**
 * Deletes a podcast
 */
export async function deletePodcast(id: string): Promise<boolean> {
  return await dbUtils.deleteById(podcasts, podcasts.id, id);
}

/**
 * Checks if a podcast exists by title
 */
export async function podcastExistsByTitle(title: string): Promise<boolean> {
  return await dbUtils.exists(podcasts, eq(podcasts.title, title));
}

/**
 * Returns the total count of podcasts
 */
export async function getPodcastCount(): Promise<number> {
  return await dbUtils.count(podcasts);
} 