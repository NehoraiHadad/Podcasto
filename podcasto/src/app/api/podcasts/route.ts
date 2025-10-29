import { NextRequest, NextResponse } from 'next/server';
import { getAllPodcastsBasic, getPodcastsEligibleForMigration } from '@/lib/db/api/podcasts/queries';
import { ensureAdmin } from '@/lib/api/ensure-admin';

/**
 * GET /api/podcasts
 *
 * Fetch podcasts with optional filters
 * Query params:
 * - eligible_for_migration: boolean - if true, only returns podcasts not in groups
 */
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await ensureAdmin({ logContext: '[API] GET /api/podcasts' });
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const eligibleForMigration = searchParams.get('eligible_for_migration') === 'true';

    // Fetch podcasts
    const podcasts = eligibleForMigration
      ? await getPodcastsEligibleForMigration()
      : await getAllPodcastsBasic();

    // Return serialized data (convert dates to strings)
    const serializedPodcasts = podcasts.map(podcast => ({
      ...podcast,
      created_at: podcast.created_at ? podcast.created_at.toISOString() : null,
      updated_at: podcast.updated_at ? podcast.updated_at.toISOString() : null,
    }));

    return NextResponse.json(serializedPodcasts);
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch podcasts' },
      { status: 500 }
    );
  }
}
