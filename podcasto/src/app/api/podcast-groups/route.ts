import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { db } from '@/lib/db';
import { podcastGroups, podcastLanguages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
    const groups = await db
      .select({
        id: podcastGroups.id,
        base_title: podcastGroups.base_title,
        base_description: podcastGroups.base_description,
        base_cover_image: podcastGroups.base_cover_image,
        created_at: podcastGroups.created_at,
        updated_at: podcastGroups.updated_at,
      })
      .from(podcastGroups)
      .orderBy(podcastGroups.created_at);

    // Fetch languages for each group
    const groupsWithLanguages = await Promise.all(
      groups.map(async (group) => {
        const languages = await db
          .select({
            id: podcastLanguages.id,
            language_code: podcastLanguages.language_code,
            title: podcastLanguages.title,
            is_primary: podcastLanguages.is_primary,
            podcast_id: podcastLanguages.podcast_id,
          })
          .from(podcastLanguages)
          .where(eq(podcastLanguages.podcast_group_id, group.id))
          .orderBy(podcastLanguages.language_code);

        return {
          ...group,
          languages,
          language_count: languages.length,
        };
      })
    );

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
