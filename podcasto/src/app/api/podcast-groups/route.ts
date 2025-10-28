import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
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
