import { NextRequest, NextResponse } from 'next/server';
import { episodesApi } from '@/lib/db/api';
import { createPostProcessingService } from '@/lib/services/post-processing';
import { waitUntil } from '@vercel/functions';
import {
  apiError,
  validateCronAuth,
  logError,
  validateEnvVars
} from '@/lib/api';

// Set longer execution time and specify runtime
export const maxDuration = 60; // 60 seconds
export const runtime = 'nodejs'; // Use Node.js runtime for better compatibility

/**
 * Generate image for an episode (POST /api/episodes/:id/generate-image)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logPrefix = '[IMAGE_GENERATOR]';

  try {
    // Wait for the params to be resolved
    const resolvedParams = await params;
    console.log(`${logPrefix} Generate image request for episode ${resolvedParams.id}`);

    // 1. Verify authorization
    const authResult = validateCronAuth(request);
    if (!authResult.valid) {
      logError(logPrefix, new Error('Unauthorized image generation attempt'), {
        episodeId: resolvedParams.id
      });
      return apiError(authResult.error || 'Unauthorized', 401);
    }

    // 2. Get episode data
    const episode = await episodesApi.getEpisodeById(resolvedParams.id);
    if (!episode) {
      logError(logPrefix, new Error('Episode not found'), {
        episodeId: resolvedParams.id
      });
      return apiError('Episode not found', 404);
    }

    if (!episode.podcast_id) {
      logError(logPrefix, new Error('Episode has no podcast_id'), {
        episodeId: resolvedParams.id
      });
      return apiError('Episode has no podcast_id', 400);
    }

    // 3. Get request body with summary
    const body = await request.json();
    const { summary } = body;

    if (!summary) {
      logError(logPrefix, new Error('No summary provided'), {
        episodeId: resolvedParams.id
      });
      return apiError('No summary provided', 400);
    }

    // 4. Validate required environment variables
    const envResult = validateEnvVars([
      'GEMINI_API_KEY',
      'AWS_REGION',
      'S3_BUCKET_NAME',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ]);

    if (!envResult.success) {
      logError(logPrefix, new Error('Missing required environment variables'), {
        episodeId: resolvedParams.id,
        missing: envResult.error
      });
      // Return 202 Accepted even with missing env vars (non-blocking)
      return NextResponse.json({
        success: true,
        message: 'Image generation started',
        status: 'processing'
      }, { status: 202 });
    }

    // 5. Return immediately with a 202 Accepted response
    const response = NextResponse.json({
      success: true,
      message: 'Image generation started',
      status: 'processing'
    }, { status: 202 });

    // 6. Use waitUntil with a Promise directly
    waitUntil(generateImageInBackground(
      resolvedParams.id,
      episode.podcast_id as string,
      summary,
      process.env.GEMINI_API_KEY!,
      process.env.AWS_REGION!,
      process.env.S3_BUCKET_NAME!,
      process.env.AWS_ACCESS_KEY_ID!,
      process.env.AWS_SECRET_ACCESS_KEY!
    ));

    return response;
  } catch (error) {
    const resolvedParams = await params;
    logError(logPrefix, error, { episodeId: resolvedParams.id });
    return apiError(error instanceof Error ? error : new Error(String(error)), 500);
  }
}

/**
 * Background image generation handler
 */
async function generateImageInBackground(
  episodeId: string,
  podcastId: string,
  summary: string,
  aiApiKey: string,
  s3Region: string,
  s3Bucket: string,
  s3AccessKeyId: string,
  s3SecretAccessKey: string
) {
  const logPrefix = '[IMAGE_GENERATOR]';

  try {
    // Create post-processing service
    const postProcessingService = createPostProcessingService({
      s3: {
        region: s3Region,
        bucket: s3Bucket,
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      },
      ai: {
        provider: 'gemini',
        apiKey: aiApiKey,
      },
    });

    // Generate image in background
    const success = await postProcessingService.generateEpisodeImage(
      episodeId,
      podcastId,
      summary
    );

    if (success) {
      console.log(`${logPrefix} Successfully generated image for episode ${episodeId}`);
    } else {
      console.error(`${logPrefix} Failed to generate image for episode ${episodeId}`);
    }
  } catch (error) {
    logError(logPrefix, error, {
      episodeId,
      podcastId,
      context: 'Background processing'
    });
  }
}
