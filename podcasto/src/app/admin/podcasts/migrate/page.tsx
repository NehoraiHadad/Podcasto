import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { PodcastMigrationTabsServer } from '@/components/admin/podcast-migration-tabs';
import type { MigrationPodcast, MigrationPodcastGroup } from '@/components/admin/podcast-migration-types';
import { getPodcastsEligibleForMigration } from '@/lib/db/api/podcasts/queries';
import { fetchPodcastGroupsWithLanguages } from '@/app/api/podcast-groups/fetch-groups';

export const metadata = {
  title: 'Migrate Podcasts | Admin Dashboard | Podcasto',
  description: 'Merge podcasts into multilingual groups',
};

export const dynamic = 'force-dynamic';

export default async function MigratePodcastsPage() {
  // Ensure user is an admin
  await checkIsAdmin({ redirectOnFailure: true });

  const [eligiblePodcasts, groups] = await Promise.all([
    getPodcastsEligibleForMigration(),
    fetchPodcastGroupsWithLanguages(),
  ]);

  const serializedPodcasts: MigrationPodcast[] = eligiblePodcasts.map(podcast => ({
    id: podcast.id,
    title: podcast.title,
    description: podcast.description,
    cover_image: podcast.cover_image,
    created_at: podcast.created_at ? podcast.created_at.toISOString() : null,
    updated_at: podcast.updated_at ? podcast.updated_at.toISOString() : null,
    podcast_group_id: podcast.podcast_group_id,
  }));

  const serializedGroups: MigrationPodcastGroup[] = groups.map(group => ({
    id: group.id,
    base_title: group.base_title,
    base_description: group.base_description,
    base_cover_image: group.base_cover_image,
    created_at: group.created_at ? group.created_at.toISOString() : null,
    updated_at: group.updated_at ? group.updated_at.toISOString() : null,
    language_count: group.language_count,
    languages: group.languages,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Podcast Groups</h1>
        <p className="text-muted-foreground mt-2">
          Create new podcast groups from multiple podcasts, or add legacy podcasts to existing groups.
          This allows users to switch between language variants seamlessly.
        </p>
      </div>

      <PodcastMigrationTabsServer podcasts={serializedPodcasts} groups={serializedGroups} />
    </div>
  );
}
