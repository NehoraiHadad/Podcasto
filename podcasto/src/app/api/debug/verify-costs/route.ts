import { db } from '@/lib/db';
import { episodes, episodeCosts, costTrackingEvents } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the most recent episode
    const recentEpisode = await db
      .select({ id: episodes.id, title: episodes.title, createdAt: episodes.created_at })
      .from(episodes)
      .orderBy(desc(episodes.created_at))
      .limit(1);

    if (recentEpisode.length === 0) {
      return NextResponse.json({ error: 'No episodes found' }, { status: 404 });
    }

    const episodeId = recentEpisode[0].id;

    // Get cost summary
    const costSummary = await db
      .select()
      .from(episodeCosts)
      .where(eq(episodeCosts.episode_id, episodeId))
      .limit(1);

    // Get all cost events
    const events = await db
      .select()
      .from(costTrackingEvents)
      .where(eq(costTrackingEvents.episode_id, episodeId))
      .orderBy(desc(costTrackingEvents.timestamp));

    // Group events by service
    const eventsByService: Record<string, typeof events> = {};
    events.forEach((event) => {
      if (!eventsByService[event.service]) {
        eventsByService[event.service] = [];
      }
      eventsByService[event.service].push(event);
    });

    // Calculate stats per service
    const serviceStats = Object.entries(eventsByService).map(([service, serviceEvents]) => {
      const totalCost = serviceEvents.reduce((sum, e) => sum + parseFloat(e.total_cost_usd), 0);
      const totalQuantity = serviceEvents.reduce((sum, e) => sum + parseFloat(e.quantity), 0);

      return {
        service,
        eventCount: serviceEvents.length,
        totalQuantity,
        unit: serviceEvents[0].unit,
        unitCost: serviceEvents[0].unit_cost_usd,
        totalCost: totalCost.toFixed(6),
        sampleEvent: {
          quantity: serviceEvents[0].quantity,
          unit: serviceEvents[0].unit,
          unitCost: serviceEvents[0].unit_cost_usd,
          totalCost: serviceEvents[0].total_cost_usd,
          metadata: serviceEvents[0].metadata,
        },
      };
    });

    return NextResponse.json({
      episode: {
        id: episodeId,
        title: recentEpisode[0].title,
        createdAt: recentEpisode[0].createdAt,
      },
      summary: costSummary.length > 0 ? {
        totalCost: costSummary[0].total_cost_usd,
        aiTextCost: costSummary[0].ai_text_cost_usd,
        aiImageCost: costSummary[0].ai_image_cost_usd,
        aiTtsCost: costSummary[0].ai_tts_cost_usd,
        lambdaCost: costSummary[0].lambda_execution_cost_usd,
        s3OpsCost: costSummary[0].s3_operations_cost_usd,
        emailCost: costSummary[0].email_cost_usd,
        sqsCost: costSummary[0].sqs_cost_usd,
        totalTokens: costSummary[0].total_tokens,
        totalEmailsSent: costSummary[0].total_emails_sent,
        totalS3Operations: costSummary[0].total_s3_operations,
      } : null,
      events: {
        total: events.length,
        byService: serviceStats,
      },
      pricing: {
        geminiText: '$0.00000075 per token',
        geminiImage: '$0.01 per image',
        s3Put: '$0.000005 per request',
        sesEmail: '$0.0001 per email',
        sqsRequest: '$0.0000004 per request',
      },
      verification: {
        hasSummary: costSummary.length > 0,
        hasEvents: events.length > 0,
        servicesTracked: Object.keys(eventsByService),
        expectedServices: ['gemini_text', 's3_put', 'sqs'],
        missingServices: ['gemini_text', 's3_put', 'sqs'].filter(
          s => !Object.keys(eventsByService).includes(s)
        ),
      },
    });
  } catch (error) {
    console.error('Error verifying costs:', error);
    return NextResponse.json(
      { error: 'Failed to verify costs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
