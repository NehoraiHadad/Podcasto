import { NextRequest, NextResponse } from 'next/server';
import { episodesApi, podcastConfigsApi } from '@/lib/db/api';
import { GooglePodcastGenerator } from '@/lib/services/google-podcast-generator';
import { S3Client } from '@/lib/services/s3-client';
import { TelegramDataService } from '@/lib/services/telegram-data-service';

interface GenerateAudioRequest {
  episodeId: string;
  podcastId: string;
  telegramDataPath?: string;
  s3Path?: string; // From SQS message
  timestamp?: string; // From SQS message
}

/**
 * GET method - Manual trigger for CRON jobs
 * Finds pending episodes and processes them with Google TTS
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    console.log('[GOOGLE_AUDIO_GEN] Manual trigger started - checking auth');
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.log('[GOOGLE_AUDIO_GEN] Auth failed:', { hasSecret: !!cronSecret, hasAuth: !!authHeader });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GOOGLE_AUDIO_GEN] Auth successful, finding pending episodes');

    // Find episodes that have content collected and need audio generation
    const pendingEpisodes = await episodesApi.getEpisodesByStatus(['content_collected']);
    
    console.log(`[GOOGLE_AUDIO_GEN] Found ${pendingEpisodes?.length || 0} episodes with content_collected status`);
    
    if (!pendingEpisodes || pendingEpisodes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No episodes with content_collected status found',
        timestamp: new Date().toISOString(),
        processed: 0,
        errors: 0,
        results: []
      });
    }

    console.log(`[GOOGLE_AUDIO_GEN] Episodes to process:`, pendingEpisodes.map(e => ({ id: e.id, title: e.title, status: e.status })));

    // Return immediate response and process in background
    const responsePromise = Promise.resolve({
      success: true,
      message: `Started processing ${pendingEpisodes.length} episodes in background`,
      timestamp: new Date().toISOString(),
      episodes: pendingEpisodes.map(e => ({ id: e.id, title: e.title })),
      status: 'processing_started'
    });

    // Start background processing (don't await)
    processEpisodesInBackground(pendingEpisodes);

    return NextResponse.json(await responsePromise);

  } catch (error) {
    console.error('[GOOGLE_AUDIO_GEN] Error in manual trigger:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Manual trigger failed'
      },
      { status: 500 }
    );
  }
}

/**
 * POST method - Original SQS-triggered generation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let episodeId: string | undefined;

  try {
    // Parse request body
    const body: GenerateAudioRequest = await request.json();
    episodeId = body.episodeId;

    if (!episodeId) {
      return NextResponse.json(
        { success: false, error: 'Episode ID is required' },
        { status: 400 }
      );
    }

    console.log(`[AUDIO_GEN] Starting audio generation for episode: ${episodeId}`);

    const result = await generateAudioForEpisode(body);

    const processingTime = Date.now() - startTime;
    console.log(`[AUDIO_GEN] Successfully generated audio for episode ${episodeId} in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      episodeId,
      audioUrl: result.audioUrl,
      duration: result.duration,
      processingTime
    });

  } catch (error) {
    console.error(`[AUDIO_GEN] Error generating audio:`, error);

    // Update episode status to 'failed' if we have an episode ID
    if (episodeId) {
      try {
        await updateEpisodeStatus(episodeId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      } catch (updateError) {
        console.error(`[AUDIO_GEN] Failed to update episode status:`, updateError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Audio generation failed'
      },
      { status: 500 }
    );
  }
}

/**
 * Process episodes in background without blocking the response
 */
