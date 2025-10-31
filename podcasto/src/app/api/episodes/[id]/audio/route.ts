/**
 * Audio Proxy API Endpoint
 *
 * Serves episode audio files through a proxy, hiding CloudFront URLs from the client.
 * Similar to how Next.js Image Optimization works for images.
 *
 * Architecture:
 * - Client requests: /api/episodes/[id]/audio
 * - Server fetches audio from CloudFront/S3
 * - Server streams audio back to client
 *
 * Benefits:
 * - Infrastructure URLs (CloudFront/S3) completely hidden from client
 * - Single URL format: /api/episodes/[id]/audio
 * - Support for range requests (seeking in audio player)
 * - Proper caching headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEpisodeById } from '@/lib/db/api/episodes';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: episodeId } = await context.params;

    // 1. Fetch episode data
    const episode = await getEpisodeById(episodeId);

    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }

    // 2. Get audio URL (already transformed to CloudFront by database layer)
    const audioUrl = episode.audio_url;

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Episode has no audio file' },
        { status: 404 }
      );
    }

    // 3. Get range header for seeking support
    const range = request.headers.get('range');

    // 4. Fetch audio from CloudFront/S3
    const fetchHeaders: HeadersInit = {};
    if (range) {
      fetchHeaders['Range'] = range;
    }

    const audioResponse = await fetch(audioUrl, {
      headers: fetchHeaders,
    });

    if (!audioResponse.ok) {
      console.error(`Failed to fetch audio: ${audioResponse.status} ${audioResponse.statusText}`);
      return NextResponse.json(
        { error: 'Failed to load audio file' },
        { status: audioResponse.status }
      );
    }

    // 5. Prepare response headers
    const responseHeaders = new Headers();

    // Copy essential headers from CloudFront response
    const headersToProxy = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'last-modified',
      'etag',
    ];

    for (const header of headersToProxy) {
      const value = audioResponse.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    }

    // Add caching headers
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

    // 6. Stream audio to client
    return new NextResponse(audioResponse.body, {
      status: range ? 206 : 200, // 206 Partial Content for range requests
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Error in audio proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
