import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { extractRowsFromSqlResult } from '@/lib/db/utils/sql-result-handler';
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
        COALESCE(le.latest_episode_date, '2000-01-01') as latest_episode_date,
        COALESCE(pc.telegram_hours, 24) as telegram_hours
      FROM podcasts p
      LEFT JOIN podcast_configs pc ON p.id = pc.podcast_id
      LEFT JOIN latest_episodes le ON p.id = le.podcast_id
      WHERE
        pc.episode_frequency IS NOT NULL AND
        pc.episode_frequency > 0 AND
        COALESCE(p.is_paused, false) = false
    `);
    
    // Log the raw result for debugging
    console.log(`[PODCAST_FINDER] Raw SQL result:`, JSON.stringify(result, null, 2));

    // Extract rows using utility function
    const rows = extractRowsFromSqlResult<PodcastSqlRow>(result, 'PODCAST_FINDER');

    console.log(`[PODCAST_FINDER] SQL query returned ${rows.length} rows`);
    
    // Convert the SQL result to a usable format
    const podcastData = rows.map((row: PodcastSqlRow) => {
      // Convert date strings to Date objects consistently
      const latestEpisodeDate = new Date(row.latest_episode_date);

      return {
        id: row.podcast_id,
        title: row.podcast_title,
        frequency: parseInt(String(row.frequency), 10),
        latestEpisodeDate,
        telegramHours: row.telegram_hours
      };
    });
    
    console.log(`[PODCAST_FINDER] Found ${podcastData.length} active podcasts with frequency settings (paused podcasts excluded)`);

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
      
      // Reset to start of day for accurate date comparison (ignore time)
      const latestDate = new Date(podcast.latestEpisodeDate);
      latestDate.setHours(0, 0, 0, 0);

      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Calculate full days since last episode
      const daysSinceLastEpisode = Math.floor(
        (today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if enough days have passed based on frequency
      const needsEpisode = daysSinceLastEpisode >= podcast.frequency;

      console.log(`[PODCAST_FINDER] Podcast ${podcast.title}:`);
      console.log(`  - Last episode date: ${podcast.latestEpisodeDate.toISOString()}`);
      console.log(`  - Last episode date (day): ${latestDate.toISOString()}`);
      console.log(`  - Frequency: ${podcast.frequency} days`);
      console.log(`  - Days since last episode: ${daysSinceLastEpisode}`);
      console.log(`  - Current date: ${now.toISOString()}`);
      console.log(`  - Current date (day): ${today.toISOString()}`);
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