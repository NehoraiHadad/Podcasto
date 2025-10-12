/**
 * Test endpoint for email notifications
 * Usage: GET /api/test/send-email?episodeId=xxx&secret=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendNewEpisodeNotification } from '@/lib/services/email-notification';

export async function GET(request: NextRequest) {
  // Check for secret to prevent unauthorized use
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const episodeId = request.nextUrl.searchParams.get('episodeId');

  if (!episodeId) {
    return NextResponse.json(
      { error: 'Missing episodeId parameter' },
      { status: 400 }
    );
  }

  try {
    console.log(`[TEST_EMAIL_API] Testing email notification for episode: ${episodeId}`);

    const result = await sendNewEpisodeNotification(episodeId);

    return NextResponse.json({
      success: true,
      message: 'Email notification test completed',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEST_EMAIL_API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
