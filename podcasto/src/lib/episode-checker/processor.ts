import { db, episodes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  PENDING_STATUS,
  COMPLETED_STATUS,
  FAILED_STATUS,
  PUBLISHED_STATUS,
  MAX_PENDING_TIME_MS,
  SUMMARY_COMPLETED_STATUS
} from './constants';
import { createPostProcessingService } from '@/lib/services/post-processing'; // Needed for type

// Define the type using InferSelectModel
type Episode = InferSelectModel<typeof episodes>;

// Define the type for the post-processing service instance
type PostProcessingService = ReturnType<typeof createPostProcessingService>;

/**
 * Represents the outcome of processing a single episode.
 */
export interface ProcessingResult {
  status: 'timed_out' | 'completed' | 'processed' | 'published' | 'failed' | 'no_change';
  error?: string;
  episodeId: string;
}

/**
 * Processes a single episode: checks for timeouts, updates status if audio is found,
 * triggers post-processing if applicable and enabled.
 * 
 * @param episode - The episode database object.
 * @param postProcessingService - The instantiated post-processing service, or null.
 * @param postProcessingEnabled - Flag indicating if post-processing is enabled.
 * @returns A promise resolving to a ProcessingResult object.
 */
export async function processSingleEpisode(
  episode: Episode,
  postProcessingService: PostProcessingService | null,
  postProcessingEnabled: boolean
): Promise<ProcessingResult> {
  const now = new Date();
  const timeoutThreshold = new Date(now.getTime() - MAX_PENDING_TIME_MS);
  const baseLogPrefix = `[EPISODE_PROCESSOR:${episode.id}]`;

  try {
    // --- Check PENDING status --- 
    if (episode.status === PENDING_STATUS) {
      // 1. Check for timeout
      if (episode.created_at && new Date(episode.created_at) < timeoutThreshold) {
        console.log(`${baseLogPrefix} Pending timeout threshold reached.`);
        await db.update(episodes)
          .set({ 
            status: FAILED_STATUS,
            description: 'Episode generation timed out'
          })
          .where(eq(episodes.id, episode.id));
        console.log(`${baseLogPrefix} Marked as FAILED.`);
        return { status: 'timed_out', episodeId: episode.id };
      }
      
      // 2. Check if audio URL appeared (became COMPLETED)
      if (episode.audio_url && episode.audio_url !== '') {
        console.log(`${baseLogPrefix} Audio URL found, marking as COMPLETED.`);
        await db.update(episodes)
          .set({ 
            status: COMPLETED_STATUS,
            description: 'Audio generated successfully, awaiting post-processing'
          })
          .where(eq(episodes.id, episode.id));
          
        // Revalidate paths after marking as completed
        if (episode.podcast_id) {
            console.log(`${baseLogPrefix} Revalidating paths after completion.`);
            revalidatePath('/admin/podcasts');
            revalidatePath(`/podcasts/${episode.podcast_id}`);
        }

        // 3. Trigger post-processing immediately if applicable
        if (postProcessingEnabled && postProcessingService && episode.podcast_id) {
          console.log(`${baseLogPrefix} Triggering post-processing for newly completed episode.`);
          try {
            const success = await postProcessingService.processCompletedEpisode(
              episode.podcast_id,
              episode.id
            );
            
            if (success) {
              console.log(`${baseLogPrefix} Post-processing successful, marking as PUBLISHED.`);
              await db.update(episodes)
                .set({ 
                  status: PUBLISHED_STATUS,
                  published_at: new Date()
                })
                .where(eq(episodes.id, episode.id));
              
              // Revalidate paths again after processing
              console.log(`${baseLogPrefix} Revalidating paths after processing.`);
              revalidatePath('/admin/podcasts');
              revalidatePath(`/podcasts/${episode.podcast_id}`);
              return { status: 'published', episodeId: episode.id };
            } else {
              const errorMsg = `Post-processing failed for newly completed episode.`;
              console.error(`${baseLogPrefix} ${errorMsg}`);
              // Still return 'completed' as the primary status change, but include error
              return { status: 'completed', episodeId: episode.id, error: errorMsg }; 
            }
          } catch (error) {
            const errorMsg = `Error during post-processing trigger: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`${baseLogPrefix} ${errorMsg}`, error);
            // Still return 'completed' as the primary status change, but include error
            return { status: 'completed', episodeId: episode.id, error: errorMsg }; 
          }
        } else {
           // Post-processing not enabled/applicable, return completed status
           console.log(`${baseLogPrefix} Marked as COMPLETED (post-processing not applicable/enabled).`);
           return { status: 'completed', episodeId: episode.id };
        }
      }
      
      // If still PENDING but not timed out and no audio URL -> no change yet
      console.log(`${baseLogPrefix} Still PENDING, no significant change.`);
      return { status: 'no_change', episodeId: episode.id };
    }

    // --- Check COMPLETED status --- 
    else if (episode.status === COMPLETED_STATUS) {
      // Trigger post-processing if applicable and not yet processed
      if (postProcessingEnabled && postProcessingService && episode.podcast_id) {
        console.log(`${baseLogPrefix} Already COMPLETED, attempting post-processing.`);
        try {
          const success = await postProcessingService.processCompletedEpisode(
            episode.podcast_id,
            episode.id
          );
          
          if (success) {
            console.log(`${baseLogPrefix} Post-processing successful, marking as PUBLISHED.`);
            await db.update(episodes)
              .set({ 
                status: PUBLISHED_STATUS,
                published_at: new Date()
              })
              .where(eq(episodes.id, episode.id));
            
            // Revalidate paths after processing
            console.log(`${baseLogPrefix} Revalidating paths after processing.`);
            revalidatePath('/admin/podcasts');
            revalidatePath(`/podcasts/${episode.podcast_id}`);
            return { status: 'published', episodeId: episode.id };
          } else {
            const errorMsg = `Post-processing failed for existing completed episode.`;
            console.error(`${baseLogPrefix} ${errorMsg}`);
            // Return 'no_change' as status didn't change from COMPLETED, but include error
            return { status: 'no_change', episodeId: episode.id, error: errorMsg }; 
          }
        } catch (error) {
          const errorMsg = `Error during post-processing: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`${baseLogPrefix} ${errorMsg}`, error);
          // Return 'no_change' as status didn't change from COMPLETED, but include error
          return { status: 'no_change', episodeId: episode.id, error: errorMsg }; 
        }
      } else {
        // Already COMPLETED, but post-processing not enabled/applicable
        console.log(`${baseLogPrefix} Already COMPLETED (post-processing not applicable/enabled).`);
        return { status: 'no_change', episodeId: episode.id };
      }
    }

    // --- Check SUMMARY_COMPLETED status ---
    else if (episode.status === SUMMARY_COMPLETED_STATUS) {
        // Trigger image generation if applicable
        if (postProcessingEnabled && postProcessingService && episode.podcast_id) {
          console.log(`${baseLogPrefix} Status is SUMMARY_COMPLETED, attempting image generation.`);
          try {
            // Directly call image generation as summary is already done
            const success = await postProcessingService.generateEpisodeImage(
              episode.podcast_id,
              episode.id,
              episode.description || '' // Pass only the description (or empty string if null/undefined)
            );
            
            if (success) {
              console.log(`${baseLogPrefix} Image generation successful, marking as PUBLISHED.`);
              
              // Revalidate paths after processing
              console.log(`${baseLogPrefix} Revalidating paths after image generation.`);
              revalidatePath('/admin/podcasts');
              revalidatePath(`/podcasts/${episode.podcast_id}`);
              return { status: 'published', episodeId: episode.id }; // Return 'published' as image is the final step
            } else {
              const errorMsg = `Image generation failed for SUMMARY_COMPLETED episode.`;
              console.error(`${baseLogPrefix} ${errorMsg}`);
              // Return 'no_change' as status didn't change from SUMMARY_COMPLETED, but include error
              return { status: 'no_change', episodeId: episode.id, error: errorMsg }; 
            }
          } catch (error) {
            const errorMsg = `Error during image generation for SUMMARY_COMPLETED episode: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`${baseLogPrefix} ${errorMsg}`, error);
            // Return 'no_change' as status didn't change from SUMMARY_COMPLETED, but include error
            return { status: 'no_change', episodeId: episode.id, error: errorMsg }; 
          }
        } else {
          // SUMMARY_COMPLETED, but post-processing not enabled/applicable
          console.log(`${baseLogPrefix} Status is SUMMARY_COMPLETED (image generation not applicable/enabled).`);
          return { status: 'no_change', episodeId: episode.id };
        }
      }

    // --- Other statuses (FAILED, PROCESSED) --- 
    else {
      // No action needed for episodes already failed or processed
      console.log(`${baseLogPrefix} Status is ${episode.status}, no action needed.`);
      return { status: 'no_change', episodeId: episode.id };
    }

  } catch (error) {
    const errorMsg = `Unexpected error processing episode: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`${baseLogPrefix} ${errorMsg}`, error);
    // Indicate failure for this specific episode processing attempt
    return { status: 'failed', episodeId: episode.id, error: errorMsg }; 
  }
} 