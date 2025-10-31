/**
 * Episode Image Proxy API Endpoint
 *
 * Serves episode cover images through a proxy, hiding CloudFront URLs from the client.
 * This is the same pattern used for audio files.
 *
 * Architecture:
 * - Client requests: /api/images/episodes/[id]
 * - Server fetches episode data from database
 * - Server gets CloudFront URL from database
 * - Server fetches image from CloudFront
 * - Server streams image back to client
 *
 * Benefits:
 * - Infrastructure URLs (CloudFront/S3) completely hidden from client
 * - Single URL format: /api/images/episodes/[id]
 * - Proper caching headers
 * - Falls back to podcast image if episode has no cover
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { episodes, podcasts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getBestImageUrl } from '@/lib/utils/image-url-utils';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: episodeId } = await context.params;

    // 1. Fetch episode data DIRECTLY from DB (no transformation)
    const episode = await db.query.episodes.findFirst({
      where: eq(episodes.id, episodeId)
    });

    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }

    // 2. Get RAW image URL from database and transform to CloudFront
    // If episode has no cover, try podcast cover
    let rawImageUrl = episode.cover_image;

    if (!rawImageUrl && episode.podcast_id) {
      const podcast = await db.query.podcasts.findFirst({
        where: eq(podcasts.id, episode.podcast_id)
      });
      rawImageUrl = podcast?.cover_image || null;
    }

    if (!rawImageUrl) {
      return NextResponse.json(
        { error: 'Episode has no cover image' },
        { status: 404 }
      );
    }

    // 3. Transform raw URL to CloudFront URL
    const imageUrl = getBestImageUrl(rawImageUrl);

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image URL' },
        { status: 500 }
      );
    }

    // 4. Fetch image from CloudFront/S3
    const imageResponse = await fetch(imageUrl, {
      // Next.js automatically adds caching for fetch requests
      next: { revalidate: 31536000 } // Cache for 1 year
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
      return NextResponse.json(
        { error: 'Failed to load image' },
        { status: imageResponse.status }
      );
    }

    // 5. Prepare response headers
    const responseHeaders = new Headers();

    // Copy content type from CloudFront response
    const contentType = imageResponse.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }

    // Copy content length if available
    const contentLength = imageResponse.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    // Add aggressive caching headers (images don't change)
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

    // Add ETag if available
    const etag = imageResponse.headers.get('etag');
    if (etag) {
      responseHeaders.set('ETag', etag);
    }

    // 5. Stream image to client
    return new NextResponse(imageResponse.body, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Error in episode image proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
