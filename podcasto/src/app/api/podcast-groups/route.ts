import { NextResponse } from 'next/server';
import { ensureAdmin } from '@/lib/api/ensure-admin';
import { fetchPodcastGroupsWithLanguages } from './fetch-groups';

/**
 * GET /api/podcast-groups
 *
 * Fetch all podcast groups with their language variants
 * Requires admin authentication
 */
export async function GET() {
  try {
    const adminCheck = await ensureAdmin({ logContext: '[API] GET /api/podcast-groups' });
    if (!adminCheck.ok) {
      return adminCheck.response;
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
