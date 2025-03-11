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
    return {
      ...podcast,
      episodes_count: podcastEpisodes.length
    };
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
  const podcast = await dbUtils.create<typeof podcasts.$inferSelect, NewPodcast>(podcasts, data);
  return {
    ...podcast,
    episodes_count: 0
  };
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