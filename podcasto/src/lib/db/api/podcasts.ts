import { podcasts, episodes } from '../schema';
import { eq } from 'drizzle-orm';
import * as dbUtils from '../utils';

// Types
export type Podcast = {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  episodes_count?: number;
  status?: string;
  timestamp?: string;
};

export type NewPodcast = typeof podcasts.$inferInsert;

/**
 * Returns all episodes for a specific podcast
 */
export async function getPodcastEpisodes(podcastId: string): Promise<typeof episodes.$inferSelect[]> {
  return await dbUtils.findBy(episodes, eq(episodes.podcast_id, podcastId));
}

/**
 * Returns all podcasts with episode counts
 */
export async function getAllPodcasts(): Promise<Podcast[]> {
  const results = await dbUtils.getAll<typeof podcasts.$inferSelect>(podcasts);
  
  return await Promise.all(results.map(async (podcast) => {
    const podcastEpisodes = await getPodcastEpisodes(podcast.id);
    
    // Default podcast data
    const podcastData: Podcast = {
      ...podcast,
      episodes_count: podcastEpisodes.length,
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
 * Returns a podcast by ID with episode count
 */
export async function getPodcastById(id: string): Promise<Podcast | null> {
  const podcast = await dbUtils.findById<typeof podcasts.$inferSelect>(podcasts, podcasts.id, id);
  
  if (!podcast) {
    return null;
  }
  
  const podcastEpisodes = await getPodcastEpisodes(podcast.id);
  return {
    ...podcast,
    episodes_count: podcastEpisodes.length
  };
}

/**
 * Returns paginated podcasts
 */
export async function getPodcastsPaginated(page: number = 1, pageSize: number = 10): Promise<Podcast[]> {
  const results = await dbUtils.getPaginated<typeof podcasts.$inferSelect>(podcasts, page, pageSize);
  
  return await Promise.all(results.map(async (podcast) => {
    const podcastEpisodes = await getPodcastEpisodes(podcast.id);
    return {
      ...podcast,
      episodes_count: podcastEpisodes.length
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
  
  const podcastEpisodes = await getPodcastEpisodes(podcast.id);
  return {
    ...podcast,
    episodes_count: podcastEpisodes.length
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