async function processEpisodesInBackground(episodes: Array<{ id: string; title: string; podcast_id: string | null }>) {
  let processed = 0;
  let errors = 0;

  console.log(`[GOOGLE_AUDIO_GEN] Background processing started for ${episodes.length} episodes`);

  for (const episode of episodes) {
    try {
      console.log(`[GOOGLE_AUDIO_GEN] Processing episode: ${episode.id} - ${episode.title}`);
      
      // Call the internal generation function
      await generateAudioForEpisode({
        episodeId: episode.id,
        podcastId: episode.podcast_id!
      });

      processed++;
      console.log(`[GOOGLE_AUDIO_GEN] Successfully processed episode: ${episode.id}`);

    } catch (error) {
      console.error(`[GOOGLE_AUDIO_GEN] Error processing episode ${episode.id}:`, error);
      errors++;

      // Update episode status to failed
      await updateEpisodeStatus(episode.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  console.log(`[GOOGLE_AUDIO_GEN] Background processing completed. Processed: ${processed}, Errors: ${errors}`);
}

/**
 * Internal function to generate audio for a single episode
 */
async function generateAudioForEpisode(params: GenerateAudioRequest) {
  const { episodeId, s3Path, telegramDataPath } = params;

  // Update episode status to 'processing'
  await updateEpisodeStatus(episodeId, 'processing');

  // Get episode and podcast configuration
  const episode = await episodesApi.getEpisodeById(episodeId);
  if (!episode) {
    throw new Error('Episode not found');
  }

  if (!episode.podcast_id) {
    throw new Error('Episode podcast_id is missing');
  }

  const podcastConfig = await podcastConfigsApi.getPodcastConfigByPodcastId(episode.podcast_id);
  if (!podcastConfig) {
    throw new Error('Podcast configuration not found');
  }

  // Get Telegram data from S3 - use path from SQS message if available
  const telegramService = new TelegramDataService();
  const dataPath = s3Path || telegramDataPath;
  
  const telegramData = await telegramService.getTelegramData(
    episode.podcast_id!,
    episodeId,
    dataPath
  );

  if (!telegramData) {
    throw new Error('No Telegram data found for this episode');
  }

  // Generate podcast using Google services
  const generator = new GooglePodcastGenerator({
    language: podcastConfig.language || 'english',
    speaker1_role: podcastConfig.speaker1_role || 'host',
    speaker2_role: podcastConfig.speaker2_role || 'expert',
    podcast_name: podcastConfig.podcast_name || 'Podcast',
    creativity_level: podcastConfig.creativity_level || 70,
    additional_instructions: podcastConfig.additional_instructions || ''
  });
  
  const result = await generator.generatePodcast({
    episodeId,
    podcastId: episode.podcast_id!,
    telegramData,
    language: podcastConfig.language || 'english'
  });

  // Upload to S3
  const s3Client = new S3Client();
  const s3Url = await s3Client.uploadAudio(
    result.audioBuffer,
    episode.podcast_id!,
    episodeId,
    'wav'
  );

  // Update episode with results
  await episodesApi.updateEpisode(episodeId, {
    audio_url: s3Url,
    duration: result.duration,
    status: 'completed',
    description: result.description || episode.description,
    title: result.title || episode.title
  });

  return {
    audioUrl: s3Url,
    duration: result.duration
  };
}

/**
 * Updates episode status and optionally error message
 */
async function updateEpisodeStatus(
  episodeId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
) {
  const updateData: { status: string; metadata?: string } = { status };
  
  if (status === 'failed' && errorMessage) {
    // Store error in metadata
    const episode = await episodesApi.getEpisodeById(episodeId);
    const metadata = episode?.metadata ? JSON.parse(episode.metadata) : {};
    metadata.error = errorMessage;
    metadata.failed_at = new Date().toISOString();
    updateData.metadata = JSON.stringify(metadata);
  }

  if (status === 'processing') {
    const episode = await episodesApi.getEpisodeById(episodeId);
    const metadata = episode?.metadata ? JSON.parse(episode.metadata) : {};
    metadata.processing_started_at = new Date().toISOString();
    updateData.metadata = JSON.stringify(metadata);
  }

  await episodesApi.updateEpisode(episodeId, updateData);
  console.log(`[AUDIO_GEN] Updated episode ${episodeId} status to: ${status}`);
} 