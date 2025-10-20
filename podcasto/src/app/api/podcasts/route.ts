import { NextRequest, NextResponse } from 'next/server';
import { getAllPodcastsBasic } from '@/lib/db/api/podcasts/queries';
import { createServerClient } from '@/lib/auth';

/**
 * GET /api/podcasts
 *
 * Fetch podcasts with optional filters
 * Query params:
 * - eligible_for_migration: boolean - if true, only returns podcasts not in groups
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single<{ role: string }>();

    if (!userRoles || userRoles.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const eligibleForMigration = searchParams.get('eligible_for_migration') === 'true';

    // Fetch podcasts
    let podcasts = await getAllPodcastsBasic();

    // Filter for migration eligibility if requested
    if (eligibleForMigration) {
      podcasts = podcasts.filter(p => !p.podcast_group_id);
    }

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
