import { NextResponse } from 'next/server';
import { getUser, isAdmin } from '@/lib/auth';
import { fetchPodcastGroupsWithLanguages } from './fetch-groups';

/**
 * GET /api/podcast-groups
 *
 * Fetch all podcast groups with their language variants
 * Requires admin authentication
 */
export async function GET() {
  try {
    // Check authentication
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role using cached role queries
    const hasAdminAccess = await isAdmin(user.id);

    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all podcast groups with their languages
    const groupsWithLanguages = await fetchPodcastGroupsWithLanguages();

    // Serialize dates
    const serialized = groupsWithLanguages.map((group) => ({
      ...group,
      created_at: group.created_at?.toISOString() || null,
      updated_at: group.updated_at?.toISOString() || null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching podcast groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch podcast groups' },
      { status: 500 }
    );
  }
}
