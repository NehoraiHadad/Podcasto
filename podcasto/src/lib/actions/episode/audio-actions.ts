'use server';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getEpisodeById } from '@/lib/db/api/episodes';
import { episodesApi } from '@/lib/db/api';
import { getPodcastConfigByPodcastId } from '@/lib/db/api/podcast-configs';
import { getPodcastById } from '@/lib/db/api/podcasts';
import { requireAdmin } from '@/lib/auth';
import { parseS3Uri, verifyS3ObjectExists, createS3Client } from '@/lib/utils/s3-utils';
import { getBestUrlForS3Object, type UrlSource } from '@/lib/utils/s3-url-utils';
import { errorToString, logError } from '@/lib/utils/error-utils';
import { revalidateEpisodePaths } from '@/lib/utils/revalidation-utils';
import { EPISODE_CONSTANTS } from '@/lib/constants/episode-constants';
import { languageCodeToFull } from '@/lib/utils/language-mapper';
import { AWS_CONSTANTS } from '@/lib/constants/aws-constants';

/**
 * Generate an audio URL for an episode with CloudFront CDN support
 *
 * Architecture:
 * - CloudFront enabled: Returns CloudFront URL for optimized global delivery
 * - CloudFront disabled: Returns presigned S3 URL (7-day expiry)
 *
 * @param episodeId - The episode ID
 * @returns Object with URL, source (cloudfront|s3), and optional error
 */
export async function getEpisodeAudioUrl(
  episodeId: string
): Promise<{
  url: string;
  source?: UrlSource;
  error?: string;
}> {
  try {
    console.log('=== Start getEpisodeAudioUrl ===');
    console.log('Episode ID:', episodeId);
    console.log('CloudFront enabled:', AWS_CONSTANTS.USE_CLOUDFRONT);

    // 1. Fetch episode data
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

    // 2. Validate audio URL exists
    if (!audioUrl) {
      console.error('Episode has no audio URL');
      return {
        url: '',
        error: 'Episode has no audio URL'
      };
    }

    // 3. Try CloudFront first, fall back to S3 presigned URL
    const { url, source, error } = getBestUrlForS3Object(audioUrl, false);

    if (error || !url) {
      console.error('Failed to generate URL via getBestUrlForS3Object:', error);

      // Fallback to legacy presigned URL generation
      console.log('Falling back to legacy presigned URL generation...');

      // Parse S3 URI
      const s3UriParts = await parseS3Uri(audioUrl);

      if (!s3UriParts) {
        console.error('Invalid S3 URI format:', audioUrl);
        return {
          url: '',
          error: `Invalid S3 URI format: ${audioUrl}`
        };
      }

      const { bucket, key } = s3UriParts;

      // Create S3 client
      const { client: s3Client, error: clientError } = await createS3Client();

      if (!s3Client) {
        console.error('Failed to create S3 client:', clientError);
        return {
          url: '',
          error: clientError || 'Unknown error creating S3 client'
        };
      }

      // Verify object exists
      const objectExists = await verifyS3ObjectExists(s3Client, bucket, key);
      if (!objectExists) {
        console.error('S3 object does not exist or is not accessible');
        return {
          url: '',
          error: `S3 object not found or inaccessible: ${bucket}/${key}`
        };
      }

      // Generate presigned URL
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: EPISODE_CONSTANTS.PRESIGNED_URL_EXPIRY_SECONDS
      });

      console.log('Generated legacy presigned URL');
      console.log('=== End getEpisodeAudioUrl - Success (S3 Fallback) ===');
      return { url: presignedUrl, source: 's3' };
    }

    // 4. Success - return URL with source
    console.log(`Generated ${source} URL:`, url);
    console.log('=== End getEpisodeAudioUrl - Success ===');
    return { url, source };

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

    // Get podcast to access language_code
    const podcast = await getPodcastById(episode.podcast_id);

    if (!podcast) {
      return {
        success: false,
        error: 'Podcast not found'
      };
    }

    // Convert language code to full name for Lambda functions
    const languageFullName = languageCodeToFull(podcast.language_code || 'en');

    // Reset episode status to pending
    await episodesApi.updateEpisode(episodeId, {
      status: 'pending'
    });

    console.log(`[REGENERATE_AUDIO] Reset episode ${episodeId} status to pending`);

    // Import utilities
    const { triggerScriptLambda, triggerAudioLambda } = await import('@/lib/aws/lambda-triggers');
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

      // Use existing Lambda invocation function
      const { invokeLambdaFunction } = await import('@/lib/actions/podcast/generation/lambda-invocation');

      // Build podcast config object
      const podcastConfigObj = {
        id: podcastConfig.id,
        telegram_channel: podcastConfig.telegram_channel || '',
        telegram_hours: podcastConfig.telegram_hours || 24,
        episode_id: episodeId,
        podcast_id: episode.podcast_id,
      };

      // Build date range if dates provided
      const dateRange = episode.content_start_date && episode.content_end_date ? {
        startDate: new Date(episode.content_start_date),
        endDate: new Date(episode.content_end_date)
      } : undefined;

      // Trigger Telegram Lambda to fetch fresh data
      const triggerResult = await invokeLambdaFunction({
        podcastId: episode.podcast_id,
        episodeId,
        podcastConfig: podcastConfigObj,
        timestamp: new Date().toISOString(),
        dateRange
      });

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
        console.error(`[REGENERATE_AUDIO] No Telegram data URL found for episode ${episodeId}`);
        console.error(`[REGENERATE_AUDIO] episode.metadata:`, episode.metadata);
        return {
          success: false,
          error: 'No Telegram data found for this episode. This episode may not have reached the Telegram fetching stage. Please use "Full Regeneration" mode to fetch fresh data from Telegram.'
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

      // Get script URL from episode database or metadata
      let scriptUrl = episode.script_url;

      // If not in script_url field, try to find in metadata
      if (!scriptUrl) {
        const metadata = typeof episode.metadata === 'string' ? JSON.parse(episode.metadata) : episode.metadata;
        scriptUrl = metadata?.script_url || metadata?.preprocessed_script_url;
      }

      if (!scriptUrl) {
        console.error(`[REGENERATE_AUDIO] No script URL found for episode ${episodeId}`);
        console.error(`[REGENERATE_AUDIO] episode.status: ${episode.status}`);
        console.error(`[REGENERATE_AUDIO] episode.script_url: ${episode.script_url}`);
        console.error(`[REGENERATE_AUDIO] episode.metadata:`, episode.metadata);

        // For episodes in script_ready status, they should have script_url in the episodes table
        // If status is script_ready but no script_url, the episode data is inconsistent
        if (episode.status === 'script_ready') {
          return {
            success: false,
            error: 'Episode is marked as "script_ready" but script URL is missing from database. This indicates data inconsistency. Please use "Script + Audio" mode to regenerate the script first, or "Full Regeneration" to start fresh.'
          };
        }

        return {
          success: false,
          error: 'No script found for this episode. This episode may not have reached the script generation stage. Please use "Script + Audio" mode (which will use existing Telegram data) or "Full Regeneration" mode (which will fetch fresh data).'
        };
      }

      // Build dynamic config from podcast_config
      const dynamicConfig = {
        id: podcastConfig.id,
        podcast_id: podcastConfig.podcast_id,
        podcast_name: podcastConfig.podcast_name,
        language: languageFullName, // Converted from podcasts.language_code
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