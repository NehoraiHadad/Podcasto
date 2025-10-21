import { generatePodcastEpisode } from '@/lib/actions/podcast/generate';
import { PodcastScheduleData } from './types';
import { EpisodeCheckerDetailedResult } from '@/components/admin/cron-runner-constants';
import { CreditService } from '@/lib/services/credits/credit-service';
import { getPodcastById } from '@/lib/db/api/podcasts/queries';

/**
 * Represents the result of attempting to generate an episode for a single podcast.
 */
interface GenerationResult {
  podcastId: string;
  podcastTitle: string;
  success: boolean;
  episodeId?: string;
  message: string;
  checkerResult?: EpisodeCheckerDetailedResult;
}

/**
 * Generate episodes for the podcasts that need them
 * 
 * @param podcastsNeedingEpisodes - An array of podcast data objects that require new episodes.
 * @returns A promise that resolves to an array of GenerationResult objects.
 */
export async function generateEpisodesForPodcasts(
  podcastsNeedingEpisodes: PodcastScheduleData[]
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET;
  const creditService = new CreditService();

  for (const podcast of podcastsNeedingEpisodes) {
    let generationResult: GenerationResult = {
      podcastId: podcast.id,
      podcastTitle: podcast.title,
      success: false,
      message: 'An unexpected error occurred during generation.',
    };

    try {
      console.log(`[PODCAST_GENERATOR] Generating episode for podcast: ${podcast.title} (${podcast.id})`);

      // Get podcast details to check owner
      const podcastRecord = await getPodcastById(podcast.id);
      if (!podcastRecord) {
        generationResult.message = `Podcast not found: ${podcast.id}`;
        results.push(generationResult);
        continue;
      }

      // Check if podcast has an owner (user-created) and verify credits
      if (podcastRecord.created_by) {
        console.log(`[PODCAST_GENERATOR] Checking credits for user ${podcastRecord.created_by}`);

        const creditCheck = await creditService.checkCreditsForEpisode(podcastRecord.created_by);

        if (!creditCheck.hasEnough) {
          generationResult.message = `Insufficient credits for podcast "${podcast.title}". Required: ${creditCheck.required}, Available: ${creditCheck.available}`;
          console.warn(`[PODCAST_GENERATOR] ${generationResult.message}`);
          results.push(generationResult);
          continue;
        }

        console.log(`[PODCAST_GENERATOR] Credits verified for user ${podcastRecord.created_by}: ${creditCheck.available} available`);
      } else {
        console.log(`[PODCAST_GENERATOR] Admin podcast - no credit check required`);
      }

      // Calculate date range based on telegram_hours
      const now = new Date();
      const startDate = new Date(now.getTime() - (podcast.telegramHours * 60 * 60 * 1000));
      const dateRange = {
        startDate,
        endDate: now
      };

      console.log(`[PODCAST_GENERATOR] Using date range for ${podcast.title}: ${startDate.toISOString()} to ${now.toISOString()}`);

      // Call the existing server action to generate the episode with date range
      const actionResult = await generatePodcastEpisode(podcast.id, dateRange);

      generationResult = {
        ...generationResult,
        success: actionResult.success,
        episodeId: actionResult.episodeId,
        message: actionResult.success
          ? `Generation started for podcast: ${podcast.title}`
          : `Error: ${actionResult.error}`,
      };

      // Deduct credits if episode was successfully created for a user podcast
      if (actionResult.success && actionResult.episodeId && podcastRecord.created_by) {
        try {
          await creditService.deductCreditsForEpisode(
            podcastRecord.created_by,
            actionResult.episodeId,
            podcast.id
          );
          console.log(`[PODCAST_GENERATOR] Credits deducted for user ${podcastRecord.created_by}`);
          generationResult.message += ' | Credits deducted';
        } catch (creditError) {
          console.error(`[PODCAST_GENERATOR] Error deducting credits:`, creditError);
          generationResult.message += ' | Warning: Credit deduction failed';
        }
      }

      // If the episode was created successfully and we have an ID,
      // immediately call the episode-checker for it
      if (actionResult.success && actionResult.episodeId && cronSecret) {
        try {
          console.log(`[PODCAST_GENERATOR] Immediately checking new episode: ${actionResult.episodeId}`);
          
          // Short wait to potentially allow async processes to initialize
          await new Promise(resolve => setTimeout(resolve, 2000)); 
          
          const checkerUrl = `${baseUrl}/api/cron/episode-checker?episodeId=${actionResult.episodeId}`;
          console.log(`[PODCAST_GENERATOR] Calling checker URL: ${checkerUrl}`);

          const checkerResponse = await fetch(checkerUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${cronSecret}`
            }
          });

          const checkerData = await checkerResponse.json();
          console.log(`[PODCAST_GENERATOR] Checker response for episode ${actionResult.episodeId}:`, checkerData);
          generationResult.checkerResult = checkerData;
          generationResult.message += checkerResponse.ok 
            ? ' | Checker endpoint called successfully.' 
            : ' | Checker endpoint call failed.';

        } catch (checkerError) {
          console.error(`[PODCAST_GENERATOR] Error calling episode checker for ${actionResult.episodeId}:`, checkerError);
          generationResult.message += ' | Error occurred while calling checker.';
          // Keep generationResult.success as true, since generation itself succeeded
        }
      } else if (actionResult.success && actionResult.episodeId && !cronSecret) {
          console.warn(`[PODCAST_GENERATOR] CRON_SECRET not configured. Skipping immediate check for episode ${actionResult.episodeId}`);
          generationResult.message += ' | Skipping immediate check (no CRON_SECRET).';
      }

    } catch (error) {
      console.error(`[PODCAST_GENERATOR] Error generating episode for ${podcast.title}:`, error);
      generationResult.success = false;
      generationResult.message = error instanceof Error ? error.message : 'Unknown generation error';
    }
    
    results.push(generationResult);
  }
  
  return results;
} 