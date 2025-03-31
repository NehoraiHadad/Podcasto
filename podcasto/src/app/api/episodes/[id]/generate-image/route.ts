import { NextRequest, NextResponse } from 'next/server';
import { episodesApi } from '@/lib/db/api';
import { createPostProcessingService } from '@/lib/services/post-processing';
// Import waitUntil from Vercel Functions
import { waitUntil } from '@vercel/functions';

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
  try {
    // Wait for the params to be resolved
    const resolvedParams = await params;
    console.log(`[IMAGE_GENERATOR] Generate image request for episode ${resolvedParams.id}`);
    
    // 1. Verify authorization
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[IMAGE_GENERATOR] Authorization failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Get episode data
    const episode = await episodesApi.getEpisodeById(resolvedParams.id);
    if (!episode) {
      console.error(`[IMAGE_GENERATOR] Episode ${resolvedParams.id} not found`);
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }
    
    if (!episode.podcast_id) {
      console.error(`[IMAGE_GENERATOR] Episode ${resolvedParams.id} has no podcast_id`);
      return NextResponse.json({ error: 'Episode has no podcast_id' }, { status: 400 });
    }
    
    // 3. Get request body with summary
    const body = await request.json();
    const { summary } = body;
    
    if (!summary) {
      console.error(`[IMAGE_GENERATOR] No summary provided for episode ${resolvedParams.id}`);
      return NextResponse.json({ error: 'No summary provided' }, { status: 400 });
    }
    
    // Return immediately with a 202 Accepted response
    const response = NextResponse.json({
      success: true,
      message: 'Image generation started',
      status: 'processing'
    }, { status: 202 });
    
    // 4. Initialize post-processing service
    const aiApiKey = process.env.GEMINI_API_KEY;
    const s3Region = process.env.AWS_REGION;
    const s3Bucket = process.env.S3_BUCKET_NAME;
    const s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    // Check if required environment variables are available
    if (!aiApiKey || !s3Region || !s3Bucket || !s3AccessKeyId || !s3SecretAccessKey) {
      console.error('[IMAGE_GENERATOR] Missing required environment variables');
      return response;
    }
    
    // Use waitUntil with a Promise directly
    waitUntil(generateImageInBackground(
      resolvedParams.id,
      episode.podcast_id as string,
      summary,
      aiApiKey,
      s3Region,
      s3Bucket,
      s3AccessKeyId,
      s3SecretAccessKey
    ));
    
    return response;
  } catch (error) {
    console.error('[IMAGE_GENERATOR] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Add this async function outside of the POST handler
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
      console.log(`[IMAGE_GENERATOR] Successfully generated image for episode ${episodeId}`);
    } else {
      console.error(`[IMAGE_GENERATOR] Failed to generate image for episode ${episodeId}`);
    }
  } catch (error) {
    console.error('[IMAGE_GENERATOR] Background processing error:', error);
  }
} 