'use server';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getEpisodeById } from '@/lib/db/api/episodes';
import { episodesApi } from '@/lib/db/api';
import { getPodcastConfigByPodcastId } from '@/lib/db/api/podcast-configs';
import { requireAdmin } from '@/lib/auth';
import { parseS3Uri, verifyS3ObjectExists, createS3Client } from '@/lib/utils/s3-utils';
import { errorToString, logError } from '@/lib/utils/error-utils';
import { revalidateEpisodePaths } from '@/lib/utils/revalidation-utils';
import { EPISODE_CONSTANTS } from '@/lib/constants/episode-constants';

/**
 * Generate a presigned URL for an episode's audio file
 */
export async function getEpisodeAudioUrl(episodeId: string): Promise<{ url: string; error?: string }> {
  try {
    console.log('=== Start getEpisodeAudioUrl ===');
    console.log('Episode ID:', episodeId);
    
    // Fetch episode data
    const episode = await getEpisodeById(episodeId);
    
    if (!episode) {
      console.error('Episode not found:', episodeId);
      return { 
        url: '', 
        error: 'Episode not found' 
      };
    }

    const audioUrl = episode.audio_url;
    console.log('Original audio URL:', audioUrl);
    
    // Validate audio URL exists
    if (!audioUrl) {
      console.error('Episode has no audio URL');
      return {
        url: '',
        error: 'Episode has no audio URL'
      };
    }
    
    // If URL is already in HTTPS format, return it directly
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      console.log('Returning direct HTTPS URL:', audioUrl);
      return { url: audioUrl };
    }
    
    // Parse S3 URI - note we need to await this now as it's async
    const s3UriParts = await parseS3Uri(audioUrl);
    
    if (!s3UriParts) {
      console.error('Invalid S3 URI format or parsing failed:', audioUrl);
      return { 
        url: '', 
        error: `Invalid S3 URI format: ${audioUrl}` 
      };
    }
    
    const { bucket, key } = s3UriParts;
    
    // Double check that we have both bucket and key
    if (!bucket || !key) {
      console.error('S3 URI parsed but missing bucket or key:', { bucket, key, audioUrl });
      return {
        url: '',
        error: 'S3 URI parsed but missing bucket or key'
      };
    }
    
    console.log('Parsed S3 URI - Bucket:', bucket, 'Key:', key);
    
    // Create S3 client - note we need to await this now as it's async
    const { client: s3Client, error: clientError } = await createS3Client();
    
    if (!s3Client) {
      console.error('Failed to create S3 client:', clientError);
      return {
        url: '',
        error: clientError || 'Unknown error creating S3 client'
      };
    }
    
    // Verify the object exists in S3
    console.log('Verifying object exists in S3...');
    const objectExists = await verifyS3ObjectExists(s3Client, bucket, key);
    if (!objectExists) {
      console.error('S3 object does not exist or is not accessible');
      return {
        url: '',
        error: `S3 object not found or inaccessible in bucket: ${bucket}, key: ${key}`
      };
    }
    
    // Create command to get the object
    console.log('Creating GetObjectCommand...');
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    // Generate a presigned URL that's valid for 1 hour (3600 seconds)
    console.log('Generating presigned URL...');
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: EPISODE_CONSTANTS.PRESIGNED_URL_EXPIRY_SECONDS
    });
    console.log('Generated presigned URL:', presignedUrl);
    
    console.log('=== End getEpisodeAudioUrl - Success ===');
    return { url: presignedUrl };
  } catch (error) {
    logError('getEpisodeAudioUrl', error);
    return {
      url: '',
      error: `Failed to generate audio URL: ${errorToString(error)}`
    };
  }
}

export type RegenerateMode = 'full' | 'script+audio' | 'audio-only';

/**
 * Regenerates the audio for an episode with smart stage selection
 * This is a server action that requires admin permissions
 */
