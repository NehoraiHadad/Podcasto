import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { PodcastScheduleData, PodcastSqlRow } from './types';

/**
 * Find podcasts that need new episodes based on their frequency settings
 * and last episode creation date
 */
export async function findPodcastsNeedingEpisodes(): Promise<PodcastScheduleData[]> {
  try {
    // Always use the current date
    const now = new Date();
    
    console.log(`[PODCAST_FINDER] Using current date for scheduling: ${now.toISOString()}`);
    
    // Find all active podcasts with their configs and latest episode
    const result = await db.execute(sql`
      WITH latest_episodes AS (
        SELECT 
          podcast_id,
          MAX(created_at) as latest_episode_date
        FROM episodes
        GROUP BY podcast_id
      )
      
      SELECT 
        p.id as podcast_id,
        p.title as podcast_title,
        pc.episode_frequency as frequency,
        COALESCE(le.latest_episode_date, '2000-01-01') as latest_episode_date
      FROM podcasts p
      LEFT JOIN podcast_configs pc ON p.id = pc.podcast_id
      LEFT JOIN latest_episodes le ON p.id = le.podcast_id
      WHERE 
        pc.episode_frequency IS NOT NULL AND 
        pc.episode_frequency > 0
    `);
    
    // Log the raw result for debugging
    console.log(`[PODCAST_FINDER] Raw SQL result:`, JSON.stringify(result, null, 2));
    
    // Handle the actual result format - direct array of rows
    let rows: PodcastSqlRow[] = [];
    
    interface SqlResult {
      rows: PodcastSqlRow[];
    }

    if (Array.isArray(result)) {
      // Direct array of rows
      rows = result as unknown as PodcastSqlRow[];
    } else if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as SqlResult).rows)) {
      // Object with rows property
      rows = (result as SqlResult).rows;
    } else {
      console.error('[PODCAST_FINDER] Unexpected SQL result format:', result);
      return [];
    }
    
    console.log(`[PODCAST_FINDER] SQL query returned ${rows.length} rows`);
    
    // Convert the SQL result to a usable format
    const podcastData = rows.map((row: PodcastSqlRow) => {
      // Convert date strings to Date objects consistently
      const latestEpisodeDate = new Date(row.latest_episode_date);
      
      return {
        id: row.podcast_id,
        title: row.podcast_title,
        frequency: parseInt(String(row.frequency), 10),
        latestEpisodeDate
      };
    });
    
    console.log(`[PODCAST_FINDER] Found ${podcastData.length} podcasts with frequency settings`);
    
    // Force create episodes for testing if needed
    const forceCreateForTesting = process.env.FORCE_CREATE_EPISODES === 'true';
    
    // Filter podcasts that need new episodes
    const needEpisodes = podcastData.filter((podcast: PodcastScheduleData) => {
      // Skip podcasts with missing data
      if (!podcast.id || !podcast.frequency) {
        console.log(`[PODCAST_FINDER] Skipping podcast with incomplete data:`, podcast);
        return false;
      }
      
      // Check if we're forcing episode creation for testing
      if (forceCreateForTesting) {
        console.log(`[PODCAST_FINDER] Forcing episode creation for podcast: ${podcast.title}`);
        return true;
      }
      
      // Calculate the next episode date based on frequency (in days)
      const nextEpisodeDate = new Date(podcast.latestEpisodeDate);
      nextEpisodeDate.setDate(nextEpisodeDate.getDate() + podcast.frequency);
      
      // If next episode date is today or earlier, this podcast needs a new episode
      const needsEpisode = nextEpisodeDate <= now;
      
      console.log(`[PODCAST_FINDER] Podcast ${podcast.title}:`);
      console.log(`  - Last episode date: ${podcast.latestEpisodeDate.toISOString()}`);
      console.log(`  - Frequency: ${podcast.frequency} days`);
      console.log(`  - Next episode due: ${nextEpisodeDate.toISOString()}`);
      console.log(`  - Current date: ${now.toISOString()}`);
      console.log(`  - Needs new episode: ${needsEpisode}`);
      
      return needsEpisode;
    });
    
    console.log(`[PODCAST_FINDER] Found ${needEpisodes.length} podcasts needing new episodes`);
    return needEpisodes;
  } catch (error) {
    console.error('[PODCAST_FINDER] Error finding podcasts needing episodes:', error);
    // Re-throw or handle as appropriate for the module. Returning empty array for now.
    return []; 
  }
} 