export async function regenerateEpisodeAudio(
  episodeId: string,
  mode: RegenerateMode = 'audio-only'
): Promise<{ success: boolean; error?: string }> {
  // Ensure the user is an admin
  await requireAdmin();

  try {
    console.log(`[REGENERATE_AUDIO] Starting regeneration for episode ${episodeId}, mode: ${mode}`);

    // Get the episode
    const episode = await episodesApi.getEpisodeById(episodeId);

    if (!episode || !episode.podcast_id) {
      return {
        success: false,
        error: 'Episode not found or missing podcast ID'
      };
    }

    // Get podcast config
    const podcastConfig = await getPodcastConfigByPodcastId(episode.podcast_id);

    if (!podcastConfig) {
      return {
        success: false,
        error: 'Podcast configuration not found'
      };
    }

    // Reset episode status to pending
    await episodesApi.updateEpisode(episodeId, {
      status: 'pending'
    });

    console.log(`[REGENERATE_AUDIO] Reset episode ${episodeId} status to pending`);

    // Import utilities
    const { triggerTelegramLambda, triggerScriptLambda, triggerAudioLambda } = await import('@/lib/aws/lambda-triggers');
    const { createS3Service } = await import('@/lib/services/s3-service');

    // Execute based on mode
    if (mode === 'full') {
      console.log(`[REGENERATE_AUDIO] Full regeneration: deleting all S3 files`);

      // Delete ALL old S3 files using existing S3 service
      const s3Service = createS3Service();
      const deleteResult = await s3Service.deleteAllEpisodeFiles(episode.podcast_id, episodeId);

      if (!deleteResult.success) {
        console.warn(`[REGENERATE_AUDIO] Failed to delete S3 files: ${deleteResult.error}`);
      } else {
        console.log(`[REGENERATE_AUDIO] Deleted ${deleteResult.deletedCount} files from S3`);
      }

      // Trigger Telegram Lambda to fetch fresh data
      const triggerResult = await triggerTelegramLambda(
        episodeId,
        episode.podcast_id,
        episode.content_start_date ? new Date(episode.content_start_date).toISOString() : undefined,
        episode.content_end_date ? new Date(episode.content_end_date).toISOString() : undefined
      );

      if (!triggerResult.success) {
        return {
          success: false,
          error: triggerResult.error || 'Failed to trigger Telegram Lambda'
        };
      }

      console.log(`[REGENERATE_AUDIO] Successfully triggered Telegram Lambda`);
    } else if (mode === 'script+audio') {
      console.log(`[REGENERATE_AUDIO] Script+Audio regeneration: deleting script and audio files`);

      // Delete script and audio files, keep Telegram data
      const s3Service = createS3Service();
      const { files, error: listError } = await s3Service.listEpisodeFiles(episode.podcast_id, episodeId);

      if (listError) {
        console.warn(`[REGENERATE_AUDIO] Failed to list S3 files: ${listError}`);
      } else {
        // Filter to script and audio files only (exclude telegram data)
        const filesToDelete = files.filter(file => {
          const fileName = file.name.toLowerCase();
          return fileName.includes('script') ||
                 fileName.includes('audio') ||
                 fileName.endsWith('.mp3') ||
                 fileName.endsWith('.wav');
        });

        let deletedCount = 0;
        for (const file of filesToDelete) {
          const result = await s3Service.deleteFile(file.key, episodeId, episode.podcast_id);
          if (result.success) deletedCount++;
        }

        console.log(`[REGENERATE_AUDIO] Deleted ${deletedCount} script and audio files from S3`);
      }

      // Get Telegram data URL from episode metadata
      const metadata = typeof episode.metadata === 'string' ? JSON.parse(episode.metadata) : episode.metadata;
      const telegramDataUrl = metadata?.telegram_data_url || metadata?.s3_key;

      if (!telegramDataUrl) {
        return {
          success: false,
          error: 'No Telegram data URL found in episode metadata. Use "Full Regeneration" instead.'
        };
      }

      // Trigger Script Preprocessor Lambda
      const triggerResult = await triggerScriptLambda(
        episodeId,
        episode.podcast_id,
        podcastConfig.id,
        telegramDataUrl
      );

      if (!triggerResult.success) {
        return {
          success: false,
          error: triggerResult.error || 'Failed to trigger Script Lambda'
        };
      }

      console.log(`[REGENERATE_AUDIO] Successfully triggered Script Lambda`);
    } else {
      // audio-only
      console.log(`[REGENERATE_AUDIO] Audio-only regeneration: deleting only audio files`);

      // Delete only audio files, keep scripts and Telegram data
      const s3Service = createS3Service();
      const { files, error: listError } = await s3Service.listEpisodeFiles(episode.podcast_id, episodeId);

      if (listError) {
        console.warn(`[REGENERATE_AUDIO] Failed to list S3 files: ${listError}`);
      } else {
        // Filter to audio files only
        const filesToDelete = files.filter(file => {
          const fileName = file.name.toLowerCase();
          return fileName.includes('audio') ||
                 fileName.endsWith('.mp3') ||
                 fileName.endsWith('.wav');
        });

        let deletedCount = 0;
        for (const file of filesToDelete) {
          const result = await s3Service.deleteFile(file.key, episodeId, episode.podcast_id);
          if (result.success) deletedCount++;
        }

        console.log(`[REGENERATE_AUDIO] Deleted ${deletedCount} audio files from S3`);
      }

      // Get script URL from episode metadata or database
      const scriptUrl = episode.script_url;

      if (!scriptUrl) {
        return {
          success: false,
          error: 'No script URL found for this episode. Use "Script + Audio" or "Full Regeneration" instead.'
        };
      }

      // Build dynamic config from podcast_config
      const dynamicConfig = {
        id: podcastConfig.id,
        podcast_id: podcastConfig.podcast_id,
        podcast_name: podcastConfig.podcast_name,
        language: podcastConfig.language,
        creator: podcastConfig.creator,
        slogan: podcastConfig.slogan || '',
        speaker1_role: podcastConfig.speaker1_role,
        speaker2_role: podcastConfig.speaker2_role,
        conversation_style: podcastConfig.conversation_style,
        mixing_techniques: podcastConfig.mixing_techniques || [],
        additional_instructions: podcastConfig.additional_instructions || '',
        creativity_level: podcastConfig.creativity_level
      };

      // Trigger Audio Lambda directly
      const triggerResult = await triggerAudioLambda(
        episodeId,
        episode.podcast_id,
        podcastConfig.id,
        scriptUrl,
        dynamicConfig
      );

      if (!triggerResult.success) {
        return {
          success: false,
          error: triggerResult.error || 'Failed to trigger Audio Lambda'
        };
      }

      console.log(`[REGENERATE_AUDIO] Successfully triggered Audio Lambda`);
    }

    // Revalidate paths
    revalidateEpisodePaths(episodeId, episode.podcast_id);

    return { success: true };
  } catch (error) {
    logError('regenerateEpisodeAudio', error);
    return {
      success: false,
      error: `Failed to regenerate episode audio: ${errorToString(error)}`
    };
  }
} 